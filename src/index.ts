#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { ReviewConfig, Issue } from './types.js';
import { OpenAIPreviewProvider } from './provider/openai.js';
import { OllamaProvider } from './provider/ollama.js';
import { Reviewer } from './reviewer.js';
import { clearCache } from './cache.js';
import { loadCodeRc, checkThresholds } from './config.js';
import { loadSettings, saveSettings, showSettings } from './settings.js';
import { renderHeader, renderFooter, renderReview, renderJsonOutput, getExitCode } from './renderer.js';

const program = new Command();

program
  .name('airc')
  .description('AI-powered terminal code reviewer with severity scoring, TUI dashboard, and CI/CD integration')
  .version('1.0.0')
  .argument('[target]', 'file or directory to review', '.')
  .option('-p, --provider <type>', 'AI provider: openai or ollama', 'openai')
  .option('-m, --model <model>', 'Model name', 'qwen3.6-35b-a3b')
  .option('-k, --key <key>', 'API key (overrides env var)')
  .option('-n, --max-files <number>', 'Max files to scan', '50')
  .option('--no-cache', 'Disable result caching')
  .option('--diff <before> <after>', 'Review changes between two files')
  .option('--json', 'Output results as JSON (CI mode)')
  .option('--ci', 'Enable CI mode (exit codes, no color)')
  .option('--clear-cache', 'Clear the result cache')
  .option('--ignore <paths...>', 'Ignore paths')
  .option('--base-url <url>', 'API base URL (overrides env var)')
  .option('--custom-prompt <prompt>', 'Custom system prompt for this review (overrides settings)')
  .option('--tui', 'Enable TUI mode (interactive dashboard)')
  .option('--set-provider <type>', 'Save default provider (openai/ollama)')
  .option('--set-model <model>', 'Save default model')
  .option('--set-api-key <key>', 'Save API key')
  .option('--set-base-url <url>', 'Save base URL')
  .option('--set-max-files <n>', 'Save max files to scan')
  .option('--set-custom-prompt <prompt>', 'Save custom system prompt')
  .option('--show-settings', 'Show current settings')
  .action(async (target: string, options: { provider: string; model: string; key?: string; maxFiles: string; cache: boolean; diff?: string[]; json: boolean; ci: boolean; clearCache: boolean; ignore?: string[]; baseUrl?: string; customPrompt?: string; tui: boolean; setProvider?: string; setModel?: string; setApiKey?: string; setBaseUrl?: string; setMaxFiles?: string; setCustomPrompt?: string; showSettings: boolean }) => {
    // Handle settings commands first
    if (options.showSettings) {
      showSettings();
      process.exit(0);
    }

    // Collect all --set-* flags into one save
    const settingsPatch: Record<string, unknown> = {};
    if (options.setProvider) settingsPatch.provider = options.setProvider as 'openai' | 'ollama';
    if (options.setModel) settingsPatch.model = options.setModel;
    if (options.setApiKey) settingsPatch.apiKey = options.setApiKey;
    if (options.setBaseUrl) settingsPatch.baseUrl = options.setBaseUrl;
    if (options.setMaxFiles) settingsPatch.maxFiles = parseInt(options.setMaxFiles, 10);
    if (options.setCustomPrompt) settingsPatch.customPrompt = options.setCustomPrompt;

    if (Object.keys(settingsPatch).length > 0) {
      saveSettings(settingsPatch);
      const keys = Object.keys(settingsPatch).map(k => k.replace('set', '').replace(/[A-Z]/, m => m.toLowerCase())).join(', ');
      console.log(chalk.green(`  Settings saved: ${keys}.`));
      if (options.setCustomPrompt) {
        console.log(chalk.dim(`  Prompt: ${options.setCustomPrompt.slice(0, 80)}${options.setCustomPrompt.length > 80 ? '...' : ''}`));
      }
      process.exit(0);
    }

    if (options.clearCache) {
      try { clearCache(); } catch {}
      console.log(chalk.green('  Cache cleared.'));
      process.exit(0);
      return;
    }

    const ciMode = options.ci || options.json;
    const rcConfig = loadCodeRc(target);
    const settings = loadSettings();

    // Priority: CLI > env > settings > rcConfig > defaults
    const config: ReviewConfig = {
      provider: (options.provider as 'openai' | 'ollama') || settings.provider || (rcConfig?.provider || 'openai') as 'openai' | 'ollama',
      model: options.model || settings.model || rcConfig?.model || 'qwen3.6-35b-a3b',
      apiKey: options.key || settings.apiKey || rcConfig?.apiKey || process.env.OPENAI_API_KEY,
      baseUrl: options.baseUrl || settings.baseUrl || rcConfig?.baseUrl || process.env.OPENAI_BASE_URL || process.env.OLLAMA_BASE_URL,
      maxFiles: rcConfig?.maxFiles || parseInt(options.maxFiles, 10) || settings.maxFiles || 50,
      ciMode: ciMode || rcConfig?.ciMode || settings.ciMode,
      thresholds: rcConfig?.thresholds || settings.thresholds,
      customRules: rcConfig?.customRules || settings.customRules,
      ignorePaths: options.ignore || rcConfig?.ignorePaths || settings.ignorePaths,
      customPrompt: options.customPrompt || settings.customPrompt,
    };

    if (!config.apiKey && config.provider === 'openai') {
      console.error(chalk.red('  Error: OPENAI_API_KEY not set. Use -k or set the env var.'));
      process.exit(1);
    }

    const providerCtx = createProviderWithDiffContext(config);
    const reviewer = new Reviewer(providerCtx.provider, options.cache !== false);

    const startTime = Date.now();

    try {
      let results;

      if (options.diff && options.diff.length >= 2) {
        results = await reviewDiff(options.diff[0], options.diff[1], providerCtx, config);
        const elapsed = (Date.now() - startTime) / 1000;
        if (options.json || ciMode) {
          console.log(renderJsonOutput(results));
        } else {
          renderHeader();
          for (const result of results) {
            console.log(renderReview(result));
          }
          renderFooter(results.length, elapsed);
        }
        process.exit(getExitCode(results, config.ciMode || false));
      } else {
        results = await reviewer.review(target, config);
      }

      const elapsed = (Date.now() - startTime) / 1000;

      if (options.tui) {
        const { runTUI } = await import('./tui/index.js');
        const tui = runTUI(
          Promise.resolve(results),
          results.length,
          elapsed
        );
        if (config.ciMode && config.thresholds) {
          const allPass = results.every(r => checkThresholds(r.issues, config.thresholds!));
          if (!allPass) {
            process.exit(getExitCode(results, true));
          }
        }
        process.exit(getExitCode(results, config.ciMode || false));
      } else if (options.json || ciMode) {
        console.log(renderJsonOutput(results));
      } else {
        renderHeader();
        for (const result of results) {
          console.log(renderReview(result));
        }
        renderFooter(results.length, elapsed);
      }

      if (config.ciMode && config.thresholds) {
        const allPass = results.every(r => checkThresholds(r.issues, config.thresholds!));
        if (!allPass) {
          console.error(chalk.red('\n  Review failed: thresholds exceeded'));
          process.exit(getExitCode(results, true));
        }
      }

      process.exit(getExitCode(results, config.ciMode || false));
    } catch (err) {
      console.error(chalk.red(`  Error: ${(err as Error).message}`));
      process.exit(1);
    }
  });

function createProvider(config: ReviewConfig) {
  switch (config.provider) {
    case 'ollama':
      return new OllamaProvider(config.baseUrl || 'http://localhost:11434', config.model, config.customPrompt);
    case 'openai':
    default:
      if (!config.apiKey) {
        throw new Error('OpenAI API key required. Set OPENAI_API_KEY or use --provider ollama');
      }
      return new OpenAIPreviewProvider(
        config.apiKey,
        config.model,
        config.baseUrl,
        config.customPrompt
      );
  }
}

function createProviderWithDiffContext(config: ReviewConfig): { provider: any; withDiffContext: (hunks: any[]) => void } {
  const provider = createProvider(config);
  return {
    provider,
    withDiffContext: (hunks: any[]) => {
      (provider as any)._diffContext = hunks;
    },
  };
}

async function reviewDiff(beforePath: string, afterPath: string, ctx: { provider: any; withDiffContext: (hunks: any[]) => void }, config: ReviewConfig) {
  const { readFileSyncSafe } = await import('./types.js');
  const { computeDiff } = await import('./diff-reviewer.js');
  const { calculateScore, summarizeIssues } = await import('./provider/base.js');

  const before = readFileSyncSafe(beforePath);
  const after = readFileSyncSafe(afterPath);

  if (!before || !after) {
    throw new Error('Both before and after files must exist and be non-empty');
  }

  const hunks = computeDiff(before, after);
  if (hunks.length === 0) {
    return [{
      file: `${beforePath} → ${afterPath}`,
      issues: [],
      score: 100,
      summary: 'No changes detected',
    }];
  }

  ctx.withDiffContext(hunks);
  const issues = await ctx.provider.review(afterPath, after, 'mixed');

  return [{
    file: `${beforePath} → ${afterPath}`,
    issues,
    score: calculateScore(issues),
    summary: summarizeIssues(issues),
  }];
}

program.parse();
