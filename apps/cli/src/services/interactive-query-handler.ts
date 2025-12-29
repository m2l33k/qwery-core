import type { Datasource } from '@qwery/domain/entities';
import type { CliContainer } from '../container/cli-container';
import type { RunCellResult } from './notebook-runner';
import { CliUsageError } from '../utils/errors';

export class InteractiveQueryHandler {
  constructor(private readonly container: CliContainer) {}

  public async execute(
    query: string,
    datasource: Datasource,
  ): Promise<RunCellResult> {
    const mode = this.detectMode(query);
    if (
      mode === 'natural' &&
      process.env.QWERY_ENABLE_NATURAL_LANGUAGE !== '1' &&
      process.env.QWERY_ENABLE_NATURAL_LANGUAGE !== 'true'
    ) {
      throw new CliUsageError('Natural language mode is not yet available');
    }
    const runner = this.container.getNotebookRunner();

    return await runner.runCell({
      datasource,
      query,
      mode,
    });
  }

  private detectMode(query: string): 'sql' | 'natural' {
    const trimmed = query.trim().toUpperCase();
    const sqlKeywords = [
      'SELECT',
      'INSERT',
      'UPDATE',
      'DELETE',
      'WITH',
      'CREATE',
      'DROP',
      'ALTER',
      'TRUNCATE',
      'EXPLAIN',
      'SHOW',
      'DESCRIBE',
      'DESC',
    ];

    // Check if query starts with SQL keyword
    for (const keyword of sqlKeywords) {
      if (trimmed.startsWith(keyword)) {
        return 'sql';
      }
    }

    // Default to natural language (may be disabled in CLI)
    return 'natural';
  }
}
