import { Issue } from './types.js';
import { CodeReviewProvider, REVIEW_PROMPT } from './provider/base.js';

export interface DiffHunk {
  line: number;
  type: 'added' | 'removed';
  content: string;
}

export function computeDiff(before: string, after: string): DiffHunk[] {
  const beforeLines = before.split('\n');
  const afterLines = after.split('\n');
  const hunks: DiffHunk[] = [];

  let i = 0, j = 0;
  while (i < beforeLines.length || j < afterLines.length) {
    while (i < beforeLines.length && j < afterLines.length && beforeLines[i] === afterLines[j]) {
      i++;
      j++;
    }
    while (i < beforeLines.length && (j >= afterLines.length || beforeLines[i] !== afterLines[j])) {
      hunks.push({ line: i + 1, type: 'removed', content: beforeLines[i] });
      i++;
    }
    while (j < afterLines.length && (i >= beforeLines.length || beforeLines[i] !== afterLines[j])) {
      hunks.push({ line: j + 1, type: 'added', content: afterLines[j] });
      j++;
    }
  }

  return hunks;
}

export class DiffReviewProvider implements CodeReviewProvider {
  constructor(private delegate: CodeReviewProvider) {}

  async review(file: string, content: string, language: string): Promise<Issue[]> {
    const diffContext = (this.delegate as any)._diffContext;
    if (!diffContext) {
      return this.delegate.review(file, content, language);
    }

    const changed = diffContext.map((h: DiffHunk) =>
      `${h.type === 'added' ? '+' : '-'}${h.line}: ${h.content}`
    ).join('\n');

    const prompt = REVIEW_PROMPT([{ path: file, content, language }], 'diff');
    const response = await this.delegate.review(file, prompt + '\n\nChanged lines:\n' + changed, language);

    return response.filter((issue: Issue) => {
      const changedLines = new Set(diffContext.map((h: DiffHunk) => h.line));
      return issue.line === 0 || changedLines.has(issue.line);
    });
  }
}
