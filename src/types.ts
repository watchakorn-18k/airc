import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface ReviewResult {
  file: string;
  issues: Issue[];
  score: number; // 0-100
  summary: string;
}

export interface Issue {
  line: number;
  severity: 'critical' | 'warning' | 'info';
  rule: string;
  message: string;
  suggestion?: string;
}

export interface ReviewConfig {
  provider: 'openai' | 'ollama';
  model: string;
  apiKey?: string;
  baseUrl?: string;
  maxFiles?: number;
  ciMode?: boolean;
  thresholds?: { maxCritical: number; maxWarning: number };
  customRules?: Array<{ name: string; pattern: string; severity: string; message: string }>;
  ignorePaths?: string[];
}

export const DEFAULT_CONFIG: ReviewConfig = {
  provider: 'openai',
  model: 'qwen3.6-35b-a3b',
  maxFiles: 50,
};

export function loadConfig(): ReviewConfig {
  const provider = process.env.CODE_REVIEW_PROVIDER as 'openai' | 'ollama' || 'openai';
  const model = process.env.CODE_REVIEW_MODEL || 'qwen3.6-35b-a3b';
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

  return {
    provider,
    model,
    apiKey,
    baseUrl,
    maxFiles: DEFAULT_CONFIG.maxFiles,
  };
}

export function readFileSyncSafe(path: string): string {
  try {
    return readFileSync(resolve(path), 'utf-8');
  } catch {
    return '';
  }
}
