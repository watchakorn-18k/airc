import { ReviewConfig, ReviewResult, Issue } from './types.js';
import { scanFiles, ScannedFile } from './file-scanner.js';
import { CodeReviewProvider } from './provider/base.js';
import { calculateScore, summarizeIssues } from './provider/base.js';
import { loadCache, saveCache } from './cache.js';
import { readFileSyncSafe } from './types.js';

export class Reviewer {
  private provider: CodeReviewProvider;
  private useCache: boolean;

  constructor(provider: CodeReviewProvider, useCache = true) {
    this.provider = provider;
    this.useCache = useCache;
  }

  async review(target: string, config: ReviewConfig): Promise<ReviewResult[]> {
    const { stat } = await import('node:fs/promises');
    const { resolve } = await import('node:path');

    try {
      const statResult = await stat(resolve(target));

      // Single file — use reviewSingle
      if (statResult.isFile()) {
        const result = await this.reviewSingle(target, config);
        return [result];
      }
    } catch (err) {
      throw new Error(`Target not found: ${target} (${(err as Error).message})`);
    }

    const files = await scanFiles(target, config.maxFiles || 50);
    const results: ReviewResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check cache first
      if (this.useCache) {
        const cached = loadCache(file.content);
        if (cached) {
          results.push(cached);
          process.stdout.write(`\r  Cached ${i + 1}/${files.length}: ${file.path}`);
          continue;
        }
      }

      try {
        const issues = await this.provider.review(file.path, file.content, file.language);
        const score = calculateScore(issues);
        const summary = summarizeIssues(issues);
        const result: ReviewResult = { file: file.path, issues, score, summary };

        if (this.useCache) {
          saveCache(file.content, result);
        }

        results.push(result);
      } catch (err) {
        // Skip files that fail AI review, continue with others
        results.push({
          file: file.path,
          issues: [{ line: 0, severity: 'info', rule: 'provider-error', message: `Review failed: ${(err as Error).message}`, suggestion: undefined }],
          score: 0,
          summary: 'Review failed',
        });
      }

      process.stdout.write(`\r  Scanned ${i + 1}/${files.length}: ${file.path}`);
    }

    console.log('');
    return results;
  }

  async reviewSingle(filePath: string, config: ReviewConfig): Promise<ReviewResult> {
    const content = readFileSyncSafe(filePath);
    if (!content) {
      throw new Error(`File not found or empty: ${filePath}`);
    }

    const ext = filePath.split('.').pop() || '';
    const languageMap: Record<string, string> = {
      ts: 'typescript', tsx: 'typescript',
      js: 'javascript', jsx: 'javascript',
      py: 'python', go: 'go',
    };
    const language = languageMap[ext] || ext;

    const issues = await this.provider.review(filePath, content, language);
    const score = calculateScore(issues);
    const summary = summarizeIssues(issues);

    return { file: filePath, issues, score, summary };
  }
}
