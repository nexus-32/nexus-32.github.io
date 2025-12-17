CREATE TABLE public.email_2fa_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  consumed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.email_2fa_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own email 2FA codes"
  ON public.email_2fa_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own email 2FA codes"
  ON public.email_2fa_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own email 2FA codes"
  ON public.email_2fa_codes FOR UPDATE
  USING (auth.uid() = user_id);
