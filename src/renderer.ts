import chalk from 'chalk';
import { ReviewResult, Issue } from './types.js';

const SEVERITY_COLORS = {
  critical: chalk.red.bold,
  warning: chalk.yellow.bold,
  info: chalk.blue,
};

const SEVERITY_ICONS: Record<string, string> = {
  critical: '✕',
  warning: '!',
  info: 'i',
};

const SCORE_LABELS: Record<number, { label: string; color: (s: string) => string }> = {
  1: { label: 'A+ Excellent', color: chalk.green.bold },
  2: { label: 'A Good', color: chalk.green },
  3: { label: 'B Fair', color: chalk.yellow },
  4: { label: 'C Needs Work', color: chalk.rgb(255, 165, 0) },
  5: { label: 'F Critical', color: chalk.red.bold },
};

function getScoreLabel(score: number): { label: string; color: (s: string) => string } {
  const tier = score >= 90 ? 1 : score >= 75 ? 2 : score >= 50 ? 3 : score >= 25 ? 4 : 5;
  return SCORE_LABELS[tier];
}

function scoreBar(score: number): string {
  const filled = Math.round(score / 5);
  const empty = 20 - filled;
  const { color } = getScoreLabel(score);
  return color('█'.repeat(filled) + '░'.repeat(empty));
}

export function renderReview(result: ReviewResult): string {
  const lines: string[] = [];

  // Header
  lines.push('');
  lines.push(chalk.bold.underline(`File: ${result.file}`));
  lines.push(`Score: ${scoreBar(result.score)} ${result.score}/100`);
  lines.push('');

  // Summary
  if (result.summary) {
    lines.push(chalk.dim(`  ${result.summary}`));
    lines.push('');
  }

  // Issues
  if (result.issues.length === 0) {
    lines.push(chalk.green('  No issues found. Clean code.'));
    lines.push('');
    return lines.join('\n');
  }

  // Group by severity
  const critical = result.issues.filter((i: Issue) => i.severity === 'critical');
  const warnings = result.issues.filter((i: Issue) => i.severity === 'warning');
  const infos = result.issues.filter((i: Issue) => i.severity === 'info');

  let sectionNum = 0;

  if (critical.length > 0) {
    sectionNum++;
    lines.push(chalk.red.bold(`  [${critical.length}] Critical Issues`));
    lines.push('');
    for (const issue of critical) {
      lines.push(renderIssue(issue, SEVERITY_COLORS.critical));
    }
    lines.push('');
  }

  if (warnings.length > 0) {
    sectionNum++;
    lines.push(chalk.yellow.bold(`  [${warnings.length}] Warnings`));
    lines.push('');
    for (const issue of warnings) {
      lines.push(renderIssue(issue, SEVERITY_COLORS.warning));
    }
    lines.push('');
  }

  if (infos.length > 0) {
    sectionNum++;
    lines.push(chalk.blue.bold(`  [${infos.length}] Info`));
    lines.push('');
    for (const issue of infos) {
      lines.push(renderIssue(issue, SEVERITY_COLORS.info));
    }
    lines.push('');
  }

  return lines.join('\n');
}

function renderIssue(issue: Issue, colorFn: (s: string) => string): string {
  const lines: string[] = [];
  const icon = SEVERITY_ICONS[issue.severity] || 'i';
  const location = issue.line > 0 ? `:${issue.line}` : '';

  lines.push(`  ${colorFn(`${icon} ${issue.rule}${location}`)}  ${colorFn(issue.message)}`);

  if (issue.suggestion) {
    lines.push(`     → ${chalk.dim(issue.suggestion)}`);
  }

  return lines.join('\n');
}

export function renderProgress(file: string, total: number, current: number): void {
  const pct = Math.round((current / total) * 100);
  const bar = chalk.cyan('█'.repeat(Math.round(pct / 5))) + chalk.dim('░'.repeat(20 - Math.round(pct / 5)));
  process.stdout.write(`\r  ${bar} ${chalk.dim(`${current}/${total}`)} ${chalk.cyan(file)} `);
}

export function renderHeader(): void {
  console.log('');
  console.log(chalk.bold.cyan('  AI Code Reviewer'));
  console.log(chalk.dim('  Scanning and analyzing your code...'));
  console.log('');
}

export function renderFooter(totalFiles: number, totalTime: number): void {
  console.log('');
  console.log(chalk.dim(`  Reviewed ${totalFiles} file${totalFiles !== 1 ? 's' : ''} in ${totalTime.toFixed(1)}s`));
  console.log('');
}

export function renderJsonOutput(results: ReviewResult[]): string {
  return JSON.stringify(results, null, 2);
}

export function getExitCode(results: ReviewResult[], ciMode: boolean): number {
  if (!ciMode) return 0;

  const allCritical = results.some(r => r.issues.some(i => i.severity === 'critical'));
  if (allCritical) return 1;

  const allWarnings = results.some(r => r.issues.some(i => i.severity === 'warning'));
  if (allWarnings) return 2;

  return 0;
}
