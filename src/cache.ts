import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, readdirSync, unlinkSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ReviewResult } from './types.js';

const CACHE_DIR = join(process.cwd(), '.cache');

function hash(content: string): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

export function loadCache(content: string): ReviewResult | null {
  try {
    if (!content) return null;
    const h = hash(content);
    const p = join(CACHE_DIR, `${h}.json`);
    if (!existsSync(p)) return null;
    const raw = readFileSync(p, 'utf-8');
    const cached = JSON.parse(raw) as { hash: string; result: ReviewResult };
    return cached.hash === h ? cached.result : null;
  } catch {
    return null;
  }
}

export function saveCache(content: string, result: ReviewResult): void {
  try {
    if (!content) return;
    const h = hash(content);
    const p = join(CACHE_DIR, `${h}.json`);
    const data = JSON.stringify({ hash: h, result }, null, 2);
    if (!existsSync(CACHE_DIR)) {
      mkdirSync(CACHE_DIR, { recursive: true });
    }
    writeFileSync(p, data);
  } catch {
    // Cache failure is non-fatal
  }
}

export function clearCache(): void {
  try {
    if (existsSync(CACHE_DIR)) {
      const files = readdirSync(CACHE_DIR);
      for (const file of files) {
        unlinkSync(join(CACHE_DIR, file));
      }
    }
  } catch {
    // Non-fatal
  }
}
