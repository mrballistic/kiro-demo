import React from 'react';
import type { MetricsSummary as MetricsSummaryType, CodeMetric } from '../types/index.js';
import { metricsCalculator } from '../services/metricsCalculator.js';
import styles from './MetricsSummary.module.css';

interface MetricsSummaryProps {
  metrics: CodeMetric[];
  className?: string;
}

const MetricsSummary: React.FC<MetricsSummaryProps> = ({ metrics, className }) => {
  const summary: MetricsSummaryType = metricsCalculator.calculateSummary(metrics);

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const formatRatio = (ratio: number): string => {
    return ratio.toFixed(2);
  };

  const formatDateRange = (start: Date, end: Date): string => {
    if (start.getTime() === end.getTime()) {
      return start.toLocaleDateString();
    }
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };

  return (
    <div className={`${styles.metricsSummary} ${className || ''}`}>
      <h3>Metrics Summary</h3>
      
      <div className={styles.summaryGrid}>
        <div className={styles.summaryItem}>
          <div className={styles.summaryLabel}>Total Lines Added</div>
          <div className={`${styles.summaryValue} ${styles.linesAdded}`}>
            {formatNumber(summary.totalLinesAdded)}
          </div>
        </div>

        <div className={styles.summaryItem}>
          <div className={styles.summaryLabel}>Total Lines Removed</div>
          <div className={`${styles.summaryValue} ${styles.linesRemoved}`}>
            {formatNumber(summary.totalLinesRemoved)}
          </div>
        </div>

        <div className={styles.summaryItem}>
          <div className={styles.summaryLabel}>Total Files Modified</div>
          <div className={`${styles.summaryValue} ${styles.filesModified}`}>
            {formatNumber(summary.totalFiles)}
          </div>
        </div>

        <div className={styles.summaryItem}>
          <div className={styles.summaryLabel}>Lines per File Ratio</div>
          <div className={`${styles.summaryValue} ${styles.linesPerFileRatio}`}>
            {formatRatio(summary.linesPerFileRatio)}
          </div>
        </div>

        <div className={styles.summaryItem}>
          <div className={styles.summaryLabel}>Net Lines Changed</div>
          <div className={`${styles.summaryValue} ${styles.netLines} ${summary.netLinesChanged >= 0 ? styles.positive : styles.negative}`}>
            {summary.netLinesChanged >= 0 ? '+' : ''}{formatNumber(summary.netLinesChanged)}
          </div>
        </div>

        <div className={`${styles.summaryItem} ${styles.timeRange}`}>
          <div className={styles.summaryLabel}>Time Period</div>
          <div className={styles.summaryValue}>
            {formatDateRange(summary.timeRange.start, summary.timeRange.end)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsSummary;