# ACR — AI Code Reviewer

Terminal-based code reviewer powered by AI. Scan code, get structured feedback with severity levels and scores.

## Features

- **Multi-language**: TypeScript, JavaScript, Python, Go
- **AI Analysis**: security, quality, performance, best practices
- **TUI Dashboard**: Interactive terminal UI with score bars, cards, tables
- **Multiple Providers**: OpenAI, Ollama (local), any OpenAI-compatible API
- **Diff Review**: Compare before/after changes, focus on what matters
- **Result Caching**: SHA256-based cache, skip unchanged files
- **CI/CD Integration**: Exit codes, JSON output, severity thresholds
- **Config File**: `.coderc.json` for project-specific settings
- **Custom Rules**: Define your own linting rules

## Install

### macOS (Homebrew)

```bash
brew tap watchakorn-b/acr
brew install acr
```

### npm (any OS)

```bash
npm install -g acr
```

### From source

```bash
git clone https://github.com/watchakorn-b/acr.git
cd acr
npm install
npm run build
npm link
```

## Setup

```bash
npm install
npm run build
```

## Quick Start

```bash
# Review entire src/ directory
node dist/index.js src/ \
  --provider openai \
  --base-url https://gateway.9arm.co/v1 \
  --model qwen3.6-35b-a3b \
  -k YOUR_API_KEY

# Interactive TUI dashboard (beautiful!)
node dist/index.js src/ --tui \
  --provider openai \
  --base-url https://gateway.9arm.co/v1 \
  --model qwen3.6-35b-a3b \
  -k YOUR_API_KEY

# Single file
node dist/index.js src/index.ts \
  --provider openai \
  --base-url https://gateway.9arm.co/v1 \
  --model qwen3.6-35b-a3b \
  -k YOUR_API_KEY
```

## Usage

### TUI Mode (Interactive Dashboard)

Beautiful terminal UI with real-time results:

```bash
node dist/index.js src/ --tui \
  --provider openai \
  --base-url https://gateway.9arm.co/v1 \
  --model qwen3.6-35b-a3b \
  -k YOUR_API_KEY
```

Shows:
- Overall score with visual bar (████░░)
- Critical/Warning/Info cards with color coding
- File summary table
- Detailed issue list with severity icons (✕ ! i)
- Auto-exit after 8 seconds

### Diff Review

Compare two files and review only the changes:

```bash
node dist/index.js \
  --diff before.ts after.ts \
  --provider openai \
  --base-url https://gateway.9arm.co/v1 \
  --model qwen3.6-35b-a3b \
  -k YOUR_API_KEY
```

### CI/CD Mode

JSON output with exit codes for pipelines:

```bash
node dist/index.js src/ --json --ci \
  --provider openai \
  --base-url https://gateway.9arm.co/v1 \
  --model qwen3.6-35b-a3b \
  -k YOUR_API_KEY
```

Exit codes:
| Code | Meaning |
|---|---|
| 0 | All checks passed |
| 1 | Critical issues found |
| 2 | Warnings found |

### Ollama (Local Model)

Run with a local Ollama instance — no API key needed:

```bash
node dist/index.js src/ --provider ollama --model qwen3.6-35b-a3b
```

Defaults to `http://localhost:11434`.

## CLI Options

| Flag | Description | Default |
|---|---|---|
| `-p, --provider` | `openai` or `ollama` | `openai` |
| `-m, --model` | Model name | `gpt-4o-mini` |
| `-k, --key` | API key (overrides env) | — |
| `-n, --max-files` | Max files to scan | `50` |
| `--no-cache` | Disable caching | enabled |
| `--diff <a> <b>` | Review changes between files | — |
| `--json` | JSON output | — |
| `--ci` | CI mode (exit codes) | — |
| `--tui` | Interactive TUI dashboard | — |
| `--clear-cache` | Clear result cache | — |
| `--ignore <paths...>` | Paths to ignore | — |
| `--base-url` | Custom API endpoint | — |

## Environment Variables

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# OpenAI-compatible endpoints (e.g., 9arm gateway)
OPENAI_BASE_URL=https://gateway.9arm.co/v1

# Ollama (local)
OLLAMA_BASE_URL=http://localhost:11434
```

## Custom Gateway (9arm)

For `qwen3.6-35b-a3b` via 9arm gateway:

```bash
node dist/index.js src/ \
  --provider openai \
  --base-url https://gateway.9arm.co/v1 \
  --model qwen3.6-35b-a3b \
  -k YOUR_API_KEY
```

Any OpenAI-compatible endpoint works — just set `--base-url` and `--model`.

## Config File

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
      "pattern": "console\\.(log|debug)",
      "severity": "warning",
      "message": "Remove console statements before commit"
    }
  ]
}
```

### Thresholds

- `maxCritical`: Max allowed critical issues (0 = fail on any)
- `maxWarning`: Max allowed warnings (-1 = no limit)

### Custom Rules

Define your own rules with regex patterns:
- `name`: Rule identifier
- `pattern`: Regex to match against file content
- `severity`: `critical`, `warning`, or `info`
- `message`: Description shown in output

## Architecture

```
src/
├── index.ts          # CLI entry (Commander)
├── types.ts          # Type definitions
├── config.ts         # .coderc loader & threshold checks
├── reviewer.ts       # Core review orchestrator
├── file-scanner.ts   # Glob file discovery
├── diff-reviewer.ts  # Diff computation + provider wrapper
├── cache.ts          # SHA256-based result cache
├── renderer.ts       # CLI output formatting
├── tui/
│   ├── index.tsx     # TUI runner
│   └── dashboard.tsx # Interactive dashboard (Ink + React)
└── provider/
    ├── base.ts       # Provider interface + prompts
    ├── openai.ts     # OpenAI API integration
    └── ollama.ts     # Ollama API integration
```

## Development

```bash
# Build
npm run build

# Run tests
npm test

# Type check
npx tsc --noEmit
```

## Tech Stack

- **TypeScript** (ESM, NodeNext modules)
- **Ink** (React for CLI — TUI dashboard)
- **Commander** (CLI argument parsing)
- **Vitest** (testing)
- **OpenAI SDK** (OpenAI provider)
- **Fetch API** (Ollama provider)

## Example Output

```
  AI Code Reviewer
  Scanning and analyzing your code...

File: src/index.ts
Score: ███████████████░░░░░ 74/100

  1 critical, 2 warnings, 1 info

  [1] Critical Issues
  ✕ ai-parse-error  AI response could not be parsed: [...]
     → Use a logical OR before the cast...

  [2] Warnings
  ! unused-import:34  resolve is imported but not used
     → Remove unused import

  [3] Info
  i dead-code:12  Unreachable code block
```
