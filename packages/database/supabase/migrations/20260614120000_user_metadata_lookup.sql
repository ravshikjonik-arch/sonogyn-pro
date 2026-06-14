-- Быстрый lookup email → user id (замена auth.admin.listUsers в sign-up).

CREATE TABLE IF NOT EXISTS public.user_metadata (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  full_name TEXT,
  specialty TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_metadata_email ON public.user_metadata(email);
CREATE INDEX IF NOT EXISTS idx_user_metadata_phone ON public.user_metadata(phone);

ALTER TABLE public.user_metadata ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.user_metadata FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_metadata TO service_role;

CREATE OR REPLACE FUNCTION public.handle_auth_user_metadata_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NULL OR trim(NEW.email) = '' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.user_metadata (id, email, phone, full_name, specialty, updated_at)
  VALUES (
    NEW.id,
    lower(trim(NEW.email)),
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'specialization', NEW.raw_user_meta_data->>'specialty', ''),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    full_name = EXCLUDED.full_name,
    specialty = EXCLUDED.specialty,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_metadata_sync ON auth.users;
CREATE TRIGGER on_auth_user_metadata_sync
  AFTER INSERT OR UPDATE OF email, phone, raw_user_meta_data ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_metadata_sync();

INSERT INTO public.user_metadata (id, email, phone, full_name, specialty, updated_at)
SELECT
  u.id,
  lower(trim(u.email)),
  u.phone,
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  COALESCE(u.raw_user_meta_data->>'specialization', u.raw_user_meta_data->>'specialty', ''),
  NOW()
FROM auth.users u
WHERE u.email IS NOT NULL AND trim(u.email) <> ''
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  full_name = EXCLUDED.full_name,
  specialty = EXCLUDED.specialty,
  updated_at = NOW();
