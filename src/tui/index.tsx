import React from 'react';
import { render } from 'ink';
import ReviewDashboard from './dashboard.js';
import { ReviewResult } from '../types.js';

export function runTUI(
  resultsPromise: Promise<ReviewResult[]>,
  totalFiles: number,
  startTime: number
) {
  return render(
    <ReviewDashboard
      results={null}
      loading={true}
      error={null}
      totalFiles={totalFiles}
      totalTime={0}
    />,
    {
      exitOnCtrlC: true,
    }
  );
}
