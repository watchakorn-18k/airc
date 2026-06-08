import React from 'react';
import { Box, Text, Spacer, useApp } from 'ink';
import Table from 'ink-table';
import Gradient from 'ink-gradient';
import Divider from 'ink-divider';
import Spinner from 'ink-spinner';
import { ReviewResult } from '../types.js';

// Type casts for Ink 7 / React JSX compatibility
const InkSpinner = Spinner as unknown as React.FC<{ type: string }>;
const InkTable = Table as unknown as React.FC<any>;

interface ReviewDashboardProps {
  results: ReviewResult[] | null;
  loading: boolean;
  error: string | null;
  totalFiles: number;
  totalTime: number;
}

function ScoreBar(score: number): string {
  const filled = Math.round(score / 5);
  const empty = 20 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

export default function ReviewDashboard({ results, loading, error, totalFiles, totalTime }: ReviewDashboardProps) {
  const { exit } = useApp();

  React.useEffect(() => {
    if (results !== null || error) {
      const timer = setTimeout(() => {
        if (error) process.exit(1);
        exit();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [results, error, exit]);

  if (loading) {
    return (
      <Box flexDirection="column" padding={2} alignItems="center">
        <InkSpinner type="dots" />
        <Text>
          <Gradient name="rainbow">AI Code Reviewer</Gradient>
        </Text>
        <Text dimColor>Scanning & analyzing code...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" padding={2}>
        <Box borderStyle="single" borderColor="red" padding={1}>
          <Text color="red">{error}</Text>
        </Box>
      </Box>
    );
  }

  if (!results || results.length === 0) {
    return (
      <Box flexDirection="column" padding={2} alignItems="center">
        <Text>
          <Gradient name="rainbow">AI Code Reviewer</Gradient>
        </Text>
        <Text dimColor>No files to review</Text>
      </Box>
    );
  }

  const totalIssues = results.reduce((s, r) => s + r.issues.length, 0);
  const totalCritical = results.reduce((s, r) => s + r.issues.filter(i => i.severity === 'critical').length, 0);
  const totalWarnings = results.reduce((s, r) => s + r.issues.filter(i => i.severity === 'warning').length, 0);
  const totalInfo = results.reduce((s, r) => s + r.issues.filter(i => i.severity === 'info').length, 0);
  const avgScore = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);

  const scoreColor = avgScore >= 75 ? 'green' : avgScore >= 50 ? 'yellow' : 'red';

  return (
    <Box flexDirection="column" padding={2}>
      {/* Header */}
      <Box flexDirection="column" alignItems="center">
        <Text>
          <Gradient name="rainbow">AI Code Reviewer</Gradient>
        </Text>
        <Text dimColor>{totalFiles} files reviewed in {totalTime.toFixed(1)}s</Text>
      </Box>

      <Divider dividerColor="cyan" />

      {/* Score Overview */}
      <Box flexDirection="column" marginTop={1}>
        <Box flexDirection="column" padding={1} borderStyle="single" borderColor="cyan">
          <Text dimColor>OVERALL SCORE</Text>
          <Text bold color={scoreColor}>{avgScore}/100</Text>
          <Text dimColor>{ScoreBar(avgScore)}</Text>
        </Box>

        <Box flexDirection="row" marginTop={1} gap={1}>
          <Box flexDirection="column" padding={1} borderStyle="single" borderColor="gray">
            <Text dimColor>ISSUES</Text>
            <Text bold>{totalIssues}</Text>
          </Box>

          {totalCritical > 0 && (
            <Box flexDirection="column" padding={1} borderStyle="single" borderColor="red">
              <Text color="red">✕ Critical</Text>
              <Text bold color="red">{totalCritical}</Text>
            </Box>
          )}

          {totalWarnings > 0 && (
            <Box flexDirection="column" padding={1} borderStyle="single" borderColor="yellow">
              <Text color="yellow">! Warnings</Text>
              <Text bold color="yellow">{totalWarnings}</Text>
            </Box>
          )}

          {totalInfo > 0 && (
            <Box flexDirection="column" padding={1} borderStyle="single" borderColor="blue">
              <Text color="blue">i Info</Text>
              <Text bold color="blue">{totalInfo}</Text>
            </Box>
          )}
        </Box>
      </Box>

      <Divider dividerColor="gray" />

      {/* File Summary Table */}
      <Box flexDirection="column" marginTop={1}>
        <Text bold>File Summary</Text>
        <InkTable
          data={results.map(r => ({
            file: r.file,
            score: `${r.score}/100`,
            issues: `${r.issues.length}`,
          }))}
          columns={['file', 'score', 'issues']}
        />
      </Box>

      <Divider dividerColor="gray" />

      {/* Detailed Issues */}
      {results.some(r => r.issues.length > 0) && (
        <Box flexDirection="column" marginTop={1}>
          <Text bold>Detailed Issues</Text>
          {results.map(result => (
            <Box key={result.file} flexDirection="column" marginTop={1}>
              <Box flexDirection="row">
                <Text bold color="cyan">{result.file}</Text>
                <Spacer />
                <Text color={result.score >= 75 ? 'green' : result.score >= 50 ? 'yellow' : 'red'}>
                  {result.score}/100
                </Text>
              </Box>
              {result.issues.map((issue, i) => (
                <Box key={i} flexDirection="column" paddingLeft={2}>
                  <Text>
                    <Text color={issue.severity === 'critical' ? 'red' : issue.severity === 'warning' ? 'yellow' : 'blue'}>
                      {issue.severity === 'critical' ? '✕' : issue.severity === 'warning' ? '!' : 'i'}
                    </Text>{' '}
                    <Text bold>{issue.rule}{issue.line > 0 ? `:${issue.line}` : ''}</Text>
                    {' '}{issue.message}
                  </Text>
                  {issue.suggestion && (
                    <Text dimColor>    ↳ {issue.suggestion}</Text>
                  )}
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      )}

      <Divider dividerColor="gray" />
      <Text dimColor>Auto-exit in 8s. Press Ctrl+C to exit.</Text>
    </Box>
  );
}
