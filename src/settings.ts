import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

export interface Settings {
  provider: 'openai' | 'ollama';
  model: string;
  apiKey?: string;
  baseUrl?: string;
  maxFiles: number;
  ciMode: boolean;
  thresholds: { maxCritical: number; maxWarning: number };
  ignorePaths: string[];
  customRules: Array<{ name: string; pattern: string; severity: string; message: string }>;
  customPrompt?: string;
}

const PROJECT_NAME = 'ai-code-arc';
const SETTINGS_DIR = join(process.env.HOME || '', `.${PROJECT_NAME}`);
const SETTINGS_FILE = join(SETTINGS_DIR, 'settings.json');

const DEFAULT_SETTINGS: Settings = {
  provider: 'openai',
  model: 'qwen3.6-35b-a3b',
  maxFiles: 50,
  ciMode: false,
  thresholds: { maxCritical: 0, maxWarning: -1 },
  ignorePaths: ['node_modules', 'dist', 'build', '.git'],
  customRules: [],
  customPrompt: undefined,
};

export function loadSettings(): Settings {
  try {
    if (existsSync(SETTINGS_FILE)) {
      const raw = readFileSync(SETTINGS_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<Settings>;
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    console.error(`  Warning: Failed to load settings from ${SETTINGS_FILE}`);
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: Partial<Settings>): Settings {
  const current = loadSettings();
  const merged = { ...current, ...settings };
  try {
    if (!existsSync(SETTINGS_DIR)) {
      mkdirSync(SETTINGS_DIR, { recursive: true });
    }
    writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2), 'utf-8');
  } catch (err) {
    console.error(`  Error: Failed to save settings: ${(err as Error).message}`);
  }
  return merged;
}

export function showSettings(): void {
  const s = loadSettings();
  console.log('');
  console.log('  Settings:');
  console.log(`    provider:   ${s.provider}`);
  console.log(`    model:      ${s.model}`);
  console.log(`    apiKey:     ${s.apiKey ? '***' + s.apiKey.slice(-4) : '(not set)'}`);
  console.log(`    baseUrl:    ${s.baseUrl || '(not set)'}`);
  console.log(`    maxFiles:   ${s.maxFiles}`);
  console.log(`    ciMode:     ${s.ciMode}`);
  console.log(`    thresholds: ${JSON.stringify(s.thresholds)}`);
  console.log(`    ignorePaths: ${s.ignorePaths.join(', ') || '(none)'}`);
  if (s.customPrompt) {
    console.log(`    customPrompt: ${s.customPrompt.slice(0, 80)}...`);
  } else {
    console.log('    customPrompt: (not set)');
  }
  console.log('');
}
