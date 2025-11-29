-- ============================================
-- User Admin System Migration
-- Created: 2025-01-29
-- Purpose: Add admin capabilities to access_links table
--          and create audit logging system
-- ============================================

-- Start transaction
BEGIN;

-- ============================================
-- Step 1: Backup current access_links table
-- ============================================
CREATE TABLE IF NOT EXISTS access_links_backup_20250129 AS
SELECT * FROM access_links;

-- ============================================
-- Step 2: Add is_admin column to access_links
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'access_links' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE access_links
    ADD COLUMN is_admin BOOLEAN DEFAULT false NOT NULL;

    RAISE NOTICE 'Added is_admin column to access_links table';
  ELSE
    RAISE NOTICE 'is_admin column already exists, skipping';
  END IF;
END $$;

-- ============================================
-- Step 3: Create partial index for admin users
-- ============================================
CREATE INDEX IF NOT EXISTS idx_access_links_is_admin
ON access_links(is_admin)
WHERE is_admin = true;

-- ============================================
-- Step 4: Create admin action logs table
-- ============================================
CREATE TABLE IF NOT EXISTS admin_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES access_links(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('grant_admin', 'revoke_admin', 'deactivate_user', 'activate_user')),
  target_user_id UUID NOT NULL REFERENCES access_links(id) ON DELETE CASCADE,
  target_user_nickname VARCHAR(255),
  ip_address VARCHAR(45), -- IPv6 support
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- Step 5: Create indexes for admin_action_logs
-- ============================================
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_admin_id
ON admin_action_logs(admin_id);

CREATE INDEX IF NOT EXISTS idx_admin_action_logs_target_user_id
ON admin_action_logs(target_user_id);

CREATE INDEX IF NOT EXISTS idx_admin_action_logs_created_at
ON admin_action_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_action_logs_action_type
ON admin_action_logs(action_type);

-- ============================================
-- Step 6: Add Row Level Security (RLS) policies
-- ============================================

-- Enable RLS on access_links if not already enabled
ALTER TABLE access_links ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all access_links" ON access_links;
DROP POLICY IF EXISTS "Users can update own record" ON access_links;
DROP POLICY IF EXISTS "Only admins can update is_admin" ON access_links;

-- Policy: Everyone can read access_links (for user list)
CREATE POLICY "Users can view all access_links"
ON access_links
FOR SELECT
USING (true);

-- Policy: Users can update their own record (except is_admin)
CREATE POLICY "Users can update own record"
ON access_links
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid() AND
  -- Prevent users from changing their own is_admin status
  (is_admin = (SELECT is_admin FROM access_links WHERE id = auth.uid()))
);

-- Policy: Only admins can grant/revoke admin privileges
CREATE POLICY "Only admins can update is_admin"
ON access_links
FOR UPDATE
USING (
  -- Current user must be an admin
  EXISTS (
    SELECT 1 FROM access_links
    WHERE id = auth.uid() AND is_admin = true
  )
)
WITH CHECK (
  -- Current user must be an admin
  EXISTS (
    SELECT 1 FROM access_links
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Enable RLS on admin_action_logs
ALTER TABLE admin_action_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
ON admin_action_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM access_links
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Policy: Only admins can insert audit logs (done via API)
CREATE POLICY "Only admins can insert audit logs"
ON admin_action_logs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM access_links
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- ============================================
-- Step 7: Create function to ensure minimum admin count
-- ============================================
CREATE OR REPLACE FUNCTION check_minimum_admin_count()
RETURNS TRIGGER AS $$
DECLARE
  admin_count INTEGER;
BEGIN
  -- Only check when revoking admin privileges
  IF OLD.is_admin = true AND NEW.is_admin = false THEN
    -- Count remaining admins
    SELECT COUNT(*) INTO admin_count
    FROM access_links
    WHERE is_admin = true AND id != NEW.id;

    -- Prevent removal if this is the last admin
    IF admin_count < 1 THEN
      RAISE EXCEPTION 'Cannot revoke admin privileges: at least one admin must remain';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for minimum admin check
DROP TRIGGER IF EXISTS ensure_minimum_admin ON access_links;
CREATE TRIGGER ensure_minimum_admin
  BEFORE UPDATE ON access_links
  FOR EACH ROW
  WHEN (OLD.is_admin IS DISTINCT FROM NEW.is_admin)
  EXECUTE FUNCTION check_minimum_admin_count();

-- ============================================
-- Step 8: Set first user as admin (optional)
-- ============================================
-- Uncomment and modify this if you want to set an initial admin
-- UPDATE access_links
-- SET is_admin = true
-- WHERE kakao_user_id = 'YOUR_KAKAO_USER_ID'
-- LIMIT 1;

-- ============================================
-- Verification queries (commented out)
-- ============================================
-- SELECT COUNT(*) as total_users FROM access_links;
-- SELECT COUNT(*) as admin_users FROM access_links WHERE is_admin = true;
-- SELECT * FROM access_links WHERE is_admin = true;
-- SELECT * FROM admin_action_logs ORDER BY created_at DESC LIMIT 10;

-- ============================================
-- Commit transaction
-- ============================================
COMMIT;

-- ============================================
-- Rollback plan (if needed)
-- ============================================
-- BEGIN;
-- DROP TABLE IF EXISTS admin_action_logs;
-- ALTER TABLE access_links DROP COLUMN IF EXISTS is_admin;
-- DROP TABLE access_links;
-- ALTER TABLE access_links_backup_20250129 RENAME TO access_links;
-- COMMIT;
