/**
 * Shared tool type definitions using InferUITools
 * 
 * This file exports type-safe tool definitions that can be used
 * across the codebase for type checking and validation.
 */

import { InferUITools, InferUITool } from 'ai';
import { z } from 'zod';
import {
  ChartConfigSchema,
  ChartTypeSelectionSchema,
  type ChartType,
  type ChartTypeSelection,
  type ChartConfig,
} from '../types/chart.types';

// Re-export ChartType and related types for convenience
export type { ChartType, ChartTypeSelection, ChartConfig };

// Re-export schemas for convenience
export { ChartConfigSchema, ChartTypeSelectionSchema };

export const SQLQueryResultSchema = z.object({
  result: z.object({
    columns: z.array(z.string()),
    rows: z.array(z.record(z.unknown())),
  }),
  businessContext: z
    .object({
      domain: z.string(),
      entities: z.array(
        z.object({
          name: z.string(),
          columns: z.array(z.string()),
        }),
      ),
      relationships: z.array(
        z.object({
          from: z.string(),
          to: z.string(),
          join: z.string(),
        }),
      ),
      vocabulary: z.record(
        z.object({
          businessTerm: z.string(),
          technicalTerms: z.array(z.string()),
          synonyms: z.array(z.string()),
        }),
      ),
    })
    .nullable()
    .optional(),
});

export const SchemaDataSchema = z.object({
  databaseName: z.string(),
  schemaName: z.string(),
  tables: z.array(
    z.object({
      tableName: z.string(),
      columns: z.array(
        z.object({
          columnName: z.string(),
          columnType: z.string(),
        }),
      ),
    }),
  ),
});

export const ViewSheetDataSchema = z.object({
  sheetName: z.string(),
  totalRows: z.number(),
  displayedRows: z.number(),
  columns: z.array(z.string()),
  rows: z.array(z.record(z.unknown())),
  message: z.string(),
});

export const ListViewsDataSchema = z.object({
  views: z.array(
    z.object({
      viewName: z.string(),
      displayName: z.string().optional(),
      sharedLink: z.string().optional(),
      sourceId: z.string().optional(),
      createdAt: z.string().optional(),
      updatedAt: z.string().optional(),
      lastUsedAt: z.string().optional(),
    }),
  ),
  message: z.string(),
});

// ============================================================================
// Type Exports (TypeScript types inferred from schemas)
// ============================================================================

// ChartConfig and ChartTypeSelection are already exported above from chart.types.ts
export type SQLQueryResult = z.infer<typeof SQLQueryResultSchema>;
export type SchemaData = z.infer<typeof SchemaDataSchema>;
export type ViewSheetData = z.infer<typeof ViewSheetDataSchema>;
export type ListViewsData = z.infer<typeof ListViewsDataSchema>;

// ============================================================================
// Tool Type Inference Helpers
// ============================================================================

/**
 * Helper type to extract tool input/output types
 * Usage: type ToolTypes = InferToolTypes<typeof tools>
 */
export type InferToolTypes<T extends Record<string, any>> = {
  [K in keyof T]: InferUITool<T[K]>;
};

/**
 * Helper to safely parse tool output with schema validation
 */
export function parseToolOutput<T>(
  output: unknown,
  schema: z.ZodSchema<T>,
): T | null {
  if (!output) return null;

  let parsed: unknown = output;
  if (typeof output === 'string') {
    try {
      parsed = JSON.parse(output);
    } catch {
      return null;
    }
  }

  const result = schema.safeParse(parsed);
  return result.success ? result.data : null;
}

