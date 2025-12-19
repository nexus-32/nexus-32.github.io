// Language Override System for MindWeaver React App
class LanguageOverride {
  constructor() {
    this.currentLanguage = 'en';
    this.observer = null;
    this.translations = {
      en: {
        // Header and navigation
        "MindWeaver": "MindWeaver",
        "Menu": "Menu",
        "Smart Search": "Smart Search",
        "Voice Input": "Voice Input",
        "Settings": "Settings",
        
        // Main interface
        "Start Conversation": "Start Conversation",
        "New Conversation": "New Conversation",
        "Type your message...": "Type your message...",
        "Send": "Send",
        
        // Common UI elements
        "Error": "Error",
        "Success": "Success",
        "Cancel": "Cancel",
        "Save": "Save",
        "Delete": "Delete",
        "Edit": "Edit",
        
        // Settings
        "Appearance": "Appearance",
        "Voice Settings": "Voice Settings",
        "Language": "Language",
        "Font Size": "Font Size",
        "Message Spacing": "Message Spacing",
        
        // Welcome messages
        "Your AI Chief of Staff": "Your AI Chief of Staff",
        "A deeply personalized AI assistant": "A deeply personalized AI assistant"
      },
      ru: {
        // Header and navigation
        "MindWeaver": "MindWeaver",
        "Menu": "Меню",
        "Smart Search": "Умный поиск",
        "Voice Input": "Голосовой ввод",
        "Settings": "Настройки",
        
        // Main interface
        "Start Conversation": "Начать диалог",
        "New Conversation": "Новый диалог",
        "Type your message...": "Введите сообщение...",
        "Send": "Отправить",
        
        // Common UI elements
        "Error": "Ошибка",
        "Success": "Успешно",
        "Cancel": "Отмена",
        "Save": "Сохранить",
        "Delete": "Удалить",
        "Edit": "Редактировать",
        
        // Settings
        "Appearance": "Внешний вид",
        "Voice Settings": "Настройки голоса",
        "Language": "Язык",
        "Font Size": "Размер шрифта",
        "Message Spacing": "Отступы сообщений",
        
        // Welcome messages
        "Your AI Chief of Staff": "Ваш AI начальник штаба",
        "A deeply personalized AI assistant": "Глубоко персонализированный AI помощник"
      }
    };
    
    this.init();
  }
  
  init() {
    // Get initial language
    const saved = localStorage.getItem('mindweaver-language');
    if (saved && this.translations[saved]) {
      this.currentLanguage = saved;
    } else {
      const browserLang = navigator.language || navigator.languages[0];
      this.currentLanguage = browserLang.startsWith('ru') ? 'ru' : 'en';
    }
    
    // Start observing DOM changes
    this.startObserver();
    
    // Apply initial translations
    setTimeout(() => this.applyTranslations(), 100);
    
    // Set up language selector
    this.setupLanguageSelector();
  }
  
  startObserver() {
    this.observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              shouldUpdate = true;
            }
          });
        }
      });
      
      if (shouldUpdate) {
        setTimeout(() => this.applyTranslations(), 50);
      }
    });
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  applyTranslations() {
    const translations = this.translations[this.currentLanguage];
    
    // Walk through all text nodes
    this.walkTextNodes(document.body, (node) => {
      const text = node.textContent.trim();
      if (translations[text]) {
        node.textContent = translations[text];
      }
    });
    
    // Handle input placeholders
    document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(element => {
      const placeholder = element.getAttribute('placeholder');
      if (translations[placeholder]) {
        element.setAttribute('placeholder', translations[placeholder]);
      }
    });
    
    // Handle button values
    document.querySelectorAll('input[type="button"], input[type="submit"]').forEach(element => {
      const value = element.getAttribute('value');
      if (translations[value]) {
        element.setAttribute('value', translations[value]);
      }
    });
    
    // Update document language
    document.documentElement.lang = this.currentLanguage;
    
    // Update page title
    const titleTranslations = {
      en: "MindWeaver - Your AI Chief of Staff",
      ru: "MindWeaver - Ваш AI начальник штаба"
    };
    document.title = titleTranslations[this.currentLanguage];
  }
  
  walkTextNodes(node, callback) {
    if (node.nodeType === Node.TEXT_NODE && node.parentElement) {
      // Skip script and style tags
      const parentTag = node.parentElement.tagName.toLowerCase();
      if (!['script', 'style', 'noscript'].includes(parentTag)) {
        callback(node);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      for (let child of node.childNodes) {
        this.walkTextNodes(child, callback);
      }
    }
  }
  
  setupLanguageSelector() {
    // Try to find existing language selector
    const selector = document.querySelector('select');
    if (selector) {
      // Check if it's already a language selector
      if (selector.querySelector('option[value="en"]') && selector.querySelector('option[value="ru"]')) {
        selector.addEventListener('change', (e) => {
          this.setLanguage(e.target.value);
        });
        selector.value = this.currentLanguage;
        return;
      }
    }
    
    // Create language selector if it doesn't exist
    this.createLanguageSelector();
  }
  
  createLanguageSelector() {
    const selector = document.createElement('select');
    selector.setAttribute('data-language-selector', 'true');
    selector.style.cssText = `
      margin-left: 8px;
      padding: 4px 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: white;
      font-size: 14px;
    `;
    
    const enOption = document.createElement('option');
    enOption.value = 'en';
    enOption.textContent = 'English';
    
    const ruOption = document.createElement('option');
    ruOption.value = 'ru';
    ruOption.textContent = 'Русский';
    
    selector.appendChild(enOption);
    selector.appendChild(ruOption);
    selector.value = this.currentLanguage;
    
    selector.addEventListener('change', (e) => {
      this.setLanguage(e.target.value);
    });
    
    // Try to add to header
    const header = document.querySelector('header') || document.querySelector('[class*="header"]') || document.querySelector('div > div:first-child');
    if (header) {
      header.appendChild(selector);
    }
  }
  
  setLanguage(lang) {
    if (this.translations[lang]) {
      this.currentLanguage = lang;
      localStorage.setItem('mindweaver-language', lang);
      this.applyTranslations();
      
      // Update selector if it exists
      const selector = document.querySelector('[data-language-selector]');
      if (selector) {
        selector.value = lang;
      }
      
      console.log(`Language changed to: ${lang}`);
    }
  }
  
  // Public method to get current language
  getCurrentLanguage() {
    return this.currentLanguage;
  }
  
  // Public method to translate text
  translate(text) {
    return this.translations[this.currentLanguage][text] || text;
  }
}

// Initialize the language override system
let languageOverride;

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    languageOverride = new LanguageOverride();
  });
} else {
  languageOverride = new LanguageOverride();
}

// Make it globally available
window.setLanguage = (lang) => {
  if (languageOverride) {
    languageOverride.setLanguage(lang);
  }
};

window.getCurrentLanguage = () => {
  return languageOverride ? languageOverride.getCurrentLanguage() : 'en';
};
