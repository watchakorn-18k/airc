# ai-code-arc — AI Code Reviewer

AI-powered terminal code reviewer with severity scoring, TUI dashboard, diff review, and CI/CD integration.

[![npm version](https://img.shields.io/npm/v/ai-code-arc.svg)](https://www.npmjs.com/package/ai-code-arc)
[![npm downloads](https://img.shields.io/npm/dw/ai-code-arc.svg)](https://www.npmjs.com/package/ai-code-arc)
[![License: MIT](https://img.shields.io/npm/l/ai-code-arc.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)

> Scan your code. Get structured feedback. Ship with confidence.

![Demo](https://i.imgur.com/placeholder.png)

## Name

**ai-code-arc** = **AI** + **Code** → *AI-powered code review*

Short, fast, to the point — like the review itself.

## Features

- **Multi-language** — TypeScript, JavaScript, Python, Go
- **AI-powered analysis** — security, quality, performance, best practices
- **Multiple AI providers** — OpenAI (any compatible endpoint), Ollama (local), or any OpenAI-compatible API
- **TUI dashboard** — interactive terminal UI with score bars, cards, and tables
- **Diff review** — compare before/after changes, focus on what matters
- **Result caching** — SHA256-based cache, skip unchanged files
- **CI/CD integration** — exit codes, JSON output, severity thresholds
- **Per-project config** — `.coderc.json` for project-specific settings
- **Custom rules** — define your own linting rules with regex patterns
- **Persistent settings** — save provider, model, API key, and custom system prompt in `~/.ai-code-arc/settings.json`

## Install

### macOS (Homebrew)

```bash
brew tap watchakorn-18k/ai-code-arc
brew install ai-code-arc
```

### npm (any OS)

```bash
npm install -g ai-code-arc
```

### From source

```bash
git clone https://github.com/watchakorn-18k/ai-code-arc.git
cd ai-code-arc
npm install
npm run build
npm link
```

## Quick Start

```bash
# Review current directory
ai-code-arc .

# Review a specific file
ai-code-arc src/index.ts

# Review a directory
ai-code-arc src/

# TUI dashboard (interactive)
ai-code-arc . --tui

# Diff review (compare two files)
ai-code-arc --diff old.ts new.ts

# CI mode (JSON output, exit codes)
ai-code-arc . --json --ci
```

## Setup

Save your API credentials once — they're stored in `~/.ai-code-arc/settings.json`:

```bash
# Save API key, base URL, model, and provider
ai-code-arc --set-api-key "sk-xxx" \
    --set-base-url "https://api.example.com/v1" \
    --set-model "qwen3.6-35b-a3b" \
    --set-provider openai

# Show current settings
ai-code-arc --show-settings

# Clear the result cache
ai-code-arc --clear-cache
```

After setup, just run `ai-code-arc .` — no flags needed.

### Settings priority

Settings are resolved in this order (highest priority first):

1. CLI flags (`--key`, `--provider`, `--custom-prompt`, etc.)
2. Environment variables (`OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OLLAMA_BASE_URL`)
3. `~/.ai-code-arc/settings.json` (saved via `--set-*`)
4. `.coderc.json` (per-project config)
5. Built-in defaults

### Custom System Prompt

Inject your own instructions into the AI review process. Control the reviewer's focus, tone, and expertise area.

**Save a custom prompt permanently** (stored in `~/.ai-code-arc/settings.json`):

```bash
ai-code-arc --set-custom-prompt "Review like a senior TypeScript engineer. Focus on type safety, error handling, and React best practices. Flag any usage of 'any' type."
```

**One-shot override** (for this review only, doesn't save):

```bash
ai-code-arc src/ --custom-prompt "Focus only on security issues — SQL injection, XSS, exposed secrets, auth bypass."
```

**Examples of useful custom prompts:**

```bash
# Security-focused review
ai-code-arc --set-custom-prompt "You are a security auditor. Focus on: SQL injection, XSS, CSRF, exposed secrets, insecure dependencies, auth bypass. Flag every security concern as critical."

# Performance-focused review
ai-code-arc --set-custom-prompt "You are a performance engineer. Focus on: N+1 queries, missing indexes, O(n²) algorithms, unbounded loops, large payloads, missing pagination."

# Code quality review
ai-code-arc --set-custom-prompt "You are a code quality reviewer. Focus on: SOLID principles, DRY violations, naming conventions, function length (>50 lines), cyclomatic complexity, missing error handling."

# Team-specific rules
ai-code-arc --set-custom-prompt "This team follows these rules: no console.log in production, all functions must have JSDoc, all exports must be typed, no 'any' type allowed, all API calls must use try/catch."

# Language-specific
ai-code-arc --set-custom-prompt "You are a Python expert. Focus on: PEP 8 compliance, type hints, proper exception handling, list comprehension usage, GIL-aware concurrency."
```

**How it works:**

- `--set-custom-prompt` saves the prompt to `~/.ai-code-arc/settings.json`. Every `ai-code-arc` run uses it automatically.
- `--custom-prompt` overrides the saved prompt for a single run only.
- CLI `--custom-prompt` takes priority over the saved `--set-custom-prompt`.
- The custom prompt is injected as the AI's system instruction, so it shapes the entire review.

### Clearing custom prompt

To remove a saved custom prompt, save an empty string:

```bash
ai-code-arc --set-custom-prompt ""
```

Then check with:

```bash
ai-code-arc --show-settings
```

## Usage

### TUI Mode

Beautiful interactive terminal UI with real-time results:

```bash
ai-code-arc . --tui
```

Shows:
- Overall score with visual bar (`████░░`)
- Critical / Warning / Info cards with color coding
- File summary table
- Detailed issue list with severity icons (✕ ! i)
- Auto-exit after 8 seconds

### Diff Review

Compare two files and review only the changes:

```bash
ai-code-arc --diff before.ts after.ts
```

The AI analyzes only the added/removed lines, so you get focused feedback on what actually changed.

### CI/CD Mode

JSON output with exit codes for pipelines:

```bash
ai-code-arc . --json --ci
```

**Exit codes:**

| Code | Meaning |
|---|---|
| 0 | All checks passed |
| 1 | Critical issues found |
| 2 | Warnings found |

### Ollama (Local Model)

Run with a local Ollama instance — no API key needed:

```bash
ai-code-arc . --provider ollama --model qwen3.6-35b-a3b
```

Defaults to `http://localhost:11434`. Override with `--base-url`.

### Custom Gateway

Any OpenAI-compatible endpoint works:

```bash
ai-code-arc . \
  --provider openai \
  --base-url https://your-gateway.example.com/v1 \
  --model your-model-name \
  --key sk-your-key
```

## CLI Reference

```
ai-code-arc [target] [options]
```

**Arguments:**

| Argument | Description | Default |
|---|---|---|
| `target` | File or directory to review | `.` |

**Options:**

| Flag | Description | Default |
|---|---|---|
| `-p, --provider <type>` | AI provider: `openai` or `ollama` | `openai` |
| `-m, --model <model>` | Model name | `qwen3.6-35b-a3b` |
| `-k, --key <key>` | API key (overrides env var) | — |
| `-n, --max-files <n>` | Max files to scan | `50` |
| `--no-cache` | Disable result caching | enabled |
| `--diff <before> <after>` | Review changes between two files | — |
| `--json` | Output results as JSON (CI mode) | — |
| `--ci` | Enable CI mode (exit codes, no color) | — |
| `--tui` | Enable TUI mode (interactive dashboard) | — |
| `--clear-cache` | Clear the result cache | — |
| `--ignore <paths...>` | Ignore paths | `node_modules, dist, build, .git` |
| `--base-url <url>` | API base URL (overrides env var) | — |
| `--set-provider <type>` | Save default provider | — |
| `--set-model <model>` | Save default model | — |
| `--set-api-key <key>` | Save API key | — |
| `--set-base-url <url>` | Save base URL | — |
| `--set-max-files <n>` | Save max files to scan | — |
| `--set-custom-prompt <prompt>` | Save custom system prompt | — |
| `--custom-prompt <prompt>` | Custom system prompt for this review (overrides settings) | — |
| `--show-settings` | Show current settings | — |

## Per-Project Config

Create `.coderc.json` in your project root:

```json
{
  "provider": "ollama",
  "model": "qwen3.6-35b-a3b",
  "maxFiles": 30,
  "ciMode": false,
  "thresholds": {
    "maxCritical": 0,
    "maxWarning": -1
  },
  "ignorePaths": ["node_modules", "dist", "test"],
  "customRules": [
    {
      "name": "no-console",
      "pattern": "console\\.(log|debug|error)",
      "severity": "warning",
      "message": "Remove console statements before commit"
    }
  ],
  "customPrompt": "Review this React project. Focus on component composition, prop types, and hook dependencies."
}
```

### Thresholds

- `maxCritical`: Max allowed critical issues (`0` = fail on any)
- `maxWarning`: Max allowed warnings (`-1` = no limit)

### Custom Rules

Define your own rules with regex patterns (runs before AI review):

| Field | Description |
|---|---|
| `name` | Rule identifier (slug) |
| `pattern` | Regex to match against file content |
| `severity` | `critical`, `warning`, or `info` |
| `message` | Description shown in output |

### Custom Prompt (Project-Level)

Set `customPrompt` in `.coderc.json` for project-specific AI instructions. This overrides the global `~/.ai-code-arc/settings.json` prompt for this project only:

```json
{
  "customPrompt": "This is a React project. Focus on component composition, prop types, and hook dependencies."
}
```

| Field | Description |
|---|---|
| `name` | Rule identifier (slug) |
| `pattern` | Regex to match against file content |
| `severity` | `critical`, `warning`, or `info` |
| `message` | Description shown in output |

## AI Providers

### OpenAI (or any compatible endpoint)

Uses the OpenAI SDK with a custom base URL. Works with:
- OpenAI (gpt-4o, gpt-4o-mini, etc.)
- xxxx gateway (qwen3.6-35b-a3b)
- Any OpenAI-compatible API (LiteLLM, vLLM, Ollama API, etc.)

### Ollama (local)

Uses the Ollama `/api/generate` endpoint. No API key needed.

```bash
# Start Ollama locally
ollama run qwen3.6-35b-a3b

# Then run ai-code-arc
ai-code-arc . --provider ollama --model qwen3.6-35b-a3b
```

## Scoring

Each file receives a score from 0–100:

| Deduction | Severity |
|---|---|
| -15 | Critical (security holes, data loss risks, unhandled async) |
| -5 | Warning (missing types, code smell, performance traps) |
| -1 | Info (style gaps, missing comments, dead code) |

Score labels:

| Range | Label |
|---|---|
| 90–100 | A+ Excellent |
| 75–89 | A Good |
| 50–74 | B Fair |
| 25–49 | C Needs Work |
| 0–24 | F Critical |

## Architecture

```
src/
├── index.ts          # CLI entry (Commander)
├── types.ts          # Type definitions
├── config.ts         # .coderc loader & thresholds
├── reviewer.ts       # Core review orchestrator
├── file-scanner.ts   # Glob file discovery
├── diff-reviewer.ts  # Diff computation + provider wrapper
├── cache.ts          # SHA256-based result cache
├── renderer.ts       # Output formatting
├── settings.ts       # ~/.ai-code-arc/settings.json
├── tui/
│   ├── index.tsx     # TUI runner
│   └── dashboard.tsx # Dashboard (Ink + React)
└── provider/
    ├── base.ts       # Provider interface + prompts
    ├── openai.ts     # OpenAI API integration
    └── ollama.ts     # Ollama API integration
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Type check
npx tsc --noEmit

# Dev mode (hot-reload)
npm run dev .
```

### Adding a new provider

1. Implement the `CodeReviewProvider` interface in `src/provider/base.ts`:

```typescript
export interface CodeReviewProvider {
  review(file: string, content: string, language: string): Promise<Issue[]>;
}
```

2. Create `src/provider/my-provider.ts`:

```typescript
import { CodeReviewProvider, REVIEW_PROMPT } from './base.js';
import { Issue } from '../types.js';

export class MyProvider implements CodeReviewProvider {
  constructor(private apiKey: string, private model: string) {}

  async review(file: string, content: string, language: string): Promise<Issue[]> {
    // Call your API, parse response, return Issue[]
  }
}
```

3. Add to `src/index.ts` in `createProvider()`:

```typescript
case 'myprovider':
  return new MyProvider(config.apiKey!, config.model);
```

### Adding custom rules

Custom rules are defined in `.coderc.json` (project-level) or `~/.ai-code-arc/settings.json` (global). They run as regex matches against file content before the AI review.

### Caching

Results are cached by SHA256 hash of file content in `.cache/`. Files with unchanged content skip the AI call entirely.

```bash
# Clear cache
ai-code-arc --clear-cache

# Disable cache for a single run
ai-code-arc . --no-cache
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Code Review
  run: |
    npm install -g ai-code-arc
    ai-code-arc src/ --json --ci \
      --provider openai \
      --base-url ${{ secrets.BASE_URL }} \
      --key ${{ secrets.API_KEY }}
  continue-on-error: true  # or remove to fail the build
```

### Exit Codes

| Code | Meaning | Use |
|---|---|---|
| 0 | All checks passed | Success |
| 1 | Critical issues found | Block merge |
| 2 | Warnings found | Notify |

## Environment Variables

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | OpenAI API key |
| `OPENAI_BASE_URL` | Custom OpenAI-compatible endpoint |
| `OLLAMA_BASE_URL` | Ollama API endpoint |

## Settings File

All settings live in `~/.ai-code-arc/settings.json`:

```json
{
  "provider": "openai",
  "model": "qwen3.6-35b-a3b",
  "apiKey": "sk-xxx",
  "baseUrl": "https://xxxxxx/v1",
  "maxFiles": 50,
  "ciMode": false,
  "thresholds": { "maxCritical": 0, "maxWarning": -1 },
  "ignorePaths": ["node_modules", "dist", "build", ".git"],
  "customRules": [],
  "customPrompt": "Review like a senior TypeScript engineer."
}
```

View current settings:

```bash
ai-code-arc --show-settings
```

## License

MIT
