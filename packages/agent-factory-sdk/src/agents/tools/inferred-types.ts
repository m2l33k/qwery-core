/**
 * Inferred tool types using InferUITools
 * 
 * This file provides type-safe access to tool input/output types
 * based on the actual tool definitions in read-data-agent.actor.ts
 * 
 * Note: These types are manually maintained to match the tool definitions.
 * In the future, we can extract tools to a separate file to enable automatic inference.
 */

import type { InferUITool } from 'ai';
import type { tool } from 'ai';
import { z } from 'zod';
import type {
  ChartConfig,
  ChartTypeSelection,
  SQLQueryResult,
  SchemaData,
  ViewSheetData,
  ListViewsData,
} from './types';
import { ChartTypeSchema, type ChartType } from '../types/chart.types';

// ============================================================================
// Tool Type Definitions
// ============================================================================

// These types represent the structure of tools as defined in read-data-agent.actor.ts
// We use type-only imports and manual type definitions since tools are created
// inside a function with runtime dependencies.

type TestConnectionTool = ReturnType<
  typeof tool<{
    description: string;
    inputSchema: z.ZodObject<{}>;
    execute: () => Promise<string>;
  }>
>;

type CreateDbViewFromSheetTool = ReturnType<
  typeof tool<{
    description: string;
    inputSchema: z.ZodObject<{
      sharedLink: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString>]>;
      sheetName: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString>]>>;
    }>;
    execute: (input: {
      sharedLink: string | string[];
      sheetName?: string | string[];
    }) => Promise<{
      success: boolean;
      viewName?: string;
      displayName?: string;
      error?: string;
      link: string;
    }[]>;
  }>
>;

type ListViewsTool = ReturnType<
  typeof tool<{
    description: string;
    inputSchema: z.ZodObject<{
      forceRefresh: z.ZodOptional<z.ZodBoolean>;
    }>;
    execute: (input: { forceRefresh?: boolean }) => Promise<ListViewsData>;
  }>
>;

type ViewSheetTool = ReturnType<
  typeof tool<{
    description: string;
    inputSchema: z.ZodObject<{
      sheetName: z.ZodString;
      limit: z.ZodOptional<z.ZodNumber>;
    }>;
    execute: (input: { sheetName: string; limit?: number }) => Promise<ViewSheetData>;
  }>
>;

type GetSchemaTool = ReturnType<
  typeof tool<{
    description: string;
    inputSchema: z.ZodObject<{
      viewName: z.ZodOptional<z.ZodString>;
    }>;
    execute: (input: { viewName?: string }) => Promise<{
      schema: SchemaData;
      businessContext: {
        domain: string;
        entities: Array<{ name: string; columns: string[]; views?: string[] }>;
        relationships: Array<{
          fromView: string;
          toView: string;
          fromColumn: string;
          toColumn: string;
          type: string;
          join: string;
        }>;
        vocabulary: Record<
          string,
          {
            businessTerm: string;
            technicalTerms: string[];
            synonyms: string[];
          }
        >;
      };
    }>;
  }>
>;

type RunQueryTool = ReturnType<
  typeof tool<{
    description: string;
    inputSchema: z.ZodObject<{
      query: z.ZodString;
    }>;
    execute: (input: { query: string }) => Promise<SQLQueryResult>;
  }>
>;

type SelectChartTypeTool = ReturnType<
  typeof tool<{
    description: string;
    inputSchema: z.ZodObject<{
      queryResults: z.ZodObject<{
        rows: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodUnknown>>>;
        columns: z.ZodOptional<z.ZodArray<z.ZodString>>;
        sqlQuery: z.ZodOptional<z.ZodString>;
        userInput: z.ZodOptional<z.ZodString>;
      }>;
      sqlQuery: z.ZodOptional<z.ZodString>;
      userInput: z.ZodOptional<z.ZodString>;
    }>;
    execute: (input: {
      queryResults?: {
        rows?: Record<string, unknown>[];
        columns?: string[];
        sqlQuery?: string;
        userInput?: string;
      };
      sqlQuery?: string;
      userInput?: string;
    }) => Promise<ChartTypeSelection>;
  }>
>;

type GenerateChartTool = ReturnType<
  typeof tool<{
    description: string;
    inputSchema: z.ZodObject<{
      chartType: typeof ChartTypeSchema;
      queryResults: z.ZodObject<{
        rows: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodUnknown>>>;
        columns: z.ZodOptional<z.ZodArray<z.ZodString>>;
        sqlQuery: z.ZodOptional<z.ZodString>;
        userInput: z.ZodOptional<z.ZodString>;
      }>;
      sqlQuery: z.ZodOptional<z.ZodString>;
      userInput: z.ZodOptional<z.ZodString>;
    }>;
    execute: (input: {
      chartType: ChartType;
      queryResults?: {
        rows?: Record<string, unknown>[];
        columns?: string[];
        sqlQuery?: string;
        userInput?: string;
      };
      sqlQuery?: string;
      userInput?: string;
    }) => Promise<ChartConfig>;
  }>
>;

// ============================================================================
// Tool Set Type (represents all tools)
// ============================================================================

export type ReadDataAgentTools = {
  testConnection: TestConnectionTool;
  createDbViewFromSheet: CreateDbViewFromSheetTool;
  listViews: ListViewsTool;
  renameSheet: unknown; // Simplified for now
  deleteSheet: unknown; // Simplified for now
  viewSheet: ViewSheetTool;
  getSchema: GetSchemaTool;
  runQuery: RunQueryTool;
  selectChartType: SelectChartTypeTool;
  generateChart: GenerateChartTool;
};

// ============================================================================
// Inferred Tool Types
// ============================================================================

export type ReadDataAgentToolTypes = {
  [K in keyof ReadDataAgentTools]: InferUITool<ReadDataAgentTools[K]>;
};

// Individual tool type exports for convenience
export type TestConnectionToolType = InferUITool<TestConnectionTool>;
export type CreateDbViewFromSheetToolType = InferUITool<CreateDbViewFromSheetTool>;
export type ListViewsToolType = InferUITool<ListViewsTool>;
export type ViewSheetToolType = InferUITool<ViewSheetTool>;
export type GetSchemaToolType = InferUITool<GetSchemaTool>;
export type RunQueryToolType = InferUITool<RunQueryTool>;
export type SelectChartTypeToolType = InferUITool<SelectChartTypeTool>;
export type GenerateChartToolType = InferUITool<GenerateChartTool>;

// ============================================================================
// Tool Name Type
// ============================================================================

export type ToolName = keyof ReadDataAgentTools;

// ============================================================================
// Helper: Get tool input/output types by name
// ============================================================================

export type ToolInput<T extends ToolName> = ReadDataAgentToolTypes[T]['input'];
export type ToolOutput<T extends ToolName> = ReadDataAgentToolTypes[T]['output'];

