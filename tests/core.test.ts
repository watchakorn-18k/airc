import { describe, it, expect } from 'vitest';
import { calculateScore, summarizeIssues } from '../src/provider/base';
import { computeDiff } from '../src/diff-reviewer';
import { loadCache, saveCache, clearCache } from '../src/cache';
import { renderReview, getExitCode, renderJsonOutput } from '../src/renderer';
import { loadCodeRc, checkThresholds } from '../src/config';
import { readFileSyncSafe } from '../src/types';
import { ReviewResult } from '../src/types';

describe('calculateScore', () => {
  it('returns 100 with no issues', () => {
    expect(calculateScore([])).toBe(100);
  });

  it('deducts 15 per critical', () => {
    expect(calculateScore([
      { line: 1, severity: 'critical', rule: 'xss', message: 'XSS', suggestion: 'fix' },
    ])).toBe(85);
  });

  it('deducts 5 per warning', () => {
    expect(calculateScore([
      { line: 1, severity: 'warning', rule: 'style', message: 'Style', suggestion: '' },
    ])).toBe(95);
  });

  it('deducts 1 per info', () => {
    expect(calculateScore([
      { line: 1, severity: 'info', rule: 'doc', message: 'Doc', suggestion: '' },
    ])).toBe(99);
  });

  it('clamps to 0 minimum', () => {
    const issues = Array.from({ length: 10 }, () =>
      ({ line: 1, severity: 'critical' as const, rule: 'x', message: 'x', suggestion: '' })
    );
    expect(calculateScore(issues)).toBe(0);
  });

  it('clamps to 100 maximum', () => {
    expect(calculateScore([])).toBe(100);
  });
});

describe('summarizeIssues', () => {
  it('returns "No issues found" for empty', () => {
    expect(summarizeIssues([])).toBe('No issues found');
  });

  it('counts by severity', () => {
    const issues = [
      { line: 1, severity: 'critical' as const, rule: 'x', message: 'x', suggestion: '' },
      { line: 2, severity: 'critical' as const, rule: 'y', message: 'y', suggestion: '' },
      { line: 3, severity: 'warning' as const, rule: 'z', message: 'z', suggestion: '' },
      { line: 4, severity: 'info' as const, rule: 'w', message: 'w', suggestion: '' },
    ];
    const summary = summarizeIssues(issues);
    expect(summary).toContain('2 critical');
    expect(summary).toContain('1 warning');
    expect(summary).toContain('1 info');
  });
});

describe('computeDiff', () => {
  it('detects added lines', () => {
    const hunks = computeDiff('', 'hello\nworld');
    expect(hunks.length).toBeGreaterThan(0);
    expect(hunks.some(h => h.type === 'added')).toBe(true);
  });

  it('detects removed lines', () => {
    const hunks = computeDiff('hello\nworld', '');
    expect(hunks.some(h => h.type === 'removed')).toBe(true);
  });

  it('returns empty for identical files', () => {
    const content = 'line1\nline2\nline3';
    const hunks = computeDiff(content, content);
    expect(hunks.length).toBe(0);
  });

  it('detects single line change', () => {
    const hunks = computeDiff('old\nline2', 'new\nline2');
    expect(hunks.length).toBeGreaterThan(0);
    expect(hunks.some(h => h.type === 'added')).toBe(true);
    expect(hunks.some(h => h.type === 'removed')).toBe(true);
  });
});

describe('cache', () => {
  it('saves and loads cache', () => {
    const content = 'test content';
    const result: ReviewResult = {
      file: 'test.ts',
      issues: [],
      score: 100,
      summary: 'Clean',
    };

    saveCache(content, result);
    const loaded = loadCache(content);

    expect(loaded).not.toBeNull();
    expect(loaded!.score).toBe(100);
    expect(loaded!.file).toBe('test.ts');

    clearCache();
  });

  it('returns null for changed content', () => {
    const result: ReviewResult = {
      file: 'test.ts',
      issues: [],
      score: 100,
      summary: 'Clean',
    };

    saveCache('original content', result);
    const loaded = loadCache('modified content');
    expect(loaded).toBeNull();

    clearCache();
  });

  it('returns null for non-existent cache', () => {
    const loaded = loadCache('nonexistent content');
    expect(loaded).toBeNull();

    clearCache();
  });
});

describe('renderer', () => {
  it('renders review output', () => {
    const result: ReviewResult = {
      file: 'test.ts',
      issues: [{ line: 10, severity: 'warning', rule: 'style', message: 'Bad style', suggestion: 'Fix it' }],
      score: 95,
      summary: '1 warning',
    };

    const output = renderReview(result);
    expect(output).toContain('test.ts');
    expect(output).toContain('95');
    expect(output).toContain('Bad style');
  });

  it('renders JSON output', () => {
    const result: ReviewResult = {
      file: 'test.ts',
      issues: [],
      score: 100,
      summary: 'Clean',
    };

    const json = renderJsonOutput([result]);
    const parsed = JSON.parse(json);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].score).toBe(100);
  });

  it('exit code 0 for clean code', () => {
    expect(getExitCode([{ file: 'a.ts', issues: [], score: 100, summary: '' }], true)).toBe(0);
  });

  it('exit code 1 for critical issues', () => {
    expect(getExitCode([{
      file: 'a.ts',
      issues: [{ line: 1, severity: 'critical' as const, rule: 'xss', message: 'x', suggestion: '' }],
      score: 0, summary: '',
    }], true)).toBe(1);
  });

  it('exit code 2 for warnings only', () => {
    expect(getExitCode([{
      file: 'a.ts',
      issues: [{ line: 1, severity: 'warning' as const, rule: 'style', message: 'x', suggestion: '' }],
      score: 95, summary: '',
    }], true)).toBe(2);
  });
});

describe('config', () => {
  it('checkThresholds passes with no issues', () => {
    expect(checkThresholds([], { maxCritical: 0, maxWarning: -1 })).toBe(true);
  });

  it('checkThresholds fails on critical when maxCritical is 0', () => {
    expect(checkThresholds([
      { line: 1, severity: 'critical' as const, rule: 'x', message: 'x', suggestion: '' },
    ], { maxCritical: 0, maxWarning: -1 })).toBe(false);
  });

  it('checkThresholds allows critical when maxCritical is 1', () => {
    expect(checkThresholds([
      { line: 1, severity: 'critical' as const, rule: 'x', message: 'x', suggestion: '' },
    ], { maxCritical: 1, maxWarning: -1 })).toBe(true);
  });

  it('checkThresholds respects warning limit', () => {
    expect(checkThresholds([
      { line: 1, severity: 'warning' as const, rule: 'x', message: 'x', suggestion: '' },
      { line: 2, severity: 'warning' as const, rule: 'y', message: 'y', suggestion: '' },
    ], { maxCritical: 0, maxWarning: 1 })).toBe(false);
  });
});
