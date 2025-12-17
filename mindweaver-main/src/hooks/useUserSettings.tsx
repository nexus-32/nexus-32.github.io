import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type LayoutMode = 'auto' | 'mobile' | 'desktop';

const getDefaultLanguage = () => {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem('mw_language') || navigator.language || 'en';
};

export type UserSettings = {
  language: string;
  searchRegion: string;
  safeSearch: boolean;
  colorScheme: string;
  aiAvatar: string;
  fontSize: number;
  fontFamily: string;
  messageSpacing: number;
  soundEnabled: boolean;
  soundVolume: number;
  theme: 'light' | 'dark' | 'system';
  forceLayout: LayoutMode;
  voiceEnabled: boolean;
  voiceURI: string | null;
  voiceSpeed: number;
  voicePitch: number;
  voiceVolume: number;
  micSensitivity: number;
  twoFactorMode: 'authenticator' | 'email';
};

export const defaultSettings: UserSettings = {
  language: getDefaultLanguage(),
  searchRegion: 'ru-RU',
  safeSearch: true,
  colorScheme: 'calm',
  aiAvatar: 'sparkles',
  fontSize: 16,
  fontFamily: 'system',
  messageSpacing: 16,
  soundEnabled: false,
  soundVolume: 50,
  theme: 'system',
  forceLayout: 'auto',
  voiceEnabled: true,
  voiceURI: null,
  voiceSpeed: 1,
  voicePitch: 1,
  voiceVolume: 80,
  micSensitivity: 0.5,
  twoFactorMode: 'authenticator',
};

export const useUserSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSettings();
      return;
    }

    setLoading(false);
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      const { data: jsonPref, error: jsonError } = await supabase
        .from('user_preferences')
        .select('preference_value')
        .eq('user_id', user.id)
        .eq('preference_key', 'settings')
        .maybeSingle();

      if (jsonError) throw jsonError;

      if (jsonPref?.preference_value) {
        const parsed = JSON.parse(jsonPref.preference_value);
        const next = { ...defaultSettings, ...parsed } as UserSettings;
        if (next.twoFactorMode !== 'authenticator' && next.twoFactorMode !== 'email') {
          next.twoFactorMode = 'authenticator';
        }
        setSettings(next);
        return;
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .select('preference_key, preference_value')
        .eq('user_id', user.id);

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedSettings: any = { ...defaultSettings };
        data.forEach((pref) => {
          const value = pref.preference_value;
          if (['fontSize', 'messageSpacing', 'soundVolume'].includes(pref.preference_key)) {
            loadedSettings[pref.preference_key] = parseInt(value);
          } else if (pref.preference_key === 'soundEnabled') {
            loadedSettings[pref.preference_key] = value === 'true';
          } else {
            loadedSettings[pref.preference_key] = value;
          }
        });
        if (loadedSettings.twoFactorMode !== 'authenticator' && loadedSettings.twoFactorMode !== 'email') {
          loadedSettings.twoFactorMode = 'authenticator';
        }
        setSettings(loadedSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (patch: Partial<UserSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);

    if (typeof window !== 'undefined') {
      try {
        if (patch.language) localStorage.setItem('mw_language', patch.language);
        if (patch.theme) localStorage.setItem('mw_theme', patch.theme);
        if (patch.colorScheme) localStorage.setItem('mw_colorScheme', patch.colorScheme);
        if (patch.forceLayout) localStorage.setItem('mw_forceLayout', patch.forceLayout);
        if (typeof patch.fontSize === 'number') localStorage.setItem('mw_fontSize', String(patch.fontSize));
        if (patch.fontFamily) localStorage.setItem('mw_fontFamily', patch.fontFamily);
      } catch {
        // ignore
      }

      try {
        window.dispatchEvent(new Event('mw-settings-changed'));
      } catch {
        // ignore
      }
    }

    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: user.id,
            preference_key: 'settings',
            preference_value: JSON.stringify(next),
          },
          { onConflict: 'user_id,preference_key' }
        );
      if (error) throw error;
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  return { settings, loading, updateSettings };
};
