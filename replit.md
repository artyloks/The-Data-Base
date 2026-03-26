# The Brain — Hacker-First AI Agent Platform

## Philosophy
Generate real, runnable code. GitHub-first. Local-first. Run anywhere, not platform-locked.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild
- **AI**: OpenAI via Replit AI Integrations (gpt-5.2 for Flywheel Bot)
- **Frontend**: React + Vite + Tailwind CSS + Framer Motion

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── the-brain/          # Hacker-first frontend website
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   ├── integrations-openai-ai-server/  # OpenAI server-side client
│   └── integrations-openai-ai-react/   # OpenAI React hooks
├── .github/workflows/      # CI/CD pipeline (GitHub Actions)
├── .vscode/mcp.json        # VS Code MCP server config
├── scripts/                # Utility scripts
└── package.json
```

## Features

### Flywheel Aider Bot
Real-time AI code analysis via OpenAI (gpt-5.2). SSE streaming endpoint at `POST /api/flywheel/analyze`.
- Drop any code file, choose focus area (performance/security/architecture)
- Streams improvement suggestions live in terminal-style UI
- History tracked in-memory per session

### GitHub Actions CLI Generator
Generates pure `.github/workflows/ci.yml` YAML for any project type.
- `POST /api/cli/generate-actions`
- Supports: react-vite, express-api, expo-mobile, python-fastapi, fullstack-monorepo
- Deploy targets: GitHub Pages, Vercel, Railway, Fly.io, AWS EC2

### VS Code MCP Config Generator
Generates drop-in `.vscode/mcp.json` for any editor.
- `POST /api/mcp/generate-config`
- Tools: brave-search, local-bash, supabase, filesystem, github, the-brain
- Editors: VS Code, Cursor, Windsurf, Neovim

### Agent Chat
Simulated agentic loop demonstration at `POST /api/agent/chat`.
- Shows Input → Plan → Execute → Verify → Heal loop
- Tool calls visualized: get_filesystem_structure, write_file, run_shell_command, brave_search, supabase_query

## API Routes

- `GET /api/healthz` — health check
- `POST /api/agent/chat` — send message to agent
- `GET /api/agent/history` — get chat history
- `POST /api/agent/reset` — reset session
- `POST /api/flywheel/analyze` — SSE: real AI code analysis stream
- `GET /api/flywheel/history` — past analysis runs
- `POST /api/cli/generate-actions` — generate GitHub Actions YAML
- `POST /api/mcp/generate-config` — generate MCP server config

## GitHub
Repository: `github.com/artyloks/The-Data-Base` (private)
Token secret: `Art_to_GH_Account`

## DB Schema

- `chat_sessions` — session management
- `chat_messages` — persistent message history
- `conversations` — OpenAI conversation tracking
- `messages` — OpenAI message history

## Running Locally (extracted from CI)

```bash
git clone https://github.com/artyloks/The-Data-Base.git
cd The-Data-Base
pnpm install
# Set DATABASE_URL, AI_INTEGRATIONS_OPENAI_BASE_URL, AI_INTEGRATIONS_OPENAI_API_KEY
pnpm --filter @workspace/api-spec run codegen
pnpm --filter @workspace/db run push
pnpm --filter @workspace/api-server run dev   # API on :8080
pnpm --filter @workspace/the-brain run dev     # Frontend on :23538
```
