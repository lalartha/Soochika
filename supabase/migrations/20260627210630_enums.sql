-- 1. ENUMS AND CUSTOM TYPES
CREATE TYPE user_role AS ENUM ('admin', 'ward_member', 'asha_worker', 'anganwadi_worker');
CREATE TYPE beneficiary_type AS ENUM ('elderly', 'pwd', 'both');
CREATE TYPE gender AS ENUM ('male', 'female', 'other');
CREATE TYPE priority_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE request_type AS ENUM ('wheelchair', 'walking_stick', 'home_visit', 'ramp', 'pension_support', 'other');
CREATE TYPE request_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE disability_type AS ENUM ('visual', 'hearing', 'locomotor', 'intellectual', 'multiple', 'other');
CREATE TYPE document_type AS ENUM ('disability_certificate', 'id_proof', 'medical_record', 'other');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete');

-- 2. PUBLIC USERS TABLE (Linked to auth.users)
CREATE TABLE users (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    TEXT NOT NULL,
  role         user_role NOT NULL DEFAULT 'asha_worker',
  ward_number  SMALLINT,                  -- NULL = access to all wards (admin)
  phone        TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. BENEFICIARIES TABLE
CREATE TABLE beneficiaries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type                beneficiary_type NOT NULL,
  full_name           TEXT NOT NULL,
  date_of_birth       DATE NOT NULL,
  age                 SMALLINT, -- Calculated via before insert/update trigger
  gender              gender NOT NULL,
  address             TEXT NOT NULL,
  ward_number         SMALLINT NOT NULL,
  phone               TEXT,
  emergency_contact   TEXT,
  is_verified         BOOLEAN NOT NULL DEFAULT FALSE,
  priority            priority_level NOT NULL DEFAULT 'low', -- Computed via trigger
  registered_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. HEALTH DETAILS TABLE (For elderly and both)
CREATE TABLE health_details (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id    UUID NOT NULL UNIQUE REFERENCES beneficiaries(id) ON DELETE CASCADE,
  lives_alone       BOOLEAN NOT NULL DEFAULT FALSE,
  is_bedridden      BOOLEAN NOT NULL DEFAULT FALSE,
  chronic_diseases  TEXT[],              -- e.g. ['diabetes', 'hypertension']
  pension_status    TEXT,               -- 'receiving' | 'applied' | 'not_applied'
  last_health_check DATE,
  notes             TEXT,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. DISABILITY DETAILS TABLE (For PwD and both)
CREATE TABLE disability_details (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id        UUID NOT NULL UNIQUE REFERENCES beneficiaries(id) ON DELETE CASCADE,
  disability_type       disability_type NOT NULL,
  disability_percentage SMALLINT NOT NULL CHECK (disability_percentage BETWEEN 0 AND 100),
  certificate_number    TEXT,
  assistive_devices     TEXT[],         -- e.g. ['wheelchair', 'hearing_aid']
  has_caregiver         BOOLEAN NOT NULL DEFAULT FALSE,
  caregiver_name        TEXT,
  caregiver_phone       TEXT,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. REQUESTS TABLE
CREATE TABLE requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
  request_type   request_type NOT NULL,
  other_details  TEXT,                  -- used when type = 'other'
  status         request_status NOT NULL DEFAULT 'pending',
  notes          TEXT,
  raised_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_to    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. EVENTS TABLE
CREATE TABLE events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  description         TEXT,
  event_date          DATE NOT NULL,
  location            TEXT,
  -- Eligibility filters (NULL = no filter applied)
  eligibility_wards   SMALLINT[],
  eligibility_types   beneficiary_type[],
  min_age             SMALLINT,
  max_age             SMALLINT,
  min_disability_pct  SMALLINT,
  priority_filter     priority_level[],
  created_by          UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. DOCUMENTS TABLE
CREATE TABLE documents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
  doc_type       document_type NOT NULL,
  file_name      TEXT NOT NULL,
  storage_path   TEXT NOT NULL,        -- Supabase Storage path
  uploaded_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. AUDIT LOGS TABLE
CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name    TEXT NOT NULL,
  record_id     UUID NOT NULL,
  action        audit_action NOT NULL,
  old_data      JSONB,
  new_data      JSONB,
  performed_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. SECURITY DEFINER FUNCTIONS FOR RLS ENFORCEMENT
-- These bypass RLS checks to prevent infinite recursion when checking roles/wards.

CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS user_role AS $$
DECLARE
  v_role user_role;
BEGIN
  SELECT role INTO v_role FROM public.users WHERE id = p_user_id;
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_user_ward(p_user_id UUID)
RETURNS SMALLINT AS $$
DECLARE
  v_ward SMALLINT;
BEGIN
  SELECT ward_number INTO v_ward FROM public.users WHERE id = p_user_id;
  RETURN v_ward;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_beneficiary_ward(p_beneficiary_id UUID)
RETURNS SMALLINT AS $$
DECLARE
  v_ward SMALLINT;
BEGIN
  SELECT ward_number INTO v_ward FROM beneficiaries WHERE id = p_beneficiary_id;
  RETURN v_ward;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 11. TRIGGER FUNCTIONS

-- Trigger to automatically create a public.users profile when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, role, ward_number, phone, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'asha_worker'),
    (NEW.raw_user_meta_data->>'ward_number')::SMALLINT,
    NEW.phone,
    TRUE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Priority Calculation helper
CREATE OR REPLACE FUNCTION recompute_priority(
  p_age SMALLINT,
  p_lives_alone BOOLEAN,
  p_is_bedridden BOOLEAN,
  p_disability_pct SMALLINT
) RETURNS priority_level AS $$
BEGIN
  IF p_age > 75 OR p_lives_alone = TRUE OR p_is_bedridden = TRUE OR p_disability_pct > 70 THEN
    RETURN 'high';
  ELSIF (p_age BETWEEN 60 AND 75) OR (p_disability_pct BETWEEN 1 AND 70) THEN
    RETURN 'medium';
  ELSE
    RETURN 'low';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger function on beneficiaries (runs BEFORE insert/update to compute age & priority)
CREATE OR REPLACE FUNCTION update_beneficiary_details_fn()
RETURNS TRIGGER AS $$
DECLARE
  v_lives_alone BOOLEAN := FALSE;
  v_is_bedridden BOOLEAN := FALSE;
  v_disability_pct SMALLINT := 0;
BEGIN
  -- Compute age from date_of_birth
  NEW.age := DATE_PART('year', AGE(NEW.date_of_birth))::SMALLINT;

  -- Fetch current health_details
  SELECT COALESCE(lives_alone, FALSE), COALESCE(is_bedridden, FALSE)
  INTO v_lives_alone, v_is_bedridden
  FROM health_details
  WHERE beneficiary_id = NEW.id;

  -- Fetch current disability_details
  SELECT COALESCE(disability_percentage, 0)
  INTO v_disability_pct
  FROM disability_details
  WHERE beneficiary_id = NEW.id;

  -- Calculate and set priority
  NEW.priority := recompute_priority(NEW.age, v_lives_alone, v_is_bedridden, v_disability_pct);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_beneficiaries_before
  BEFORE INSERT OR UPDATE OF date_of_birth ON beneficiaries
  FOR EACH ROW
  EXECUTE FUNCTION update_beneficiary_details_fn();

-- Trigger function to sync priority from health/disability changes
CREATE OR REPLACE FUNCTION sync_priority_from_related_details_fn()
RETURNS TRIGGER AS $$
DECLARE
  v_beneficiary_id UUID;
  v_age SMALLINT;
  v_lives_alone BOOLEAN := FALSE;
  v_is_bedridden BOOLEAN := FALSE;
  v_disability_pct SMALLINT := 0;
BEGIN
  v_beneficiary_id := NEW.beneficiary_id;

  -- Fetch beneficiary age
  SELECT age INTO v_age FROM beneficiaries WHERE id = v_beneficiary_id;

  -- Fetch current health_details
  SELECT COALESCE(lives_alone, FALSE), COALESCE(is_bedridden, FALSE)
  INTO v_lives_alone, v_is_bedridden
  FROM health_details
  WHERE beneficiary_id = v_beneficiary_id;

  -- Fetch current disability_details
  SELECT COALESCE(disability_percentage, 0)
  INTO v_disability_pct
  FROM disability_details
  WHERE beneficiary_id = v_beneficiary_id;

  -- Update priority in beneficiaries table
  UPDATE beneficiaries
  SET priority = recompute_priority(v_age, v_lives_alone, v_is_bedridden, v_disability_pct)
  WHERE id = v_beneficiary_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_health_details_after
  AFTER INSERT OR UPDATE ON health_details
  FOR EACH ROW
  EXECUTE FUNCTION sync_priority_from_related_details_fn();

CREATE OR REPLACE TRIGGER trg_disability_details_after
  AFTER INSERT OR UPDATE ON disability_details
  FOR EACH ROW
  EXECUTE FUNCTION sync_priority_from_related_details_fn();

-- Audit logging trigger function
CREATE OR REPLACE FUNCTION audit_log_changes_fn()
RETURNS TRIGGER AS $$
DECLARE
  v_performed_by UUID;
BEGIN
  BEGIN
    v_performed_by := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    v_performed_by := NULL;
  END;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, performed_by)
    VALUES (TG_TABLE_NAME, NEW.id, 'create', NULL, to_jsonb(NEW), v_performed_by);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, performed_by)
    VALUES (TG_TABLE_NAME, NEW.id, 'update', to_jsonb(OLD), to_jsonb(NEW), v_performed_by);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, performed_by)
    VALUES (TG_TABLE_NAME, OLD.id, 'delete', to_jsonb(OLD), NULL, v_performed_by);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER audit_beneficiaries
  AFTER INSERT OR UPDATE OR DELETE ON beneficiaries
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes_fn();

CREATE TRIGGER audit_requests
  AFTER INSERT OR UPDATE OR DELETE ON requests
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes_fn();

CREATE TRIGGER audit_events
  AFTER INSERT OR UPDATE OR DELETE ON events
  FOR EACH ROW EXECUTE FUNCTION audit_log_changes_fn();

-- 12. INDEXES
CREATE INDEX idx_beneficiaries_ward ON beneficiaries(ward_number);
CREATE INDEX idx_beneficiaries_type ON beneficiaries(type);
CREATE INDEX idx_beneficiaries_priority ON beneficiaries(priority);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_beneficiary ON requests(beneficiary_id);
CREATE INDEX idx_audit_record ON audit_logs(table_name, record_id);

-- 13. ENABLE ROW LEVEL SECURITY
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE disability_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 14. ROW LEVEL SECURITY POLICIES

-- Users Table
CREATE POLICY select_users ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY admin_all_users ON users FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');

-- Beneficiaries Table
CREATE POLICY select_beneficiaries ON beneficiaries FOR SELECT TO authenticated USING (
  public.get_user_role(auth.uid()) = 'admin' OR 
  beneficiaries.ward_number = public.get_user_ward(auth.uid())
);
CREATE POLICY insert_beneficiaries ON beneficiaries FOR INSERT TO authenticated WITH CHECK (
  public.get_user_role(auth.uid()) = 'admin' OR (
    public.get_user_role(auth.uid()) IN ('ward_member', 'asha_worker') AND 
    beneficiaries.ward_number = public.get_user_ward(auth.uid())
  )
);
CREATE POLICY update_beneficiaries ON beneficiaries FOR UPDATE TO authenticated USING (
  public.get_user_role(auth.uid()) = 'admin' OR (
    public.get_user_role(auth.uid()) IN ('ward_member', 'asha_worker') AND 
    beneficiaries.ward_number = public.get_user_ward(auth.uid())
  )
) WITH CHECK (
  public.get_user_role(auth.uid()) = 'admin' OR (
    public.get_user_role(auth.uid()) IN ('ward_member', 'asha_worker') AND 
    beneficiaries.ward_number = public.get_user_ward(auth.uid())
  )
);
CREATE POLICY delete_beneficiaries ON beneficiaries FOR DELETE TO authenticated USING (
  public.get_user_role(auth.uid()) = 'admin' OR (
    public.get_user_role(auth.uid()) IN ('ward_member', 'asha_worker') AND 
    beneficiaries.ward_number = public.get_user_ward(auth.uid())
  )
);

-- Health Details Table
CREATE POLICY select_health_details ON health_details FOR SELECT TO authenticated USING (
  public.get_user_role(auth.uid()) = 'admin' OR 
  public.get_beneficiary_ward(health_details.beneficiary_id) = public.get_user_ward(auth.uid())
);
CREATE POLICY insert_health_details ON health_details FOR INSERT TO authenticated WITH CHECK (
  public.get_user_role(auth.uid()) = 'admin' OR (
    public.get_user_role(auth.uid()) IN ('ward_member', 'asha_worker') AND 
    public.get_beneficiary_ward(health_details.beneficiary_id) = public.get_user_ward(auth.uid())
  )
);
CREATE POLICY update_health_details ON health_details FOR UPDATE TO authenticated USING (
  public.get_user_role(auth.uid()) = 'admin' OR (
    public.get_user_role(auth.uid()) IN ('ward_member', 'asha_worker') AND 
    public.get_beneficiary_ward(health_details.beneficiary_id) = public.get_user_ward(auth.uid())
  )
) WITH CHECK (
  public.get_user_role(auth.uid()) = 'admin' OR (
    public.get_user_role(auth.uid()) IN ('ward_member', 'asha_worker') AND 
    public.get_beneficiary_ward(health_details.beneficiary_id) = public.get_user_ward(auth.uid())
  )
);
CREATE POLICY delete_health_details ON health_details FOR DELETE TO authenticated USING (
  public.get_user_role(auth.uid()) = 'admin' OR (
    public.get_user_role(auth.uid()) IN ('ward_member', 'asha_worker') AND 
    public.get_beneficiary_ward(health_details.beneficiary_id) = public.get_user_ward(auth.uid())
  )
);

-- Disability Details Table
CREATE POLICY select_disability_details ON disability_details FOR SELECT TO authenticated USING (
  public.get_user_role(auth.uid()) = 'admin' OR 
  public.get_beneficiary_ward(disability_details.beneficiary_id) = public.get_user_ward(auth.uid())
);
CREATE POLICY insert_disability_details ON disability_details FOR INSERT TO authenticated WITH CHECK (
  public.get_user_role(auth.uid()) = 'admin' OR (
    public.get_user_role(auth.uid()) IN ('ward_member', 'asha_worker') AND 
    public.get_beneficiary_ward(disability_details.beneficiary_id) = public.get_user_ward(auth.uid())
  )
);
CREATE POLICY update_disability_details ON disability_details FOR UPDATE TO authenticated USING (
  public.get_user_role(auth.uid()) = 'admin' OR (
    public.get_user_role(auth.uid()) IN ('ward_member', 'asha_worker') AND 
    public.get_beneficiary_ward(disability_details.beneficiary_id) = public.get_user_ward(auth.uid())
  )
) WITH CHECK (
  public.get_user_role(auth.uid()) = 'admin' OR (
    public.get_user_role(auth.uid()) IN ('ward_member', 'asha_worker') AND 
    public.get_beneficiary_ward(disability_details.beneficiary_id) = public.get_user_ward(auth.uid())
  )
);
CREATE POLICY delete_disability_details ON disability_details FOR DELETE TO authenticated USING (
  public.get_user_role(auth.uid()) = 'admin' OR (
    public.get_user_role(auth.uid()) IN ('ward_member', 'asha_worker') AND 
    public.get_beneficiary_ward(disability_details.beneficiary_id) = public.get_user_ward(auth.uid())
  )
);

-- Requests Table
CREATE POLICY select_requests ON requests FOR SELECT TO authenticated USING (
  public.get_user_role(auth.uid()) = 'admin' OR 
  public.get_beneficiary_ward(requests.beneficiary_id) = public.get_user_ward(auth.uid())
);
CREATE POLICY insert_requests ON requests FOR INSERT TO authenticated WITH CHECK (
  public.get_user_role(auth.uid()) = 'admin' OR (
    public.get_user_role(auth.uid()) IN ('ward_member', 'asha_worker') AND 
    public.get_beneficiary_ward(requests.beneficiary_id) = public.get_user_ward(auth.uid())
  )
);
CREATE POLICY update_requests ON requests FOR UPDATE TO authenticated USING (
  public.get_user_role(auth.uid()) = 'admin' OR (
    public.get_user_role(auth.uid()) IN ('ward_member', 'asha_worker') AND 
    public.get_beneficiary_ward(requests.beneficiary_id) = public.get_user_ward(auth.uid())
  )
) WITH CHECK (
  public.get_user_role(auth.uid()) = 'admin' OR (
    public.get_user_role(auth.uid()) IN ('ward_member', 'asha_worker') AND 
    public.get_beneficiary_ward(requests.beneficiary_id) = public.get_user_ward(auth.uid())
  )
);
CREATE POLICY delete_requests ON requests FOR DELETE TO authenticated USING (
  public.get_user_role(auth.uid()) = 'admin' OR (
    public.get_user_role(auth.uid()) IN ('ward_member', 'asha_worker') AND 
    public.get_beneficiary_ward(requests.beneficiary_id) = public.get_user_ward(auth.uid())
  )
);

-- Events Table
CREATE POLICY select_events ON events FOR SELECT TO authenticated USING (true);
CREATE POLICY admin_all_events ON events FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');

-- Documents Table
CREATE POLICY select_documents ON documents FOR SELECT TO authenticated USING (
  public.get_user_role(auth.uid()) = 'admin' OR (
    public.get_user_role(auth.uid()) IN ('ward_member', 'asha_worker') AND 
    public.get_beneficiary_ward(documents.beneficiary_id) = public.get_user_ward(auth.uid())
  )
);
CREATE POLICY insert_documents ON documents FOR INSERT TO authenticated WITH CHECK (
  public.get_user_role(auth.uid()) = 'admin' OR (
    public.get_user_role(auth.uid()) IN ('ward_member', 'asha_worker') AND 
    public.get_beneficiary_ward(documents.beneficiary_id) = public.get_user_ward(auth.uid())
  )
);
CREATE POLICY update_documents ON documents FOR UPDATE TO authenticated USING (
  public.get_user_role(auth.uid()) = 'admin' OR (
    public.get_user_role(auth.uid()) IN ('ward_member', 'asha_worker') AND 
    public.get_beneficiary_ward(documents.beneficiary_id) = public.get_user_ward(auth.uid())
  )
) WITH CHECK (
  public.get_user_role(auth.uid()) = 'admin' OR (
    public.get_user_role(auth.uid()) IN ('ward_member', 'asha_worker') AND 
    public.get_beneficiary_ward(documents.beneficiary_id) = public.get_user_ward(auth.uid())
  )
);
CREATE POLICY delete_documents ON documents FOR DELETE TO authenticated USING (
  public.get_user_role(auth.uid()) = 'admin' OR (
    public.get_user_role(auth.uid()) IN ('ward_member', 'asha_worker') AND 
    public.get_beneficiary_ward(documents.beneficiary_id) = public.get_user_ward(auth.uid())
  )
);

-- Audit Logs Table
CREATE POLICY select_audit_logs ON audit_logs FOR SELECT TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');
-- Write access is disabled via API since they are inserted via triggers.
