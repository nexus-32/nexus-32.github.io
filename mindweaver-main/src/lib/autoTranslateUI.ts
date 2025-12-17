import { supabase } from "@/integrations/supabase/client";

type TranslateCache = Record<string, string>;

type TranslationTarget = {
  kind: "text" | "attr";
  node: Text;
  element?: Element;
  attrName?: string;
  original: string;
};

const CACHE_KEY = "mw_ui_translate_cache_v1";
const MAX_BATCH = 40;
const MAX_CACHE_KEYS = 800;

let observer: MutationObserver | null = null;
let scheduled = false;
let lastTargetLanguage = "";
let settingsHandler: (() => void) | null = null;
let didLogTranslateError = false;

const originalText = new WeakMap<Text, string>();
const originalAttr = new WeakMap<Element, Record<string, string>>();

function loadCache(): TranslateCache {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as TranslateCache;
  } catch {
    // ignore
  }
  return {};
}

function saveCache(cache: TranslateCache) {
  try {
    const keys = Object.keys(cache);
    if (keys.length > MAX_CACHE_KEYS) {
      const next: TranslateCache = {};
      keys.slice(keys.length - Math.floor(MAX_CACHE_KEYS * 0.7)).forEach((k) => {
        next[k] = cache[k];
      });
      localStorage.setItem(CACHE_KEY, JSON.stringify(next));
      return;
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

function shouldSkipText(s: string) {
  const t = s.trim();
  if (!t) return true;
  if (t.length > 240) return true;
  if (/^[\d\s\p{P}]+$/u.test(t)) return true;
  if (/^(https?:\/\/|www\.)/i.test(t)) return true;
  return false;
}

function isInsideNoTranslateText(node: Node | null) {
  let cur: Node | null = node;
  while (cur) {
    if (cur instanceof Element) {
      if (cur.closest("[data-no-translate]")) return true;
      const tag = cur.tagName;
      if (
        tag === "SCRIPT" ||
        tag === "STYLE" ||
        tag === "NOSCRIPT" ||
        tag === "CODE" ||
        tag === "PRE" ||
        tag === "TEXTAREA" ||
        tag === "INPUT" ||
        tag === "SELECT" ||
        tag === "OPTION"
      ) {
        return true;
      }
    }
    cur = cur.parentNode;
  }
  return false;
}

function isInsideNoTranslateAttr(node: Node | null) {
  let cur: Node | null = node;
  while (cur) {
    if (cur instanceof Element) {
      if (cur.closest("[data-no-translate]")) return true;
      const tag = cur.tagName;
      if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT" || tag === "CODE" || tag === "PRE") {
        return true;
      }
    }
    cur = cur.parentNode;
  }
  return false;
}

function getTargets(root: ParentNode): TranslationTarget[] {
  const out: TranslationTarget[] = [];

  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      if (!(node instanceof Text)) return NodeFilter.FILTER_REJECT;
      if (!node.parentElement) return NodeFilter.FILTER_REJECT;
      if (isInsideNoTranslateText(node)) return NodeFilter.FILTER_REJECT;
      const current = node.nodeValue ?? "";
      const base = originalText.get(node) ?? current;
      if (shouldSkipText(base)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let n: Node | null;
  while ((n = tw.nextNode())) {
    const t = n as Text;
    const current = t.nodeValue ?? "";
    if (!originalText.has(t)) originalText.set(t, current);
    out.push({ kind: "text", node: t, original: originalText.get(t) ?? current });
  }

  const elements = (root instanceof Element ? root : document.body).querySelectorAll?.("[placeholder],[title],[aria-label]") ?? [];
  elements.forEach((el) => {
    if (!(el instanceof Element)) return;
    if (isInsideNoTranslateAttr(el)) return;

    const attrs = ["placeholder", "title", "aria-label"] as const;
    attrs.forEach((attr) => {
      const v = el.getAttribute(attr);
      if (!v) return;
      const store = originalAttr.get(el) ?? {};
      if (!(attr in store)) store[attr] = v;
      originalAttr.set(el, store);
      const base = store[attr];
      if (shouldSkipText(base)) return;
      out.push({ kind: "attr", node: document.createTextNode(""), element: el, attrName: attr, original: base });
    });
  });

  return out;
}

function restoreOriginalUI() {
  const root = document.body;
  if (!root) return;

  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      if (!(node instanceof Text)) return NodeFilter.FILTER_REJECT;
      if (!originalText.has(node)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let n: Node | null;
  while ((n = tw.nextNode())) {
    const t = n as Text;
    const v = originalText.get(t);
    if (typeof v !== 'string') continue;
    try {
      if (t.nodeValue !== v) t.nodeValue = v;
    } catch {
      // ignore
    }
  }

  const elements = root.querySelectorAll?.('[placeholder],[title],[aria-label]') ?? [];
  elements.forEach((el) => {
    const attrs = originalAttr.get(el);
    if (!attrs) return;
    try {
      Object.entries(attrs).forEach(([k, v]) => {
        if (el.getAttribute(k) !== v) el.setAttribute(k, v);
      });
    } catch {
      // ignore
    }
  });
}

async function translateBatch(texts: string[], targetLanguage: string) {
  const { data, error } = await supabase.functions.invoke("translate", {
    body: { targetLanguage, texts },
  });

  if (error) {
    if (!didLogTranslateError) {
      didLogTranslateError = true;
      // eslint-disable-next-line no-console
      console.error(
        "[MindWeaver][UI Translate] translate() failed. Most common causes: (1) Edge Function 'translate' not deployed, (2) missing LOVABLE_API_KEY in Supabase secrets, (3) unauthorized/JWT required, (4) network/CORS. Error:",
        error
      );
      // eslint-disable-next-line no-console
      console.error(
        "[MindWeaver][UI Translate] If you see 401/Unauthorized: you are not logged in or function requires JWT. If you see 404/Not Found: deploy Edge Function 'translate'."
      );
    }
    throw error;
  }

  const translations = (data as any)?.translations;
  if (!Array.isArray(translations)) return texts;
  return translations.map((x: any, idx: number) => (typeof x === "string" ? x : texts[idx]));
}

export async function translateUI(targetLanguage: string) {
  if (typeof window === "undefined") return;
  if (!targetLanguage) return;

  const lang = targetLanguage.toLowerCase();
  lastTargetLanguage = lang;

  if (lang.startsWith("ru")) {
    restoreOriginalUI();
    return;
  }

  const cache = loadCache();
  const targets = getTargets(document.body);

  const byText = new Map<string, TranslationTarget[]>();
  targets.forEach((t) => {
    const key = `${lang}|${t.original}`;
    const arr = byText.get(key) ?? [];
    arr.push(t);
    byText.set(key, arr);
  });

  const uniqueKeys = Array.from(byText.keys());
  const missingKeys = uniqueKeys.filter((k) => !(k in cache));

  for (let i = 0; i < missingKeys.length; i += MAX_BATCH) {
    if (lastTargetLanguage !== lang) return;

    const slice = missingKeys.slice(i, i + MAX_BATCH);
    const originals = slice.map((k) => k.slice(lang.length + 1));

    let translated: string[];
    try {
      translated = await translateBatch(originals, lang);
    } catch {
      translated = originals;
    }

    slice.forEach((k, idx) => {
      cache[k] = translated[idx] ?? originals[idx];
    });

    saveCache(cache);
  }

  uniqueKeys.forEach((k) => {
    const translated = cache[k];
    if (!translated) return;
    const list = byText.get(k) ?? [];
    list.forEach((t) => {
      if (t.kind === "text") {
        if (t.node.nodeValue !== translated) t.node.nodeValue = translated;
      } else if (t.kind === "attr" && t.element && t.attrName) {
        if (t.element.getAttribute(t.attrName) !== translated) t.element.setAttribute(t.attrName, translated);
      }
    });
  });
}

export function startAutoTranslateUI(getTargetLanguage: () => string) {
  if (typeof window === "undefined") return;

  const run = () => {
    const lang = getTargetLanguage();
    void translateUI(lang);
  };

  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    window.setTimeout(() => {
      scheduled = false;
      run();
    }, 250);
  };

  run();

  observer?.disconnect();
  observer = new MutationObserver(() => schedule());
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["placeholder", "title", "aria-label"],
  });

  if (settingsHandler) {
    window.removeEventListener('mw-settings-changed', settingsHandler);
  }
  settingsHandler = schedule;
  window.addEventListener('mw-settings-changed', settingsHandler);
}

export function stopAutoTranslateUI() {
  observer?.disconnect();
  observer = null;
  scheduled = false;

  if (settingsHandler) {
    window.removeEventListener('mw-settings-changed', settingsHandler);
    settingsHandler = null;
  }
}
