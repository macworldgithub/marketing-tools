// GENERATED from _template — do not edit here
import { parse, stringify, isLosslessNumber } from 'lossless-json';
import { jsonrepair } from 'jsonrepair';

export type IndentOption = '2' | '4' | 'tab';

export interface JSONFormatOptions {
  indent?: IndentOption;
  sortKeys?: boolean;
  minify?: boolean;
}

export interface JSONParseError {
  message: string;
  line: number;
  column: number;
  position: number;
}

export interface JSONValidationResult {
  valid: boolean;
  error?: JSONParseError;
}

export interface JSONRepairResult {
  repairedText: string;
  hasChanges: boolean;
}

/**
 * Calculates 1-based line and column from a character index in a string
 */
export function getLineAndColumn(text: string, position: number): { line: number; column: number } {
  const safePos = Math.max(0, Math.min(position, text.length));
  let line = 1;
  let lastLineStart = 0;

  for (let i = 0; i < safePos; i++) {
    if (text[i] === '\n') {
      line++;
      lastLineStart = i + 1;
    }
  }

  const column = safePos - lastLineStart + 1;
  return { line, column };
}

/**
 * Extracts error location (1-based line and column) from an error thrown by JSON parser
 */
export function parseJsonError(rawError: unknown, text: string): JSONParseError {
  const message = rawError instanceof Error ? rawError.message : String(rawError);
  let position = -1;

  // Check for "at position X" in standard error message
  const posMatch = message.match(/at position (\d+)/i) || message.match(/position (\d+)/i);
  if (posMatch) {
    position = parseInt(posMatch[1], 10);
  }

  // Check for line and column in lossless-json or V8 error
  const lineColMatch = message.match(/line (\d+) column (\d+)/i);
  if (lineColMatch) {
    const line = parseInt(lineColMatch[1], 10);
    const column = parseInt(lineColMatch[2], 10);
    return { message, line, column, position: Math.max(0, position) };
  }

  if (position >= 0) {
    const { line, column } = getLineAndColumn(text, position);
    return { message, line, column, position };
  }

  // Fallback: search for first syntax error character using basic tokenizer
  return { message, line: 1, column: 1, position: 0 };
}

/**
 * Recursively sorts keys of an object/array while preserving lossless values
 */
export function sortObjectKeys(value: any): any {
  if (value === null || typeof value !== 'object' || isLosslessNumber(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(sortObjectKeys);
  }

  // Sort object keys alphabetically
  const keys = Object.keys(value).sort();
  const sortedObj: Record<string, any> = {};
  for (const key of keys) {
    sortedObj[key] = sortObjectKeys(value[key]);
  }
  return sortedObj;
}

/**
 * Validates a JSON string
 */
export function validateJSON(text: string): JSONValidationResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { valid: false, error: { message: 'Input is empty', line: 1, column: 1, position: 0 } };
  }

  try {
    parse(text);
    return { valid: true };
  } catch (err) {
    const error = parseJsonError(err, text);
    return { valid: false, error };
  }
}

/**
 * Formats or minifies a JSON string with lossless number support
 */
export function formatJSON(text: string, options: JSONFormatOptions = {}): string {
  let parsed = parse(text);

  if (options.sortKeys) {
    parsed = sortObjectKeys(parsed);
  }

  if (options.minify) {
    return stringify(parsed) || '';
  }

  let indentStr: string | number = 2;
  if (options.indent === '4') indentStr = 4;
  else if (options.indent === 'tab') indentStr = '\t';
  else indentStr = 2;

  return stringify(parsed, undefined, indentStr) || '';
}

/**
 * Repairs malformed JSON using jsonrepair
 */
export function repairJSON(text: string): JSONRepairResult {
  try {
    const repairedText = jsonrepair(text);
    return {
      repairedText,
      hasChanges: repairedText !== text,
    };
  } catch (err) {
    throw new Error(`Unable to repair JSON: ${err instanceof Error ? err.message : String(err)}`);
  }
}
