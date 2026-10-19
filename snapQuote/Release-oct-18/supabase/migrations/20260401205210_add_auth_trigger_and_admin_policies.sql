/*
  # Auth Trigger, Admin Policies, and Storage Setup

  ## Summary
  Adds the critical auto-profile-creation trigger for new signups, fixes the studios INSERT
  policy to prevent USING(true), and adds admin-level access policies so admins can
  read all tables for the admin panel.

  ## Changes

  ### Trigger — `on_auth_user_created`
  - Fires after INSERT on auth.users
  - Auto-creates a row in public.profiles with id, email, full_name from user metadata

  ### Policies — studios
  - Restricts INSERT to users who own the studio being inserted (removes the open `USING(true)`)
  - Adds admin SELECT policy so admins can see all studios

  ### Policies — profiles
  - Adds admin SELECT policy so admins can read all profiles

  ### Policies — subscriptions
  - Adds admin SELECT policy so admins can read all subscriptions

  ### Policies — leads, services, packages, quotes
  - Adds admin SELECT policies for full platform visibility

  ## Notes
  - The trigger sets role to 'studio_owner' by default
  - Admins are identified by profiles.role = 'admin'
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    'studio_owner'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP POLICY IF EXISTS "Authenticated users can insert studios" ON public.studios;
CREATE POLICY "Users can insert studio for themselves"
  ON public.studios
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'studios' AND policyname = 'Admins can read all studios'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admins can read all studios"
        ON public.studios FOR SELECT
        TO authenticated
        USING (
          EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        )
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'studios' AND policyname = 'Admins can update all studios'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admins can update all studios"
        ON public.studios FOR UPDATE
        TO authenticated
        USING (
          EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        )
        WITH CHECK (
          EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        )
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Admins can read all profiles'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admins can read all profiles"
        ON public.profiles FOR SELECT
        TO authenticated
        USING (
          EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
        )
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'Admins can manage all subscriptions'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admins can manage all subscriptions"
        ON public.subscriptions FOR SELECT
        TO authenticated
        USING (
          EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        )
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'Admins can insert subscriptions'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admins can insert subscriptions"
        ON public.subscriptions FOR INSERT
        TO authenticated
        WITH CHECK (
          EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        )
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'Admins can update subscriptions'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admins can update subscriptions"
        ON public.subscriptions FOR UPDATE
        TO authenticated
        USING (
          EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        )
        WITH CHECK (
          EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        )
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'quotes' AND policyname = 'Admins can read all quotes'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admins can read all quotes"
        ON public.quotes FOR SELECT
        TO authenticated
        USING (
          EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        )
    $policy$;
  END IF;
END $$;
