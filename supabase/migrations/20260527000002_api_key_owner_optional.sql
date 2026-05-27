-- Allow system-level API keys with no specific owner
-- Service-created keys (e.g. from the worker route) don't belong to a single user.
alter table mcp_api_keys
  alter column owner_id drop not null;
