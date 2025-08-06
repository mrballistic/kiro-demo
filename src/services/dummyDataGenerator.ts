import type { Developer, CodeMetric, SnapshotData, CommitData } from '../types/index.js';

/**
 * Generates dummy data for the code generation tracker application
 * Creates 5-8 developers with 3-6 months of varied metrics
 */
export class DummyDataGenerator {
  private readonly developerNames = [
    { name: 'Alice Johnson', email: 'alice.johnson@example.com' },
    { name: 'Bob Smith', email: 'bob.smith@example.com' },
    { name: 'Carol Davis', email: 'carol.davis@example.com' },
    { name: 'David Wilson', email: 'david.wilson@example.com' },
    { name: 'Eva Brown', email: 'eva.brown@example.com' },
    { name: 'Frank Miller', email: 'frank.miller@example.com' },
    { name: 'Grace Lee', email: 'grace.lee@example.com' },
    { name: 'Henry Taylor', email: 'henry.taylor@example.com' }
  ];

  private readonly repositories = [
    'frontend-app',
    'backend-api',
    'mobile-client',
    'data-pipeline',
    'analytics-service'
  ];

  /**
   * Generates a random number of developers between 5-8
   */
  generateDevelopers(): Developer[] {
    const numDevelopers = Math.floor(Math.random() * 4) + 5; // 5-8 developers
    const selectedDevelopers = this.shuffleArray([...this.developerNames])
      .slice(0, numDevelopers);

    return selectedDevelopers.map((dev, index) => ({
      id: `dev-${String(index + 1).padStart(3, '0')}`,
      name: dev.name,
      email: dev.email,
      metrics: []
    }));
  }

  /**
   * Generates metrics for a developer over 3-6 months
   */
  generateMetricsForDeveloper(developerId: string): CodeMetric[] {
    const metrics: CodeMetric[] = [];
    const monthsBack = Math.floor(Math.random() * 4) + 3; // 3-6 months
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - monthsBack);

    // Generate different activity patterns for variety
    const activityPattern = this.getRandomActivityPattern();

    let metricId = 1;
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      // Skip weekends for more realistic data
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        const shouldHaveActivity = this.shouldGenerateActivity(activityPattern, currentDate);

        if (shouldHaveActivity) {
          const numCommits = Math.floor(Math.random() * 3) + 1; // 1-3 commits per day

          for (let i = 0; i < numCommits; i++) {
            const metric = this.generateSingleMetric(
              `metric-${developerId}-${String(metricId).padStart(4, '0')}`,
              developerId,
              new Date(currentDate),
              activityPattern
            );
            metrics.push(metric);
            metricId++;
          }
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return metrics;
  }

  /**
   * Generates complete dummy data with developers and their metrics
   */
  generateCompleteDataset(): { developers: Developer[], allMetrics: CodeMetric[] } {
    const developers = this.generateDevelopers();
    const allMetrics: CodeMetric[] = [];

    developers.forEach(developer => {
      const metrics = this.generateMetricsForDeveloper(developer.id);
      developer.metrics = metrics;
      allMetrics.push(...metrics);
    });

    return { developers, allMetrics };
  }

  /**
   * Generates snapshot data that can be imported
   */
  generateSnapshotData(): SnapshotData {
    const repository = this.repositories[Math.floor(Math.random() * this.repositories.length)];
    const { developers, allMetrics } = this.generateCompleteDataset();

    const commits: CommitData[] = allMetrics.map(metric => ({
      hash: this.generateCommitHash(),
      author: developers.find(d => d.id === metric.developerId)?.name || 'Unknown',
      email: developers.find(d => d.id === metric.developerId)?.email || 'unknown@example.com',
      timestamp: metric.timestamp,
      linesAdded: metric.linesAdded,
      linesRemoved: metric.linesRemoved,
      filesModified: this.generateFileNames(metric.filesModified)
    }));

    return { repository, commits };
  }

  private generateSingleMetric(
    id: string,
    developerId: string,
    timestamp: Date,
    activityPattern: ActivityPattern
  ): CodeMetric {
    const baseActivity = activityPattern.baseActivity;
    const variance = activityPattern.variance;

    // Generate lines added with some randomness
    const linesAdded = Math.max(0, Math.floor(
      (Math.random() * baseActivity.maxLinesAdded * variance) + baseActivity.minLinesAdded
    ));

    // Generate lines removed (usually less than added)
    const linesRemoved = Math.max(0, Math.floor(
      Math.random() * Math.min(linesAdded * 0.3, baseActivity.maxLinesRemoved)
    ));

    // Generate files modified (related to lines changed)
    const totalLines = linesAdded + linesRemoved;
    const filesModified = Math.max(1, Math.floor(totalLines / 50) + Math.floor(Math.random() * 3));

    return {
      id,
      developerId,
      timestamp,
      linesAdded,
      linesRemoved,
      filesModified,
      commitHash: this.generateCommitHash(),
      repository: this.repositories[Math.floor(Math.random() * this.repositories.length)]
    };
  }

  private getRandomActivityPattern(): ActivityPattern {
    const patterns: ActivityPattern[] = [
      // High activity developer
      {
        name: 'high-activity',
        baseActivity: { minLinesAdded: 50, maxLinesAdded: 300, maxLinesRemoved: 100 },
        variance: 1.2,
        frequency: 0.8
      },
      // Moderate activity developer
      {
        name: 'moderate-activity',
        baseActivity: { minLinesAdded: 20, maxLinesAdded: 150, maxLinesRemoved: 50 },
        variance: 1.0,
        frequency: 0.6
      },
      // Low activity developer
      {
        name: 'low-activity',
        baseActivity: { minLinesAdded: 5, maxLinesAdded: 80, maxLinesRemoved: 30 },
        variance: 0.8,
        frequency: 0.4
      },
      // Sporadic developer
      {
        name: 'sporadic',
        baseActivity: { minLinesAdded: 10, maxLinesAdded: 200, maxLinesRemoved: 80 },
        variance: 1.5,
        frequency: 0.3
      }
    ];

    return patterns[Math.floor(Math.random() * patterns.length)];
  }

  private shouldGenerateActivity(pattern: ActivityPattern, date: Date): boolean {
    // Add some weekly patterns - less activity on Mondays and Fridays
    let dayMultiplier = 1.0;
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 1 || dayOfWeek === 5) { // Monday or Friday
      dayMultiplier = 0.7;
    }

    return Math.random() < (pattern.frequency * dayMultiplier);
  }

  private generateCommitHash(): string {
    const chars = '0123456789abcdef';
    let hash = '';
    for (let i = 0; i < 40; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  }

  private generateFileNames(count: number): string[] {
    const fileExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.cpp', '.h'];
    const fileBasenames = [
      'component', 'service', 'util', 'helper', 'model', 'controller',
      'view', 'test', 'spec', 'config', 'index', 'main', 'app'
    ];

    const files: string[] = [];
    for (let i = 0; i < count; i++) {
      const basename = fileBasenames[Math.floor(Math.random() * fileBasenames.length)];
      const extension = fileExtensions[Math.floor(Math.random() * fileExtensions.length)];
      const filename = `${basename}${Math.floor(Math.random() * 100)}${extension}`;
      files.push(filename);
    }

    return files;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

interface ActivityPattern {
  name: string;
  baseActivity: {
    minLinesAdded: number;
    maxLinesAdded: number;
    maxLinesRemoved: number;
  };
  variance: number; // Multiplier for randomness
  frequency: number; // Probability of activity on any given day
}

// Export a singleton instance for easy use
export const dummyDataGenerator = new DummyDataGenerator();