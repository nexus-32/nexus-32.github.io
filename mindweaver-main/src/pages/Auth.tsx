import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Sparkles } from 'lucide-react';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'auth' | 'mfa-verify' | 'mfa-enroll-totp' | 'email-verify'>('auth');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaQr, setMfaQr] = useState<string>('');
  const [mfaFactorId, setMfaFactorId] = useState<string>('');
  const [mfaTotpFactorId, setMfaTotpFactorId] = useState<string>('');

  const [signupTwoFactorMode, setSignupTwoFactorMode] = useState<'authenticator' | 'email'>('authenticator');
  const { signUp, signIn, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user && step === 'auth') {
      navigate('/chat');
    }
  }, [user, authLoading, navigate, step]);

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

  const isEmail2faSessionOk = async (): Promise<boolean> => {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (!session) return false;

    try {
      const raw = sessionStorage.getItem('mw_email2fa_ok');
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return parsed?.uid === session.user.id && parsed?.tokenTail === session.access_token.slice(-16);
    } catch {
      return false;
    }
  };

  const upsertEmail2faEnabled = async (enabled: boolean) => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid) return;
    await supabase
      .from('user_preferences')
      .upsert(
        {
          user_id: uid,
          preference_key: 'email2fa_enabled',
          preference_value: enabled ? 'true' : 'false',
        },
        { onConflict: 'user_id,preference_key' }
      );
  };

  const sendEmail2fa = async () => {
    const { error } = await supabase.functions.invoke('email2fa', { body: { action: 'send' } });
    if (error) throw error;
  };

  const verifyEmail2fa = async (code: string) => {
    const { error } = await supabase.functions.invoke('email2fa', { body: { action: 'verify', code } });
    if (error) throw error;

    await setEmail2faSessionOk();
    await upsertEmail2faEnabled(true);
    await upsertTwoFactorModeSetting('email');
  };

  const getEmail2faEnabled = async (): Promise<boolean> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) return false;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('preference_value')
        .eq('user_id', uid)
        .eq('preference_key', 'email2fa_enabled')
        .maybeSingle();
      if (error) return false;
      return data?.preference_value === 'true';
    } catch {
      return false;
    }
  };

  const upsertTwoFactorModeSetting = async (mode: 'authenticator' | 'email') => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid) return;

    const { data: existing } = await supabase
      .from('user_preferences')
      .select('preference_value')
      .eq('user_id', uid)
      .eq('preference_key', 'settings')
      .maybeSingle();

    let parsed: any = {};
    try {
      if (existing?.preference_value) parsed = JSON.parse(existing.preference_value);
    } catch {
      parsed = {};
    }

    const next = { ...parsed, twoFactorMode: mode };
    await supabase
      .from('user_preferences')
      .upsert(
        {
          user_id: uid,
          preference_key: 'settings',
          preference_value: JSON.stringify(next),
        },
        { onConflict: 'user_id,preference_key' }
      );

    try {
      localStorage.setItem('mw_twoFactorMode', mode);
    } catch {
      // ignore
    }
  };

  const getPreferredTwoFactorMode = async (): Promise<'authenticator' | 'email' | null> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) return null;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('preference_value')
        .eq('user_id', uid)
        .eq('preference_key', 'settings')
        .maybeSingle();
      if (error) return null;
      if (!data?.preference_value) return null;
      const parsed = JSON.parse(data.preference_value);
      const mode = parsed?.twoFactorMode;
      if (mode === 'authenticator' || mode === 'email') return mode;
      return null;
    } catch {
      return null;
    }
  };

  const handleEmailVerify = async () => {
    setLoading(true);
    setMfaError(null);

    try {
      await verifyEmail2fa(mfaCode.trim());
      toast({ title: 'Email 2FA подтверждена', description: 'Вход завершён.' });
      navigate('/chat');
    } catch (error: any) {
      setMfaError(error?.message ?? 'Ошибка email 2FA');
      toast({ title: 'Ошибка 2FA', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadMfaVerifyOptions = async () => {
    const factors = await supabase.auth.mfa.listFactors();
    if (factors.error) throw factors.error;

    const totp = factors.data.totp ?? [];
    const verifiedTotp = totp.find((f: any) => f.status === 'verified') || null;
    if (!verifiedTotp?.id) {
      throw new Error('Не найден подтверждённый фактор Authenticator App. Включите 2FA через приложение Authenticator в настройках.');
    }

    setMfaTotpFactorId(verifiedTotp.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMfaError(null);

    try {
      if (isSignUp) {
        const { data, error } = await signUp(email, password, username);
        if (error) throw error;
        toast({ title: 'Добро пожаловать!', description: 'Аккаунт успешно создан' });

        if (data?.session) {
          const mode = signupTwoFactorMode;

          if (mode === 'email') {
            setStep('email-verify');
            setMfaCode('');
            await sendEmail2fa();
            toast({ title: 'Код отправлен', description: 'Введите код из письма для завершения регистрации.' });
            return;
          }

          const enroll = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Authenticator' });
          if (enroll.error) throw enroll.error;

          setMfaFactorId(enroll.data.id);
          const qr = enroll.data.totp.qr_code;
          const src = qr.startsWith('data:') ? qr : `data:image/svg+xml;utf8,${encodeURIComponent(qr)}`;
          setMfaQr(src);
          setStep('mfa-enroll-totp');
          return;
        }

        toast({
          title: 'Подтвердите email',
          description: 'Если включено подтверждение почты — проверьте письмо. После входа вы сможете включить 2FA в настройках.',
        });
        return;
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;

        const prefMode = await getPreferredTwoFactorMode();
        if (prefMode === 'email') {
          const ok = await isEmail2faSessionOk();
          if (!ok) {
            setStep('email-verify');
            setMfaCode('');
            await sendEmail2fa();
            toast({ title: 'Код отправлен', description: 'Введите код из письма для подтверждения входа.' });
            return;
          }
        }

        const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aalError) throw aalError;

        if (aalData?.currentLevel === 'aal1' && aalData?.nextLevel === 'aal2') {
          setStep('mfa-verify');
          await loadMfaVerifyOptions();
          toast({ title: 'Нужен код 2FA', description: 'Подтвердите вход выбранным методом.' });
          return;
        }

        toast({ title: 'С возвращением!', description: 'Вход выполнен успешно' });
      }
      navigate('/chat');
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerify = async () => {
    setLoading(true);
    setMfaError(null);

    try {
      const factorId = mfaTotpFactorId;
      if (!factorId) throw new Error('Не найден TOTP фактор');

      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: mfaCode.trim(),
      });
      if (error) throw error;

      toast({ title: '2FA подтверждена', description: 'Вход завершён.' });
      navigate('/chat');
    } catch (error: any) {
      setMfaError(error?.message ?? 'Ошибка 2FA');
      toast({
        title: 'Ошибка 2FA',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMfaEnroll = async () => {
    setLoading(true);
    setMfaError(null);

    try {
      if (!mfaFactorId) throw new Error('Не найден фактор для включения 2FA');

      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: mfaFactorId,
        code: mfaCode.trim(),
      });
      if (error) throw error;

      toast({ title: '2FA включена', description: 'Двухэтапная проверка активирована.' });
      navigate('/chat');
    } catch (error: any) {
      setMfaError(error?.message ?? 'Ошибка 2FA');
      toast({
        title: 'Ошибка 2FA',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md border-border/40 bg-card/50 backdrop-blur-sm shadow-glow">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">MindWeaver</CardTitle>
          <CardDescription>
            {isSignUp ? 'Создайте аккаунт для начала работы' : 'Войдите в свой аккаунт'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'auth' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="username">Имя пользователя</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ваше имя"
                  />
                </div>
              )}
              {isSignUp && (
                <div className="space-y-2">
                  <Label>Режим 2FA</Label>
                  <Select value={signupTwoFactorMode} onValueChange={(v) => setSignupTwoFactorMode(v as any)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Выберите режим" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="authenticator">Authenticator App</SelectItem>
                      <SelectItem value="email">По почте</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Загрузка...' : isSignUp ? 'Зарегистрироваться' : 'Войти'}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              {step === 'mfa-enroll-totp' && (
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">Отсканируйте QR-код в приложении Authenticator и введите код.</div>
                  {mfaQr && <img src={mfaQr} alt="MFA QR" className="mx-auto max-w-[240px]" />}
                </div>
              )}
              {step === 'mfa-verify' && (
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">Введите одноразовый код из приложения Authenticator.</div>
                </div>
              )}
              {step === 'email-verify' && (
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">Введите код из письма. Код действует 5 минут.</div>
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
                    disabled={loading}
                  >
                    Отправить код ещё раз
                  </Button>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="mfaCode">Код 2FA</Label>
                <Input
                  id="mfaCode"
                  type="text"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  placeholder="123456"
                />
                {mfaError && <div className="text-sm text-destructive">{mfaError}</div>}
              </div>
              <Button
                type="button"
                className="w-full"
                onClick={
                  step === 'mfa-enroll-totp'
                    ? handleMfaEnroll
                    : step === 'email-verify'
                      ? handleEmailVerify
                      : handleMfaVerify
                }
                disabled={loading}
              >
                {loading
                  ? 'Проверка...'
                  : step === 'mfa-enroll-totp'
                    ? 'Включить 2FA'
                    : step === 'email-verify'
                      ? 'Подтвердить Email'
                      : 'Подтвердить'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStep('auth');
                  setMfaCode('');
                  setMfaError(null);
                }}
                disabled={loading}
              >
                Назад
              </Button>
            </div>
          )}
          <div className="mt-4 text-center text-sm">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary hover:underline"
            >
              {isSignUp ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
