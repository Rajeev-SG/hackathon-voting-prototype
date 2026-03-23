# Hackathon Voting Prototype

Frontend prototype for a hackathon judging and submission workflow, built with Next.js App Router, TypeScript, Tailwind CSS, and a Shadcn-style component layer.

## Stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Radix-based Shadcn primitives
- Lucide React

## App routes

- `/projects` - judge project directory
- `/projects/[slug]` - project detail
- `/projects/[slug]/score` - scoring workflow
- `/results` - scoreboard and tie-break dashboard
- `/submission/assets` - participant asset upload flow

## Prerequisites

- Node.js 20+
- npm 10+

## Run locally

```bash
npm install
npm run dev
```

Then open:

```text
http://localhost:3000
```

Useful scripts:

```bash
npm run check
npm run build
```

## Project structure

```text
app/                  Next.js App Router pages and layouts
components/           screen components and UI primitives
lib/mock-data.ts      typed mock content used across screens
theme-lab/            provided token exports and design references
```

## Agentation integration

Official docs:

- Install: https://agentation.dev/install
- MCP: https://agentation.dev/mcp

Notes from the current docs:

- Agentation is currently desktop-only.
- The toolbar package install command is `npm install agentation`.
- The MCP package is `agentation-mcp`.
- The recommended cross-agent setup command is `npx add-mcp "npx -y agentation-mcp server"`.
- The verification command is `npx agentation-mcp doctor`.

### 1. Install the toolbar package

```bash
npm install agentation
```

Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`, then use the Agentation toolbar in the browser to annotate the UI.

This app now mounts Agentation automatically in development from the root layout. By default it connects to:

```text
http://localhost:4747
```

Override that with:

```bash
NEXT_PUBLIC_AGENTATION_ENDPOINT=http://localhost:4747
```

### 2. Connect Agentation to your coding agent with MCP

Recommended setup from the docs:

```bash
npx add-mcp "npx -y agentation-mcp server"
```

This auto-detects supported agents and writes the correct MCP configuration.

Verify the setup:

```bash
npx agentation-mcp doctor
```

### 3. Codex manual configuration

If you want to wire Codex manually, add this to `~/.codex/config.toml`:

```toml
[mcp_servers.agentation]
command = "npx"
args = [ "-y", "agentation-mcp", "server" ]
enabled = true
```

In this environment, that Agentation MCP block is already present in `~/.codex/config.toml`.

### 4. Typical workflow

1. Run the app with `npm run dev`.
2. Open the page you want to review.
3. Annotate elements with Agentation in the browser.
4. In your coding agent, ask it to review or fix the pending annotations.

Examples:

- `address my feedback`
- `list my pending annotations`
- `fix annotation 3`

### 5. What MCP gives the agent

Per the official docs, the MCP server exposes tools for:

- listing annotation sessions
- reading pending annotations
- acknowledging feedback
- replying to annotations
- resolving or dismissing annotations
- watching for new annotations in a loop

That removes the copy-paste step and lets the agent work directly from the structured annotation data.

## Theme source

The palette is derived from:

```text
theme-lab/dist/tokens/radix-scales.css
```

Semantic theme variables are mapped in `app/globals.css`, and Tailwind scale aliases are defined in `tailwind.config.ts`.
