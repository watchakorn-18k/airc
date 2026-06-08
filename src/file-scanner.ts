import { glob } from 'glob';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

export interface ScannedFile {
  path: string;
  content: string;
  language: string;
}

const EXTENSION_MAP: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  py: 'python',
  go: 'go',
};

export function detectLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  return EXTENSION_MAP[ext] || ext;
}

export async function scanFiles(
  target: string,
  maxFiles: number
): Promise<ScannedFile[]> {
  const files = await glob('**/*.{ts,tsx,js,jsx,py,go}', {
    cwd: target,
    absolute: false,
    ignore: ['node_modules/**', 'dist/**', 'build/**', '.git/**', 'coverage/**'],
  });

  const scanned: ScannedFile[] = [];
  for (const file of files.slice(0, maxFiles)) {
    const fullPath = resolve(target, file);
    let content = '';
    try { content = readFileSync(fullPath, 'utf-8'); } catch {}
    if (content.length > 0) {
      scanned.push({
        path: file,
        content,
        language: detectLanguage(file),
      });
    }
  }

  return scanned;
}
