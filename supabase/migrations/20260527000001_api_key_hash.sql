-- Add key_hash column to api_keys for secure key verification
-- and ensure transport column naming is consistent

alter table api_keys
  add column if not exists key_hash text;

-- Index for fast lookup by prefix
create index if not exists idx_api_keys_prefix
  on api_keys(key_prefix)
  where is_active = true;

-- Ensure mcp_servers uses 'transport' column (already set in initial migration)
-- Add config jsonb column if not present
alter table mcp_servers
  add column if not exists config jsonb not null default '{}';
