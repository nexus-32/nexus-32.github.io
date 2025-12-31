import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { VoiceProvider } from "@/contexts/VoiceContext";
import { AIModesProvider } from "@/contexts/AIModesContext";
import { startAutoTranslateUI } from "@/lib/autoTranslateUI";
import Index from "./pages/Index";
import Chat from "./pages/Chat";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import AIModesMarketplace from "./pages/AIModesMarketplace";
import CreateAIMode from "./pages/CreateAIMode";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const applyRuntimeAppearance = () => {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;

  let theme: 'light' | 'dark' | 'system' = 'system';
  let colorScheme = 'calm';
  let fontSize: number | null = null;
  let fontFamily: string | null = null;

  try {
    const t = window.localStorage.getItem('mw_theme');
    if (t === 'light' || t === 'dark' || t === 'system') theme = t;
    const cs = window.localStorage.getItem('mw_colorScheme');
    if (cs) colorScheme = cs;
    const fs = window.localStorage.getItem('mw_fontSize');
    if (fs && !Number.isNaN(Number(fs))) fontSize = Number(fs);
    const ff = window.localStorage.getItem('mw_fontFamily');
    if (ff) fontFamily = ff;
  } catch {
    // ignore
  }

  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
  root.classList.toggle('dark', isDark);

  root.setAttribute('data-color-scheme', colorScheme);

  if (typeof fontSize === 'number') {
    root.style.fontSize = `${fontSize}px`;
  }

  if (fontFamily) {
    const map: Record<string, string> = {
      system: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
      inter: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
      roboto: 'Roboto, system-ui, -apple-system, Segoe UI, Arial, sans-serif',
      'open-sans': '"Open Sans", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
      'pt-sans': '"PT Sans", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
    };
    document.body.style.fontFamily = map[fontFamily] || map.system;
  }
};

const RuntimeSettingsBridge = () => {
  React.useEffect(() => {
    applyRuntimeAppearance();

    startAutoTranslateUI(() => {
      try {
        return window.localStorage.getItem('mw_language') || navigator.language || 'en';
      } catch {
        return navigator.language || 'en';
      }
    });

    const onSettingsChanged = () => {
      applyRuntimeAppearance();
    };

    window.addEventListener('mw-settings-changed', onSettingsChanged);

    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const onSystemTheme = () => {
      applyRuntimeAppearance();
    };
    mq?.addEventListener?.('change', onSystemTheme);

    return () => {
      window.removeEventListener('mw-settings-changed', onSettingsChanged);
      mq?.removeEventListener?.('change', onSystemTheme);
    };
  }, []);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AIModesProvider>
      <VoiceProvider>
        <TooltipProvider>
          <RuntimeSettingsBridge />
          <Toaster />
          <Sonner />
          <BrowserRouter basename="/mindweaver-ai">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/chat/:conversationId" element={<Chat />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/modes" element={<AIModesMarketplace />} />
              <Route path="/modes/create" element={<CreateAIMode />} />
              <Route path="/modes/edit/:id" element={<CreateAIMode />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </VoiceProvider>
    </AIModesProvider>
  </QueryClientProvider>
);

export default App;
