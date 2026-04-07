# Flow Forge
You describe a task. It builds a workflow. No drag‑and‑drop UI, configuration files, or accounts.

**Live demo:** [https://flow-forge.casey-digennaro.workers.dev](https://flow-forge.casey-digennaro.workers.dev)

---

## Why This Exists
You already know how to explain a job that needs doing. Most tools make you learn their interface first—node palettes, connection rules, proprietary syntax. This skips that. Describe the work, get the steps.

## Quick Start
Run your own copy in minutes:
1.  **Fork this repo first.** Everything starts with your fork.
2.  Deploy to Cloudflare Workers.
3.  Set one environment variable: `DEEPSEEK_API_KEY`.
4.  Bind one empty KV namespace named `FLOWFORGE_KV`.

Your instance is live. All workflows are stored in your KV and never leave your account.

## What It Does
- You write a plain‑English instruction: *“each Monday, fetch new support tickets, highlight urgent ones, post a summary to Slack.”*
- It returns a clear, linear sequence of steps as JSON.
- The entire application is under 500 lines of TypeScript. There are no npm dependencies.
- You can edit the core prompting logic in `src/flowBuilder.ts` without breaking stored workflows.
- Security headers (CSP) are enabled by default.

## Limitations
Workflows are stored as JSON in KV and do not trigger automatically—you must execute them manually from the UI. Each step is limited to 2KB due to KV transaction constraints.

## How It Works
This is a single Cloudflare Worker. It uses the DeepSeek API to parse your instruction into a structured list of steps, which are then saved to your KV namespace. The UI reads from KV and presents the steps in order. There is no backend beyond Workers and KV.

---

Superinstance and Lucineer (DiGennaro et al.)

<div style="text-align:center;padding:16px;color:#64748b;font-size:.8rem"><a href="https://the-fleet.casey-digennaro.workers.dev" style="color:#64748b">The Fleet</a> &middot; <a href="https://cocapn.ai" style="color:#64748b">Cocapn</a></div>