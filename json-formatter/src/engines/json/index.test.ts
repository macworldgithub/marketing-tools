// GENERATED from _template — do not edit here
import { describe, it, expect } from 'vitest';
import { formatJSON, validateJSON, repairJSON, sortObjectKeys } from './index';

describe('JSON Formatter & Validator Engine', () => {
  // Vector: {"b":1,"a":[1,2,{"c":null}]} with indent 2 → standard pretty output, key order preserved
  it('formats valid JSON with indent 2 preserving key order', () => {
    const input = '{"b":1,"a":[1,2,{"c":null}]}';
    const output = formatJSON(input, { indent: '2' });
    const expected = '{\n  "b": 1,\n  "a": [\n    1,\n    2,\n    {\n      "c": null\n    }\n  ]\n}';
    expect(output).toBe(expected);
  });

  // Vector: Big integers and exact number text survive lossless parsing
  it('preserves big integers and exact decimals via lossless-json', () => {
    const input = '{"id": 12345678901234567890, "v": 1.0}';
    const output = formatJSON(input, { minify: true });
    expect(output).toContain('12345678901234567890');
  });

  // Vector: {"a":1,} → error at line 1, column 8
  it('pinpoints error location on trailing comma at line 1, column 8', () => {
    const input = '{"a":1,}';
    const result = validateJSON(input);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.line).toBe(1);
    expect(result.error?.column).toBe(8);
  });

  it('sorts keys recursively when sortKeys is true', () => {
    const input = '{"z": 1, "a": {"d": 4, "b": 2}}';
    const output = formatJSON(input, { sortKeys: true, minify: true });
    expect(output).toBe('{"a":{"b":2,"d":4},"z":1}');
  });

  it('minifies JSON properly', () => {
    const input = '{\n  "name": "Alice",\n  "age": 30\n}';
    const output = formatJSON(input, { minify: true });
    expect(output).toBe('{"name":"Alice","age":30}');
  });

  it('repairs malformed JSON with single quotes and trailing commas', () => {
    const broken = "{'name': 'Bob', 'tags': [1, 2, ],}";
    const repaired = repairJSON(broken);
    expect(repaired.hasChanges).toBe(true);
    expect(validateJSON(repaired.repairedText).valid).toBe(true);
    expect(formatJSON(repaired.repairedText, { minify: true })).toBe('{"name":"Bob","tags":[1,2]}');
  });
});
