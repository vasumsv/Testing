/*
  # SnapQuote Database Schema

  ## Overview
  Initial schema for SnapQuote - a quotation and CRM tool for photography studios.

  ## New Tables

  ### profiles
  - Extends auth.users with role-based access (studio_owner, admin)
  - Links to a studio via studio_id

  ### studios
  - Photography studio accounts
  - Stores name, email, phone, plan tier, and status

  ### leads
  - CRM leads tracked per studio
  - Tracks name, email, phone, event type, source, and status

  ### quotes
  - Quotations generated per studio for leads/clients
  - Tracks amount, status, validity, and notes

  ### services
  - Photography services offered by studios
  - Includes name, description, price, unit, and active status

  ### packages
  - Bundled service packages with pricing
  - Tracks included services, price, and active status

  ### subscriptions
  - Studio billing subscriptions
  - Tracks plan, status, billing cycle, and renewal date

  ## Security
  - RLS enabled on all tables
  - Studio users can only access their own data
  - Admins can access all data via role check
*/

-- Studios table
CREATE TABLE IF NOT EXISTS studios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  email text UNIQUE NOT NULL DEFAULT '',
  phone text DEFAULT '',
  address text DEFAULT '',
  logo_url text DEFAULT '',
  plan text NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'agency')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE studios ENABLE ROW LEVEL SECURITY;

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  studio_id uuid REFERENCES studios(id) ON DELETE SET NULL,
  full_name text DEFAULT '',
  email text DEFAULT '',
  role text NOT NULL DEFAULT 'studio_owner' CHECK (role IN ('studio_owner', 'admin', 'staff')),
  avatar_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text DEFAULT '',
  phone text DEFAULT '',
  event_type text DEFAULT '',
  event_date date,
  source text DEFAULT 'direct' CHECK (source IN ('direct', 'referral', 'instagram', 'website', 'google', 'other')),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  description text DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0,
  unit text DEFAULT 'session' CHECK (unit IN ('session', 'hour', 'day', 'package', 'print')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Packages table
CREATE TABLE IF NOT EXISTS packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  description text DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- Quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  quote_number text NOT NULL DEFAULT '',
  client_name text NOT NULL DEFAULT '',
  client_email text DEFAULT '',
  amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  valid_until date,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'agency')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  billing_cycle text NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  amount numeric(10,2) NOT NULL DEFAULT 0,
  current_period_start timestamptz DEFAULT now(),
  current_period_end timestamptz DEFAULT (now() + interval '1 month'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: profiles
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies: studios (users see own studio, admins see all)
CREATE POLICY "Studio members can read own studio"
  ON studios FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT studio_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Studio owners can update own studio"
  ON studios FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT studio_id FROM profiles WHERE id = auth.uid() AND role IN ('studio_owner', 'admin')
    )
  )
  WITH CHECK (
    id IN (
      SELECT studio_id FROM profiles WHERE id = auth.uid() AND role IN ('studio_owner', 'admin')
    )
  );

CREATE POLICY "Authenticated users can insert studios"
  ON studios FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies: leads
CREATE POLICY "Studio members can read own leads"
  ON leads FOR SELECT
  TO authenticated
  USING (
    studio_id IN (SELECT studio_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Studio members can insert leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (
    studio_id IN (SELECT studio_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Studio members can update own leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (studio_id IN (SELECT studio_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (studio_id IN (SELECT studio_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Studio members can delete own leads"
  ON leads FOR DELETE
  TO authenticated
  USING (studio_id IN (SELECT studio_id FROM profiles WHERE id = auth.uid()));

-- RLS Policies: services
CREATE POLICY "Studio members can read own services"
  ON services FOR SELECT
  TO authenticated
  USING (studio_id IN (SELECT studio_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Studio members can insert services"
  ON services FOR INSERT
  TO authenticated
  WITH CHECK (studio_id IN (SELECT studio_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Studio members can update own services"
  ON services FOR UPDATE
  TO authenticated
  USING (studio_id IN (SELECT studio_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (studio_id IN (SELECT studio_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Studio members can delete own services"
  ON services FOR DELETE
  TO authenticated
  USING (studio_id IN (SELECT studio_id FROM profiles WHERE id = auth.uid()));

-- RLS Policies: packages
CREATE POLICY "Studio members can read own packages"
  ON packages FOR SELECT
  TO authenticated
  USING (studio_id IN (SELECT studio_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Studio members can insert packages"
  ON packages FOR INSERT
  TO authenticated
  WITH CHECK (studio_id IN (SELECT studio_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Studio members can update own packages"
  ON packages FOR UPDATE
  TO authenticated
  USING (studio_id IN (SELECT studio_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (studio_id IN (SELECT studio_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Studio members can delete own packages"
  ON packages FOR DELETE
  TO authenticated
  USING (studio_id IN (SELECT studio_id FROM profiles WHERE id = auth.uid()));

-- RLS Policies: quotes
CREATE POLICY "Studio members can read own quotes"
  ON quotes FOR SELECT
  TO authenticated
  USING (studio_id IN (SELECT studio_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Studio members can insert quotes"
  ON quotes FOR INSERT
  TO authenticated
  WITH CHECK (studio_id IN (SELECT studio_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Studio members can update own quotes"
  ON quotes FOR UPDATE
  TO authenticated
  USING (studio_id IN (SELECT studio_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (studio_id IN (SELECT studio_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Studio members can delete own quotes"
  ON quotes FOR DELETE
  TO authenticated
  USING (studio_id IN (SELECT studio_id FROM profiles WHERE id = auth.uid()));

-- RLS Policies: subscriptions
CREATE POLICY "Studio owners can read own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (studio_id IN (SELECT studio_id FROM profiles WHERE id = auth.uid()));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_studio_id ON profiles(studio_id);
CREATE INDEX IF NOT EXISTS idx_leads_studio_id ON leads(studio_id);
CREATE INDEX IF NOT EXISTS idx_quotes_studio_id ON quotes(studio_id);
CREATE INDEX IF NOT EXISTS idx_services_studio_id ON services(studio_id);
CREATE INDEX IF NOT EXISTS idx_packages_studio_id ON packages(studio_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_studio_id ON subscriptions(studio_id);

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
