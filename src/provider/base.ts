import { Issue } from '../types.js';

export interface CodeReviewProvider {
  review(file: string, content: string, language: string): Promise<Issue[]>;
}

export const REVIEW_PROMPT = (files: { path: string; content: string; language?: string }[], context?: 'full' | 'diff'): string => {
  const fileSection = files.map(f => {
    const lang = f.language || 'unknown';
    return `--- FILE: ${f.path} (${lang}) ---\n${f.content}`;
  }).join('\n\n');

  return `You are a senior code reviewer. Analyze the code below and return a JSON array of issues.

${context === 'diff' ? 'Review ONLY the changed/added lines. Ignore unchanged code.' : 'Review the full codebase.'}

${fileSection}

Severity rules:
- critical: security holes (injection, XSS, exposed secrets, eval), unhandled async errors, data loss risks
- warning: missing types (any, unknown return), code smell (deep nesting, long functions), performance traps (O(n²), N+1)
- info: style gaps, missing comments, dead code, edge case gaps

Output rules:
- Return ONLY a JSON array. No markdown fences. No explanation text.
- Each issue must have: line (number), severity, rule (slug), message (specific, references code), suggestion (fix or null)
- Be specific. Reference exact code. No generic advice like "add error handling" — say WHERE and HOW.
- If no issues, return []`;
};

export function calculateScore(issues: Issue[]): number {
  let score = 100;
  for (const issue of issues) {
    switch (issue.severity) {
      case 'critical':
        score -= 15;
        break;
      case 'warning':
        score -= 5;
        break;
      case 'info':
        score -= 1;
        break;
    }
  }
  return Math.max(0, Math.min(100, score));
}

export function summarizeIssues(issues: Issue[]): string {
  let critical = 0, warnings = 0, infos = 0;
  for (const issue of issues) {
    if (issue.severity === 'critical') critical++;
    else if (issue.severity === 'warning') warnings++;
    else infos++;
  }

  const parts: string[] = [];
  if (critical > 0) parts.push(`${critical} critical`);
  if (warnings > 0) parts.push(`${warnings} warnings`);
  if (infos > 0) parts.push(`${infos} info`);

  return parts.join(', ') || 'No issues found';
}
