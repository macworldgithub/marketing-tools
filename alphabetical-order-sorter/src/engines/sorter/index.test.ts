// GENERATED from _template — do not edit here
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { sortList } from './index';

describe('Alphabetical Order Sorter Engine', () => {
  // Test Vector: banana, Apple, cherry, apple, 10, 2 → 2, 10, Apple, apple, banana, cherry
  it('correctly sorts specification test vector with natural numbers and case-insensitivity', () => {
    const input = 'banana, Apple, cherry, apple, 10, 2';
    const result = sortList(input, {
      delimiter: 'comma',
      numeric: true,
      caseInsensitive: true,
      order: 'asc',
      removeDuplicates: false,
    });

    expect(result.sorted).toEqual(['2', '10', 'Apple', 'apple', 'banana', 'cherry']);
  });

  it('removes duplicates (case-insensitively, keeping first occurrence)', () => {
    const input = 'Apple\nbanana\napple\nCherry\nBANANA';
    const result = sortList(input, {
      delimiter: 'newline',
      removeDuplicates: true,
      caseInsensitive: true,
    });

    expect(result.duplicatesRemoved).toBe(2);
    expect(result.sorted).toEqual(['Apple', 'banana', 'Cherry']);
  });

  it('sorts descending when requested', () => {
    const input = 'a\nb\nc';
    const result = sortList(input, { order: 'desc' });
    expect(result.sorted).toEqual(['c', 'b', 'a']);
  });

  it('sorts by last word', () => {
    const input = 'John Adams\nGeorge Washington\nThomas Jefferson';
    const result = sortList(input, { sortByLastWord: true });
    // Adams, Jefferson, Washington
    expect(result.sorted).toEqual(['John Adams', 'Thomas Jefferson', 'George Washington']);
  });

  // Property test: sorting is idempotent (sort(sort(x)) === sort(x))
  it('satisfies idempotency property test', () => {
    fc.assert(
      fc.property(fc.array(fc.string({ minLength: 1 })), (arr) => {
        const input = arr.join('\n');
        const firstPass = sortList(input, { removeEmpty: false, trim: false });
        const secondPass = sortList(firstPass.sorted.join('\n'), { removeEmpty: false, trim: false });
        return JSON.stringify(firstPass.sorted) === JSON.stringify(secondPass.sorted);
      })
    );
  });
});
