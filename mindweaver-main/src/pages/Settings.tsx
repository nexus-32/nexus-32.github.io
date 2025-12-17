import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useVoice } from '@/contexts/VoiceContext';
import { 
  ArrowLeft, 
  Palette, 
  Type, 
  Volume2, 
  Sparkles, 
  User, 
  Search, 
  Mic, 
  Shield, 
  Bell, 
  Smartphone, 
  Monitor,
  Save,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react';

type UserSettings = {
  // Profile
  displayName: string;
  email: string;
  password: string;
  
  // Appearance
  theme: 'light' | 'dark' | 'system';
  colorScheme: string;
  fontSize: number;
  fontFamily: string;
  uiDensity: 'compact' | 'normal' | 'spacious';
  forceLayout: 'auto' | 'mobile' | 'desktop';
  
  // Search & Browser
  searchRegion: string;
  safeSearch: boolean;
  preferredStores: string[];
  
  // Voice Assistant
  voiceEnabled: boolean;
  voiceGender: 'male' | 'female';
  voiceURI: string | null;
  voiceVolume: number;
  voiceSpeed: number;
  voicePitch: number;
  
  // Privacy
  chatHistory: boolean;
  searchHistory: boolean;
  dataCollection: boolean;

  twoFactorMode: 'authenticator' | 'email';
  
  // Notifications
  messageNotifications: boolean;
  emailNotifications: boolean;
  soundNotifications: boolean;
};

const defaultSettings: UserSettings = {
  // Profile
  displayName: '',
  email: '',
  password: '',
  
  // Appearance
  theme: 'system',
  colorScheme: 'calm',
  fontSize: 16,
  fontFamily: 'system',
  uiDensity: 'normal',
  forceLayout: 'auto',
  
  // Search & Browser
  searchRegion: 'ru-RU',
  safeSearch: true,
  preferredStores: [],
  
  // Voice Assistant
  voiceEnabled: true,
  voiceGender: 'male',
  voiceURI: null,
  voiceVolume: 80,
  voiceSpeed: 1.0,
  voicePitch: 1.0,
  
  // Privacy
  chatHistory: true,
  searchHistory: true,
  dataCollection: false,

  twoFactorMode: 'authenticator',
  
  // Notifications
  messageNotifications: true,
  emailNotifications: false,
  soundNotifications: true,
};

const colorSchemes = [
  { id: 'warm', name: 'Теплая', colors: 'от оранжевых до красных тонов' },
  { id: 'calm', name: 'Спокойная', colors: 'синие и фиолетовые тона' },
  { id: 'energetic', name: 'Энергичная', colors: 'яркие и контрастные' },
  { id: 'neutral', name: 'Нейтральная', colors: 'серые и бежевые' },
];

const fontFamilies = [
  { id: 'system', name: 'Системный шрифт' },
  { id: 'inter', name: 'Inter' },
  { id: 'roboto', name: 'Roboto' },
  { id: 'open-sans', name: 'Open Sans' },
  { id: 'pt-sans', name: 'PT Sans' },
];

const uiDensities = [
  { id: 'compact', name: 'Компактный' },
  { id: 'normal', name: 'Обычный' },
  { id: 'spacious', name: 'Просторный' },
];

const layoutModes = [
  { id: 'auto', name: 'Автоматически', icon: Sparkles },
  { id: 'mobile', name: 'Мобильный', icon: Smartphone },
  { id: 'desktop', name: 'Компьютер', icon: Monitor },
];

const voiceGenders = [
  { id: 'male', name: 'Мужской' },
  { id: 'female', name: 'Женский' },
];

const regions = [
  { value: 'ru-RU', label: 'Россия' },
  { value: 'en-US', label: 'США (английский)' },
  { value: 'de-DE', label: 'Германия' },
  { value: 'fr-FR', label: 'Франция' },
  { value: 'es-ES', label: 'Испания' },
];

const stores = [
  { id: 'ozon', name: 'Ozon' },
  { id: 'wildberries', name: 'Wildberries' },
  { id: 'yandex', name: 'Яндекс.Маркет' },
  { id: 'aliexpress', name: 'AliExpress' },
  { id: 'sbermegamarket', name: 'СберМегаМаркет' },
];

const fonts = [
  { id: 'system', name: 'Системный' },
  { id: 'inter', name: 'Inter (современный)' },
  { id: 'roboto', name: 'Roboto (читаемый)' },
  { id: 'opendyslexic', name: 'OpenDyslexic (для дислексии)' },
];

const Settings = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const { availableVoices, setSelectedVoiceURI, speak } = useVoice();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpVerifiedFactorId, setTotpVerifiedFactorId] = useState<string>('');
  const [totpEnrollFactorId, setTotpEnrollFactorId] = useState<string>('');
  const [mfaQr, setMfaQr] = useState<string>('');
  const [mfaCode, setMfaCode] = useState<string>('');
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [showTotpSetup, setShowTotpSetup] = useState(false);
  const [showTotpDisable, setShowTotpDisable] = useState(false);

  const [email2faEnabled, setEmail2faEnabled] = useState(false);
  const [showEmailSetup, setShowEmailSetup] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    loadSettings();
  }, [user, loading]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('preference_value')
        .eq('user_id', user!.id)
        .eq('preference_key', 'settings')
        .maybeSingle();

      if (error) throw error;

      if (data?.preference_value) {
        const parsed = JSON.parse(data.preference_value);
        const next = { ...defaultSettings, ...parsed } as UserSettings;
        if (next.twoFactorMode !== 'authenticator' && next.twoFactorMode !== 'email') {
          next.twoFactorMode = 'authenticator';
        }
        setSettings(next);
        applyClientAppearance(next);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmail2fa = async () => {
    const { error } = await supabase.functions.invoke('email2fa', { body: { action: 'send' } });
    if (error) throw error;
  };

  const setEmail2faSessionOk = async () => {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (!session) return;
    const tokenTail = session.access_token.slice(-16);
    try {
      sessionStorage.setItem('mw_email2fa_ok', JSON.stringify({ uid: session.user.id, tokenTail }));
    } catch {
      // ignore
    }
  };

  const upsertEmail2faEnabled = async (enabled: boolean) => {
    if (!user) return;
    const { error } = await supabase
      .from('user_preferences')
      .upsert(
        {
          user_id: user.id,
          preference_key: 'email2fa_enabled',
          preference_value: enabled ? 'true' : 'false',
        },
        { onConflict: 'user_id,preference_key' }
      );
    if (error) throw error;
  };

  const startEnableEmail2FA = async () => {
    setMfaLoading(true);
    setMfaError(null);
    setMfaCode('');

    try {
      await sendEmail2fa();
      setShowEmailSetup(true);
      toast({ title: 'Код отправлен', description: 'Введите код из письма (действует 5 минут).' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Ошибка Email 2FA', description: error.message });
    } finally {
      setMfaLoading(false);
    }
  };

  const confirmEnableEmail2FA = async () => {
    setMfaLoading(true);
    setMfaError(null);

    try {
      const { error } = await supabase.functions.invoke('email2fa', { body: { action: 'verify', code: mfaCode.trim() } });
      if (error) throw error;

      await upsertEmail2faEnabled(true);
      await setEmail2faSessionOk();
      setEmail2faEnabled(true);
      handleSettingChange('twoFactorMode', 'email' as any);
      setShowEmailSetup(false);
      setMfaCode('');
      toast({ title: 'Email 2FA включена', description: 'Двухэтапная проверка по почте активирована.' });
    } catch (error: any) {
      setMfaError(error.message);
      toast({ variant: 'destructive', title: 'Ошибка Email 2FA', description: error.message });
    } finally {
      setMfaLoading(false);
    }
  };

  const disableEmail2FA = async () => {
    setMfaLoading(true);
    setMfaError(null);

    try {
      await upsertEmail2faEnabled(false);
      setEmail2faEnabled(false);
      handleSettingChange('twoFactorMode', 'authenticator' as any);
      setShowEmailSetup(false);
      setMfaCode('');
      try {
        sessionStorage.removeItem('mw_email2fa_ok');
      } catch {
        // ignore
      }
      toast({ title: 'Email 2FA отключена', description: 'Двухэтапная проверка по почте выключена.' });
    } catch (error: any) {
      setMfaError(error.message);
      toast({ variant: 'destructive', title: 'Ошибка Email 2FA', description: error.message });
    } finally {
      setMfaLoading(false);
    }
  };

  const refreshMfaState = async () => {
    try {
      const factors = await supabase.auth.mfa.listFactors();
      if (factors.error) throw factors.error;

      const totp = factors.data.totp ?? [];
      const verifiedTotp = totp.find((f: any) => f.status === 'verified') || null;
      setTotpEnabled(Boolean(verifiedTotp?.id));
      setTotpVerifiedFactorId(verifiedTotp?.id ?? '');

      const { data: pref } = await supabase
        .from('user_preferences')
        .select('preference_value')
        .eq('user_id', user!.id)
        .eq('preference_key', 'email2fa_enabled')
        .maybeSingle();
      setEmail2faEnabled(pref?.preference_value === 'true');
    } catch {
      setTotpEnabled(false);
      setTotpVerifiedFactorId('');
      setEmail2faEnabled(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    void refreshMfaState();
  }, [user]);

  const startEnableTotp2FA = async () => {
    setMfaLoading(true);
    setMfaError(null);
    setMfaCode('');

    try {
      const enroll = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Authenticator' });
      if (enroll.error) throw enroll.error;

      const id = enroll.data.id;
      setTotpEnrollFactorId(id);
      const qr = enroll.data.totp.qr_code;
      const src = qr.startsWith('data:') ? qr : `data:image/svg+xml;utf8,${encodeURIComponent(qr)}`;
      setMfaQr(src);
      setShowTotpSetup(true);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Ошибка 2FA', description: error.message });
    } finally {
      setMfaLoading(false);
    }
  };

  const confirmEnableTotp2FA = async () => {
    setMfaLoading(true);
    setMfaError(null);

    try {
      if (!totpEnrollFactorId) throw new Error('Не найден фактор для включения 2FA');
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: totpEnrollFactorId, code: mfaCode.trim() });
      if (error) throw error;
      setShowTotpSetup(false);
      setMfaQr('');
      setMfaCode('');
      setTotpEnrollFactorId('');
      toast({ title: '2FA включена', description: 'Двухэтапная проверка активирована.' });
      await refreshMfaState();
    } catch (error: any) {
      setMfaError(error.message);
      toast({ variant: 'destructive', title: 'Ошибка 2FA', description: error.message });
    } finally {
      setMfaLoading(false);
    }
  };

  const disableTotp2FA = async () => {
    setMfaLoading(true);
    setMfaError(null);

    try {
      setShowTotpDisable(true);
      toast({ title: 'Подтвердите 2FA', description: 'Для отключения введите одноразовый код.' });
      return;
    } catch (error: any) {
      setMfaError(error.message);
      toast({ variant: 'destructive', title: 'Ошибка 2FA', description: error.message });
    } finally {
      setMfaLoading(false);
    }
  };

  const confirmDisableTotp2FA = async () => {
    setMfaLoading(true);
    setMfaError(null);

    try {
      if (!totpVerifiedFactorId) throw new Error('Не найден TOTP фактор');
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: totpVerifiedFactorId, code: mfaCode.trim() });
      if (error) throw error;

      const unenroll = await supabase.auth.mfa.unenroll({ factorId: totpVerifiedFactorId });
      if (unenroll.error) throw unenroll.error;

      setShowTotpDisable(false);
      setMfaCode('');
      toast({ title: '2FA отключена', description: 'Двухэтапная проверка выключена.' });
      await refreshMfaState();
    } catch (error: any) {
      setMfaError(error.message);
      toast({ variant: 'destructive', title: 'Ошибка 2FA', description: error.message });
    } finally {
      setMfaLoading(false);
    }
  };

  const applyClientAppearance = (s: UserSettings) => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('mw_theme', s.theme);
      localStorage.setItem('mw_colorScheme', s.colorScheme);
      localStorage.setItem('mw_forceLayout', s.forceLayout);
      localStorage.setItem('mw_fontSize', String(s.fontSize));
      localStorage.setItem('mw_fontFamily', s.fontFamily);
    } catch {
      // ignore
    }

    try {
      window.dispatchEvent(new Event('mw-settings-changed'));
    } catch {
      // ignore
    }
  };

  const saveSettings = async (nextSettings?: UserSettings) => {
    if (!user) return false;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          preference_key: 'settings',
          preference_value: JSON.stringify(nextSettings ?? settings),
        }, {
          onConflict: 'user_id,preference_key',
        });

      if (error) throw error;

      if (nextSettings) {
        setSettings(nextSettings);
      }
      
      
      toast({
        title: 'Настройки сохранены',
        description: 'Ваши настройки были успешно обновлены.',
        action: <CheckCircle2 className="text-green-500" />,
      });
      
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        variant: 'destructive',
        title: 'Ошибка сохранения',
        description: 'Не удалось сохранить настройки. Пожалуйста, попробуйте снова.',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    const nextSettings = { ...settings, [key]: value };
    setSettings(nextSettings);

    if (key === 'twoFactorMode') {
      try {
        localStorage.setItem('mw_twoFactorMode', String(value));
      } catch {
        // ignore
      }
    }

    if (['theme', 'colorScheme', 'fontSize', 'fontFamily', 'forceLayout'].includes(key)) {
      applyClientAppearance(nextSettings);
    }

    // Auto-save for certain settings
    if (
      [
        'theme',
        'colorScheme',
        'fontSize',
        'fontFamily',
        'uiDensity',
        'forceLayout',
        'voiceEnabled',
        'voiceURI',
        'voiceVolume',
        'voiceSpeed',
        'voicePitch',
        'twoFactorMode',
      ].includes(key)
    ) {
      void saveSettings(nextSettings);
    }
  };

  const exportMyData = async () => {
    if (!user) return;

    setIsExporting(true);
    try {
      const { data: prefs, error: prefsError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id);
      if (prefsError) throw prefsError;

      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (convError) throw convError;

      const conversationIds = (conversations ?? []).map((c: any) => c.id).filter(Boolean);

      let messages: any[] = [];
      if (conversationIds.length > 0) {
        const { data: msgs, error: msgsError } = await supabase
          .from('messages')
          .select('*')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: true });
        if (msgsError) throw msgsError;
        messages = msgs ?? [];
      }

      const payload = {
        exported_at: new Date().toISOString(),
        user_id: user.id,
        settings,
        user_preferences: prefs ?? [],
        conversations: conversations ?? [],
        messages,
      };

      const json = JSON.stringify(payload, null, 2);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `mindweaver-export-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast({
        title: 'Экспорт готов',
        description: 'Файл JSON скачан на устройство.',
        action: <CheckCircle2 className="text-green-500" />,
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        variant: 'destructive',
        title: 'Ошибка экспорта',
        description: 'Не удалось экспортировать данные. Попробуйте ещё раз.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    setSelectedVoiceURI(settings.voiceURI ?? null);
  }, [settings.voiceURI, setSelectedVoiceURI]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSettings(settings);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto p-4 md:p-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>

        <h1 className="text-3xl font-bold mb-6">Настройки</h1>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Профиль</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Внешний вид</span>
              </TabsTrigger>
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Поиск</span>
              </TabsTrigger>
              <TabsTrigger value="voice" className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                <span className="hidden sm:inline">Голос</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Конфиденциальность</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Уведомления</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Профиль</CardTitle>
                  <CardDescription>
                    Управление данными вашего аккаунта
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="displayName">Имя пользователя</Label>
                    <Input
                      id="displayName"
                      value={settings.displayName}
                      onChange={(e) => handleSettingChange('displayName', e.target.value)}
                      placeholder="Введите ваше имя"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Электронная почта</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Новый пароль</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={settings.password}
                        onChange={(e) => handleSettingChange('password', e.target.value)}
                        placeholder="Введите новый пароль"
                        className="mt-1 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Внешний вид</CardTitle>
                  <CardDescription>
                    Настройте внешний вид приложения под свои предпочтения
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Тема</Label>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          settings.theme === 'light' ? 'border-primary ring-2 ring-primary' : 'hover:bg-accent'
                        }`}
                        onClick={() => handleSettingChange('theme', 'light')}
                      >
                        <div className="h-20 bg-white rounded-md mb-2"></div>
                        <span>Светлая</span>
                      </div>
                      <div
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          settings.theme === 'dark' ? 'border-primary ring-2 ring-primary' : 'hover:bg-accent'
                        }`}
                        onClick={() => handleSettingChange('theme', 'dark')}
                      >
                        <div className="h-20 bg-gray-900 rounded-md mb-2"></div>
                        <span>Темная</span>
                      </div>
                      <div
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          settings.theme === 'system' ? 'border-primary ring-2 ring-primary' : 'hover:bg-accent'
                        }`}
                        onClick={() => handleSettingChange('theme', 'system')}
                      >
                        <div className="h-20 bg-gradient-to-r from-white to-gray-900 rounded-md mb-2"></div>
                        <span>Как в системе</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Цветовая схема</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                      {colorSchemes.map((scheme) => (
                        <div
                          key={scheme.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            settings.colorScheme === scheme.id ? 'border-primary ring-2 ring-primary' : 'hover:bg-accent'
                          }`}
                          onClick={() => handleSettingChange('colorScheme', scheme.id)}
                        >
                          <div
                            className="h-12 rounded-md mb-2"
                            style={{
                              background:
                                scheme.id === 'warm'
                                  ? 'linear-gradient(90deg, hsl(24 95% 53%) 0%, hsl(0 84% 60%) 100%)'
                                  : scheme.id === 'calm'
                                    ? 'linear-gradient(90deg, hsl(220 90% 56%) 0%, hsl(195 92% 60%) 100%)'
                                    : scheme.id === 'energetic'
                                      ? 'linear-gradient(90deg, hsl(263 70% 60%) 0%, hsl(142 76% 45%) 100%)'
                                      : 'linear-gradient(90deg, hsl(240 5% 64%) 0%, hsl(240 5% 26%) 100%)',
                            }}
                          />
                          <div className="text-sm font-medium">{scheme.name}</div>
                          <div className="text-xs text-muted-foreground">{scheme.colors}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="fontFamily">Шрифт</Label>
                      <Select
                        value={settings.fontFamily}
                        onValueChange={(value) => handleSettingChange('fontFamily', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Выберите шрифт" />
                        </SelectTrigger>
                        <SelectContent>
                          {fontFamilies.map((font) => (
                            <SelectItem key={font.id} value={font.id}>
                              {font.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="fontSize">
                        Размер шрифта: {settings.fontSize}px
                      </Label>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-muted-foreground">A</span>
                        <Slider
                          id="fontSize"
                          min={12}
                          max={24}
                          step={1}
                          value={[settings.fontSize]}
                          onValueChange={([value]) => handleSettingChange('fontSize', value)}
                          className="flex-1"
                        />
                        <span className="text-lg font-medium">A</span>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="uiDensity">Плотность интерфейса</Label>
                      <Select
                        value={settings.uiDensity}
                        onValueChange={(value) => handleSettingChange('uiDensity', value as any)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Выберите плотность" />
                        </SelectTrigger>
                        <SelectContent>
                          {uiDensities.map((density) => (
                            <SelectItem key={density.id} value={density.id}>
                              {density.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Режим отображения</Label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {layoutModes.map((mode) => {
                          const ModeIcon = mode.icon;
                          return (
                            <Button
                              key={mode.id}
                              variant={settings.forceLayout === mode.id ? 'default' : 'outline'}
                              className="flex-col h-auto py-3"
                              onClick={() => handleSettingChange('forceLayout', mode.id as any)}
                              type="button"
                            >
                              <ModeIcon className="h-5 w-5 mb-1" />
                              <span className="text-xs">{mode.name}</span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Search & Browser Tab */}
            <TabsContent value="search" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Поиск и браузер</CardTitle>
                  <CardDescription>
                    Настройки поиска и встроенного браузера
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="searchRegion">Регион поиска</Label>
                    <Select
                      value={settings.searchRegion}
                      onValueChange={(value) => handleSettingChange('searchRegion', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Выберите регион" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((region) => (
                          <SelectItem key={region.value} value={region.value}>
                            {region.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label>Безопасный поиск</Label>
                      <p className="text-sm text-muted-foreground">
                        Фильтрация нежелательного контента
                      </p>
                    </div>
                    <Switch
                      checked={settings.safeSearch}
                      onCheckedChange={(checked) => handleSettingChange('safeSearch', checked)}
                    />
                  </div>

                  <div>
                    <Label>Предпочитаемые магазины</Label>
                    <div className="mt-2 space-y-2">
                      {stores.map((store) => (
                        <div key={store.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`store-${store.id}`}
                            checked={settings.preferredStores.includes(store.id)}
                            onChange={(e) => {
                              const newStores = e.target.checked
                                ? [...settings.preferredStores, store.id]
                                : settings.preferredStores.filter(id => id !== store.id);
                              handleSettingChange('preferredStores', newStores);
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <Label htmlFor={`store-${store.id}`} className="text-sm font-medium">
                            {store.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Voice Assistant Tab */}
            <TabsContent value="voice" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Голосовой ассистент</CardTitle>
                  <CardDescription>
                    Настройки голосового управления и озвучивания
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label>Голосовой ассистент</Label>
                      <p className="text-sm text-muted-foreground">
                        Включить голосовое управление и ответы
                      </p>
                    </div>
                    <Switch
                      checked={settings.voiceEnabled}
                      onCheckedChange={(checked) => handleSettingChange('voiceEnabled', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Голос для озвучки</Label>
                    <Select
                      value={(settings as any).voiceURI ?? ''}
                      onValueChange={(value) => handleSettingChange('voiceURI' as any, value || null)}
                      disabled={!settings.voiceEnabled}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Выберите голос" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableVoices.map((v) => (
                          <SelectItem key={v.voiceURI} value={v.voiceURI}>
                            {v.name} ({v.lang})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-2"
                      disabled={!settings.voiceEnabled}
                      onClick={() => {
                        speak('Пример озвучки. Голосовой ассистент готов.', {
                          rate: settings.voiceSpeed,
                          pitch: settings.voicePitch,
                          volume: Math.max(0, Math.min(1, settings.voiceVolume / 100)),
                          lang: 'ru-RU',
                        });
                      }}
                    >
                      Предпрослушать
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Голос</Label>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        {voiceGenders.map((gender) => (
                          <div
                            key={gender.id}
                            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                              settings.voiceGender === gender.id ? 'border-primary ring-2 ring-primary' : 'hover:bg-accent'
                            }`}
                            onClick={() => handleSettingChange('voiceGender', gender.id as 'male' | 'female')}
                          >
                            <div className="text-lg font-medium">{gender.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {gender.id === 'male' ? 'Глубокий мужской голос' : 'Мягкий женский голос'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Громкость: {settings.voiceVolume}%</Label>
                      <Slider
                        value={[settings.voiceVolume]}
                        onValueChange={([value]) => handleSettingChange('voiceVolume', value)}
                        min={0}
                        max={100}
                        step={1}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Скорость: {settings.voiceSpeed.toFixed(1)}x</Label>
                      <Slider
                        value={[settings.voiceSpeed]}
                        onValueChange={([value]) => handleSettingChange('voiceSpeed', value)}
                        min={0.5}
                        max={2}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Высота тона: {settings.voicePitch.toFixed(1)}</Label>
                      <Slider
                        value={[settings.voicePitch]}
                        onValueChange={([value]) => handleSettingChange('voicePitch', value)}
                        min={0.5}
                        max={2}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy Tab */}
            <TabsContent value="privacy" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Конфиденциальность</CardTitle>
                  <CardDescription>
                    Управление вашими данными и конфиденциальностью
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="pt-4 border-t">
                    <h3 className="font-medium mb-4">Двухэтапная проверка (2FA)</h3>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Режим 2FA</Label>
                        <Select
                          value={settings.twoFactorMode}
                          onValueChange={(value) => handleSettingChange('twoFactorMode', value as any)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Выберите режим" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="authenticator">Authenticator App (самый надёжный)</SelectItem>
                            <SelectItem value="email">По почте</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="rounded-lg border p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">Authenticator App</div>
                          <div className="text-sm text-muted-foreground">{totpEnabled ? 'Включена' : 'Выключена'}</div>
                        </div>

                        {!totpEnabled ? (
                          <Button type="button" onClick={startEnableTotp2FA} disabled={mfaLoading}>
                            {mfaLoading ? 'Загрузка...' : 'Включить'}
                          </Button>
                        ) : (
                          <Button type="button" variant="outline" onClick={disableTotp2FA} disabled={mfaLoading}>
                            {mfaLoading ? 'Загрузка...' : 'Отключить'}
                          </Button>
                        )}

                        {showTotpSetup && (
                          <div className="space-y-3 rounded-lg border p-4">
                            <div className="text-sm text-muted-foreground">Отсканируйте QR-код в Authenticator и введите код.</div>
                            {mfaQr && <img src={mfaQr} alt="MFA QR" className="max-w-[240px]" />}
                            <div className="space-y-2">
                              <Label htmlFor="mfaTotpEnableCode">Код</Label>
                              <Input
                                id="mfaTotpEnableCode"
                                value={mfaCode}
                                onChange={(e) => setMfaCode(e.target.value)}
                                placeholder="123456"
                              />
                              {mfaError && <div className="text-sm text-destructive">{mfaError}</div>}
                            </div>
                            <div className="flex gap-2">
                              <Button type="button" onClick={confirmEnableTotp2FA} disabled={mfaLoading}>
                                {mfaLoading ? 'Проверка...' : 'Подтвердить'}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setShowTotpSetup(false);
                                  setMfaQr('');
                                  setMfaCode('');
                                  setMfaError(null);
                                }}
                                disabled={mfaLoading}
                              >
                                Отмена
                              </Button>
                            </div>
                          </div>
                        )}

                        {showTotpDisable && (
                          <div className="space-y-3 rounded-lg border p-4">
                            <div className="text-sm text-muted-foreground">Введите одноразовый код для подтверждения.</div>
                            <div className="space-y-2">
                              <Label htmlFor="mfaTotpDisableCode">Код</Label>
                              <Input
                                id="mfaTotpDisableCode"
                                value={mfaCode}
                                onChange={(e) => setMfaCode(e.target.value)}
                                placeholder="123456"
                              />
                              {mfaError && <div className="text-sm text-destructive">{mfaError}</div>}
                            </div>
                            <div className="flex gap-2">
                              <Button type="button" variant="destructive" onClick={confirmDisableTotp2FA} disabled={mfaLoading}>
                                {mfaLoading ? 'Проверка...' : 'Отключить'}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setShowTotpDisable(false);
                                  setMfaCode('');
                                  setMfaError(null);
                                }}
                                disabled={mfaLoading}
                              >
                                Отмена
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="rounded-lg border p-4 space-y-2">
                        <div className="text-sm font-medium">По почте</div>
                        <div className="text-sm text-muted-foreground">Статус: {email2faEnabled ? 'Включена' : 'Выключена'}</div>

                        {!email2faEnabled ? (
                          <Button type="button" onClick={startEnableEmail2FA} disabled={mfaLoading}>
                            {mfaLoading ? 'Загрузка...' : 'Включить'}
                          </Button>
                        ) : (
                          <Button type="button" variant="outline" onClick={disableEmail2FA} disabled={mfaLoading}>
                            {mfaLoading ? 'Загрузка...' : 'Отключить'}
                          </Button>
                        )}

                        {showEmailSetup && (
                          <div className="space-y-3 rounded-lg border p-4">
                            <div className="text-sm text-muted-foreground">Введите код из письма. Код действует 5 минут.</div>
                            <div className="space-y-2">
                              <Label htmlFor="mfaEmailEnableCode">Код</Label>
                              <Input
                                id="mfaEmailEnableCode"
                                value={mfaCode}
                                onChange={(e) => setMfaCode(e.target.value)}
                                placeholder="123456"
                              />
                              {mfaError && <div className="text-sm text-destructive">{mfaError}</div>}
                            </div>
                            <div className="flex gap-2">
                              <Button type="button" onClick={confirmEnableEmail2FA} disabled={mfaLoading}>
                                {mfaLoading ? 'Проверка...' : 'Подтвердить'}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={async () => {
                                  try {
                                    await sendEmail2fa();
                                    toast({ title: 'Код отправлен', description: 'Проверьте почту.' });
                                  } catch (e: any) {
                                    setMfaError(e?.message ?? 'Не удалось отправить код');
                                  }
                                }}
                                disabled={mfaLoading}
                              >
                                Отправить ещё раз
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between space-x-2">
                      <div className="space-y-0.5">
                        <Label>История чатов</Label>
                        <p className="text-sm text-muted-foreground">
                          Сохранять историю ваших бесед
                        </p>
                      </div>
                      <Switch
                        checked={settings.chatHistory}
                        onCheckedChange={(checked) => handleSettingChange('chatHistory', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                      <div className="space-y-0.5">
                        <Label>История поиска</Label>
                        <p className="text-sm text-muted-foreground">
                          Сохранять историю поисковых запросов
                        </p>
                      </div>
                      <Switch
                        checked={settings.searchHistory}
                        onCheckedChange={(checked) => handleSettingChange('searchHistory', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                      <div className="space-y-0.5">
                        <Label>Сбор анонимных данных</Label>
                        <p className="text-sm text-muted-foreground">
                          Помогите улучшить приложение, отправляя анонимные данные об использовании
                        </p>
                      </div>
                      <Switch
                        checked={settings.dataCollection}
                        onCheckedChange={(checked) => handleSettingChange('dataCollection', checked)}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-medium mb-4">Экспорт данных</h3>
                    <div className="space-y-4">
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto"
                        type="button"
                        onClick={exportMyData}
                        disabled={isExporting}
                      >
                        {isExporting ? 'Экспорт...' : 'Экспортировать мои данные'}
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        Скачайте копию всех ваших данных в формате JSON
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-medium mb-4 text-destructive">Опасная зона</h3>
                    <div className="space-y-4">
                      <Button variant="destructive" className="w-full sm:w-auto">
                        Удалить аккаунт
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        Это действие нельзя отменить. Все ваши данные будут безвозвратно удалены.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Уведомления</CardTitle>
                  <CardDescription>
                    Управление уведомлениями приложения
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between space-x-2">
                      <div className="space-y-0.5">
                        <Label>Уведомления в приложении</Label>
                        <p className="text-sm text-muted-foreground">
                          Показывать уведомления в интерфейсе приложения
                        </p>
                      </div>
                      <Switch
                        checked={settings.messageNotifications}
                        onCheckedChange={(checked) => handleSettingChange('messageNotifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                      <div className="space-y-0.5">
                        <Label>Уведомления по email</Label>
                        <p className="text-sm text-muted-foreground">
                          Получать уведомления на электронную почту
                        </p>
                      </div>
                      <Switch
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                      <div className="space-y-0.5">
                        <Label>Звуковые уведомления</Label>
                        <p className="text-sm text-muted-foreground">
                          Воспроизводить звук при получении уведомлений
                        </p>
                      </div>
                      <Switch
                        checked={settings.soundNotifications}
                        onCheckedChange={(checked) => handleSettingChange('soundNotifications', checked)}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-medium mb-4">Настройки уведомлений</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Время тишины</Label>
                        <Select>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Не отключать" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1h">На 1 час</SelectItem>
                            <SelectItem value="4h">На 4 часа</SelectItem>
                            <SelectItem value="8h">На 8 часов</SelectItem>
                            <SelectItem value="24h">На 24 часа</SelectItem>
                            <SelectItem value="custom">Настроить...</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Приоритетные уведомления</Label>
                        <p className="text-sm text-muted-foreground">
                          Получать уведомления только о важных событиях
                        </p>
                        <div className="flex items-center space-x-2">
                          <Switch id="priority-notifications" />
                          <Label htmlFor="priority-notifications">
                            Включить приоритетные уведомления
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </div>
    </div>
  );
};

export default Settings;
