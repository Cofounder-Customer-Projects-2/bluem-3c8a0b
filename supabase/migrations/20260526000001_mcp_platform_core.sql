-- MCP Platform Core Schema
-- Mirrors the Scale AI pattern: server registry → tool catalog → task queue → result review

-- ============================================================
-- Enums
-- ============================================================

create type mcp_server_status as enum ('active', 'inactive', 'error', 'pending');
create type mcp_task_status as enum ('pending', 'running', 'completed', 'failed', 'cancelled');
create type mcp_review_status as enum ('pending', 'approved', 'rejected', 'needs_revision');

-- ============================================================
-- MCP Servers — the registry of all connected MCP servers
-- ============================================================

create table mcp_servers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  owner_id uuid references auth.users(id) on delete cascade,

  name text not null,
  slug text not null unique,
  description text,
  endpoint_url text not null,
  transport text not null default 'stdio' check (transport in ('stdio', 'sse', 'http')),

  -- Server capabilities & metadata
  version text,
  tags text[] not null default '{}',
  status mcp_server_status not null default 'pending',
  last_ping_at timestamptz,
  error_message text,

  -- Config (non-secret): timeouts, concurrency limits, etc.
  config jsonb not null default '{}'
);

create index mcp_servers_owner_idx on mcp_servers(owner_id);
create index mcp_servers_status_idx on mcp_servers(status);
create index mcp_servers_tags_idx on mcp_servers using gin(tags);

-- ============================================================
-- MCP Tools — tools exposed by each server (auto-populated on registration)
-- ============================================================

create table mcp_tools (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  server_id uuid not null references mcp_servers(id) on delete cascade,

  name text not null,
  description text,
  input_schema jsonb not null default '{}',   -- JSON Schema of tool input
  output_schema jsonb,                          -- Optional output shape hint
  is_active boolean not null default true,

  unique(server_id, name)
);

create index mcp_tools_server_idx on mcp_tools(server_id);
create index mcp_tools_name_idx on mcp_tools(name);

-- ============================================================
-- Tasks — the job queue (one task = one tool invocation)
-- ============================================================

create table mcp_tasks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,

  owner_id uuid references auth.users(id) on delete set null,
  server_id uuid not null references mcp_servers(id),
  tool_id uuid not null references mcp_tools(id),

  -- Human-readable label for the task
  title text not null,
  description text,

  -- Input arguments matching the tool's input_schema
  input_args jsonb not null default '{}',

  status mcp_task_status not null default 'pending',
  priority int not null default 0 check (priority between 0 and 10),

  -- Execution tracking
  retry_count int not null default 0,
  max_retries int not null default 3,
  error_message text,

  -- Metadata / tags for filtering
  tags text[] not null default '{}',
  metadata jsonb not null default '{}'
);

create index mcp_tasks_owner_idx on mcp_tasks(owner_id);
create index mcp_tasks_server_idx on mcp_tasks(server_id);
create index mcp_tasks_tool_idx on mcp_tasks(tool_id);
create index mcp_tasks_status_idx on mcp_tasks(status);
create index mcp_tasks_priority_idx on mcp_tasks(priority desc, created_at asc);
create index mcp_tasks_tags_idx on mcp_tasks using gin(tags);

-- ============================================================
-- Task Results — raw output from each execution + review verdict
-- ============================================================

create table mcp_task_results (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  task_id uuid not null unique references mcp_tasks(id) on delete cascade,
  reviewer_id uuid references auth.users(id) on delete set null,

  -- Raw MCP tool response (content array from protocol)
  raw_output jsonb not null default '{}',
  -- Normalised text content extracted from raw_output
  text_content text,

  -- Quality review (mirrors Scale AI's review pipeline)
  review_status mcp_review_status not null default 'pending',
  review_notes text,
  reviewed_at timestamptz,

  -- Execution metrics
  duration_ms int,
  token_count int
);

create index mcp_task_results_task_idx on mcp_task_results(task_id);
create index mcp_task_results_review_idx on mcp_task_results(review_status);

-- ============================================================
-- API Keys — programmatic access to the platform
-- ============================================================

create table mcp_api_keys (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  last_used_at timestamptz,

  owner_id uuid not null references auth.users(id) on delete cascade,

  name text not null,
  key_prefix text not null,      -- e.g. "mcp_live_" — shown in UI
  key_hash text not null unique, -- bcrypt hash stored, never the raw key

  is_active boolean not null default true,
  expires_at timestamptz,
  scopes text[] not null default '{tasks:read,tasks:write,servers:read}'
);

create index mcp_api_keys_owner_idx on mcp_api_keys(owner_id);

-- ============================================================
-- Updated-at triggers
-- ============================================================

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger mcp_servers_updated_at
  before update on mcp_servers
  for each row execute function update_updated_at();

create trigger mcp_tools_updated_at
  before update on mcp_tools
  for each row execute function update_updated_at();

create trigger mcp_tasks_updated_at
  before update on mcp_tasks
  for each row execute function update_updated_at();

create trigger mcp_task_results_updated_at
  before update on mcp_task_results
  for each row execute function update_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table mcp_servers enable row level security;
alter table mcp_tools enable row level security;
alter table mcp_tasks enable row level security;
alter table mcp_task_results enable row level security;
alter table mcp_api_keys enable row level security;

-- Servers: owners can manage; everyone can read active servers
create policy "servers_select_active" on mcp_servers
  for select using (status = 'active' or owner_id = auth.uid());

create policy "servers_insert_owner" on mcp_servers
  for insert with check (owner_id = auth.uid());

create policy "servers_update_owner" on mcp_servers
  for update using (owner_id = auth.uid());

create policy "servers_delete_owner" on mcp_servers
  for delete using (owner_id = auth.uid());

-- Tools: readable alongside their server
create policy "tools_select" on mcp_tools
  for select using (
    exists (
      select 1 from mcp_servers s
      where s.id = mcp_tools.server_id
        and (s.status = 'active' or s.owner_id = auth.uid())
    )
  );

create policy "tools_manage_server_owner" on mcp_tools
  for all using (
    exists (
      select 1 from mcp_servers s
      where s.id = mcp_tools.server_id and s.owner_id = auth.uid()
    )
  );

-- Tasks: owner can manage; others can read
create policy "tasks_select_owner" on mcp_tasks
  for select using (owner_id = auth.uid() or owner_id is null);

create policy "tasks_insert_owner" on mcp_tasks
  for insert with check (owner_id = auth.uid() or owner_id is null);

create policy "tasks_update_owner" on mcp_tasks
  for update using (owner_id = auth.uid());

-- Results: readable if you own the task
create policy "results_select" on mcp_task_results
  for select using (
    exists (
      select 1 from mcp_tasks t
      where t.id = mcp_task_results.task_id
        and (t.owner_id = auth.uid() or t.owner_id is null)
    )
  );

create policy "results_manage" on mcp_task_results
  for all using (
    exists (
      select 1 from mcp_tasks t
      where t.id = mcp_task_results.task_id
        and (t.owner_id = auth.uid() or t.owner_id is null)
    )
  );

-- API keys: owner only
create policy "api_keys_owner" on mcp_api_keys
  for all using (owner_id = auth.uid());

-- ============================================================
-- Seed data — demo server + tools + sample tasks
-- ============================================================

-- Insert a demo server (no owner = system server)
insert into mcp_servers (id, name, slug, description, endpoint_url, transport, version, tags, status, config)
values (
  'a0000000-0000-0000-0000-000000000001',
  'File System MCP',
  'filesystem',
  'Read, write, and search the local filesystem via MCP. Supports directory listings, file reads, and content search.',
  'stdio://filesystem-mcp-server',
  'stdio',
  '1.0.0',
  array['filesystem', 'io', 'search'],
  'active',
  '{"timeout_ms": 30000, "max_concurrent": 5}'::jsonb
);

insert into mcp_servers (id, name, slug, description, endpoint_url, transport, version, tags, status, config)
values (
  'a0000000-0000-0000-0000-000000000002',
  'Web Search MCP',
  'web-search',
  'Search the web with Brave Search, fetch URLs, and extract structured content from web pages.',
  'sse://web-search-mcp.example.com/sse',
  'sse',
  '2.1.0',
  array['search', 'web', 'fetch'],
  'active',
  '{"timeout_ms": 15000, "max_concurrent": 10}'::jsonb
);

insert into mcp_servers (id, name, slug, description, endpoint_url, transport, version, tags, status, config)
values (
  'a0000000-0000-0000-0000-000000000003',
  'Code Execution MCP',
  'code-exec',
  'Execute Python, JavaScript, and shell commands in a sandboxed environment with output capture.',
  'http://code-exec-mcp.example.com',
  'http',
  '0.9.2',
  array['code', 'python', 'javascript', 'execution'],
  'active',
  '{"timeout_ms": 60000, "max_concurrent": 3}'::jsonb
);

-- Tools for File System MCP
insert into mcp_tools (server_id, name, description, input_schema) values
  ('a0000000-0000-0000-0000-000000000001', 'read_file',
   'Read the contents of a file at the given path.',
   '{"type":"object","properties":{"path":{"type":"string","description":"Absolute or relative file path"}},"required":["path"]}'::jsonb),
  ('a0000000-0000-0000-0000-000000000001', 'write_file',
   'Write content to a file, creating it if it does not exist.',
   '{"type":"object","properties":{"path":{"type":"string"},"content":{"type":"string"}},"required":["path","content"]}'::jsonb),
  ('a0000000-0000-0000-0000-000000000001', 'list_directory',
   'List files and directories at the given path.',
   '{"type":"object","properties":{"path":{"type":"string"},"recursive":{"type":"boolean","default":false}},"required":["path"]}'::jsonb),
  ('a0000000-0000-0000-0000-000000000001', 'search_files',
   'Search for files by name pattern or content.',
   '{"type":"object","properties":{"path":{"type":"string"},"pattern":{"type":"string"}},"required":["path","pattern"]}'::jsonb);

-- Tools for Web Search MCP
insert into mcp_tools (server_id, name, description, input_schema) values
  ('a0000000-0000-0000-0000-000000000002', 'brave_search',
   'Search the web using Brave Search and return organic results.',
   '{"type":"object","properties":{"query":{"type":"string"},"count":{"type":"integer","default":10,"maximum":20}},"required":["query"]}'::jsonb),
  ('a0000000-0000-0000-0000-000000000002', 'fetch_url',
   'Fetch the raw HTML or text content of a URL.',
   '{"type":"object","properties":{"url":{"type":"string","format":"uri"},"extract_text":{"type":"boolean","default":true}},"required":["url"]}'::jsonb);

-- Tools for Code Execution MCP
insert into mcp_tools (server_id, name, description, input_schema) values
  ('a0000000-0000-0000-0000-000000000003', 'run_python',
   'Execute a Python script and capture stdout/stderr.',
   '{"type":"object","properties":{"code":{"type":"string"},"timeout_seconds":{"type":"integer","default":30}},"required":["code"]}'::jsonb),
  ('a0000000-0000-0000-0000-000000000003', 'run_javascript',
   'Execute a JavaScript snippet with Node.js and capture output.',
   '{"type":"object","properties":{"code":{"type":"string"},"timeout_seconds":{"type":"integer","default":30}},"required":["code"]}'::jsonb),
  ('a0000000-0000-0000-0000-000000000003', 'run_shell',
   'Run a shell command in the sandbox environment.',
   '{"type":"object","properties":{"command":{"type":"string"},"working_dir":{"type":"string","default":"/"}},"required":["command"]}'::jsonb);
