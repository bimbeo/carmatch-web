-- ============================================================
-- CarMatch — Leads table
-- Chạy trong Supabase Dashboard > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS leads (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    timestamptz DEFAULT now(),
  source        text        NOT NULL CHECK (source IN ('b2b', 'partner')),
  name          text        NOT NULL,
  phone         text        NOT NULL,
  customer_type text,        -- 'resident' | 'business'   (b2b form)
  form_type     text,        -- 'monthly'  | 'daily'      (partner form)
  quantity      text,        -- số lượng xe               (b2b)
  duration      text,        -- thời gian thuê            (b2b)
  car_model     text,        -- mẫu xe                    (partner)
  building      text,        -- tòa nhà / khu vực         (cả 2)
  note          text,        -- yêu cầu thêm              (b2b)
  status        text        DEFAULT 'new'
                            CHECK (status IN ('new', 'contacted', 'converted'))
);

CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at DESC);

-- RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Anon INSERT (website submit form)
CREATE POLICY "anon_insert_leads"
  ON leads FOR INSERT TO anon
  WITH CHECK (true);

-- Ops team (authenticated) đọc & cập nhật
CREATE POLICY "auth_select_leads"
  ON leads FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "auth_update_leads"
  ON leads FOR UPDATE TO authenticated
  USING (true);
