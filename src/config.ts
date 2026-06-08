import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Issue } from './types.js';

export interface SeverityThresholds {
  maxCritical: number;    // 0 = fail on any critical
  maxWarning: number;     // -1 = no limit
}

export interface CustomRule {
  name: string;
  pattern: string;          // regex
  severity: 'critical' | 'warning' | 'info';
  message: string;
}

export interface CodeRc {
  provider?: 'openai' | 'ollama';
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  maxFiles?: number;
  thresholds?: SeverityThresholds;
  ignorePaths?: string[];
  customRules?: CustomRule[];
  ciMode?: boolean;
  [key: string]: unknown;
}

const DEFAULT_THRESHOLDS: SeverityThresholds = {
  maxCritical: 0,
  maxWarning: -1,
};

export function loadCodeRc(dir: string): CodeRc | null {
  const paths = [
    resolve(dir, '.coderc.json'),
    resolve(dir, '.coderc'),
    resolve(process.cwd(), '.coderc.json'),
    resolve(process.cwd(), '.coderc'),
  ];

  for (const p of paths) {
    if (existsSync(p)) {
      try {
        const raw = readFileSync(p, 'utf-8');
        const config = JSON.parse(raw) as CodeRc;
        config.thresholds = { ...DEFAULT_THRESHOLDS, ...config.thresholds };
        return config;
      } catch {
        console.error(`  Warning: Failed to parse ${p}`);
        continue;
      }
    }
  }

  return null;
}

export function mergeConfig(cliConfig: CodeRc, rcConfig: CodeRc | null): CodeRc {
  if (!rcConfig) return cliConfig;

  return {
    provider: rcConfig.provider || cliConfig.provider,
    model: rcConfig.model || cliConfig.model,
    apiKey: rcConfig.apiKey || cliConfig.apiKey,
    baseUrl: rcConfig.baseUrl || cliConfig.baseUrl,
    maxFiles: rcConfig.maxFiles || cliConfig.maxFiles,
    thresholds: rcConfig.thresholds || cliConfig.thresholds,
    ignorePaths: rcConfig.ignorePaths || cliConfig.ignorePaths,
    customRules: rcConfig.customRules || cliConfig.customRules,
    ciMode: rcConfig.ciMode || cliConfig.ciMode,
  };
}

export function checkThresholds(issues: Issue[], thresholds: SeverityThresholds): boolean {
  const critical = issues.filter(i => i.severity === 'critical').length;
  const warnings = issues.filter(i => i.severity === 'warning').length;

  if (critical > thresholds.maxCritical) return false;
  if (thresholds.maxWarning >= 0 && warnings > thresholds.maxWarning) return false;

  return true;
}
