// GENERATED from _template — do not edit here
/**
 * Alphabetical & Natural Order Sorter Engine
 */

export interface SortOptions {
  delimiter?: 'newline' | 'comma' | 'semicolon' | 'space' | 'tab' | 'custom';
  customDelimiter?: string;
  order?: 'asc' | 'desc';
  caseInsensitive?: boolean;
  numeric?: boolean;
  trim?: boolean;
  removeEmpty?: boolean;
  removeDuplicates?: boolean;
  sortByLastWord?: boolean;
  reverse?: boolean;
}

export interface SortResult {
  sorted: string[];
  totalItems: number;
  duplicatesRemoved: number;
  output: string;
}

/**
 * Splits raw input string by the specified delimiter
 */
export function splitItems(input: string, options: SortOptions): string[] {
  let delim = '\n';
  switch (options.delimiter) {
    case 'comma':
      delim = ',';
      break;
    case 'semicolon':
      delim = ';';
      break;
    case 'space':
      return input.split(/\s+/);
    case 'tab':
      delim = '\t';
      break;
    case 'custom':
      delim = options.customDelimiter || '\n';
      break;
    case 'newline':
    default:
      return input.replace(/\r\n/g, '\n').split('\n');
  }

  return input.split(delim);
}

/**
 * Extracts the last word from an item string
 */
function getLastWord(item: string): string {
  const words = item.trim().split(/\s+/);
  return words[words.length - 1] || item;
}

/**
 * Sorts items based on options using Intl.Collator for international standard collation
 */
export function sortList(input: string, options: SortOptions = {}): SortResult {
  const {
    order = 'asc',
    caseInsensitive = true,
    numeric = true,
    trim = true,
    removeEmpty = true,
    removeDuplicates = false,
    sortByLastWord = false,
    reverse = false,
  } = options;

  let rawItems = splitItems(input, options);

  if (trim) {
    rawItems = rawItems.map((item) => item.trim());
  }

  if (removeEmpty) {
    rawItems = rawItems.filter((item) => item.length > 0);
  }

  const totalItems = rawItems.length;
  let duplicatesRemoved = 0;

  if (removeDuplicates) {
    const seen = new Set<string>();
    const uniqueItems: string[] = [];

    for (const item of rawItems) {
      const key = caseInsensitive ? item.toLowerCase() : item;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueItems.push(item);
      } else {
        duplicatesRemoved++;
      }
    }
    rawItems = uniqueItems;
  }

  // Preserve original indices for stable sorting
  const indexed = rawItems.map((item, index) => ({ item, index }));

  const collator = new Intl.Collator(undefined, {
    numeric: numeric,
    sensitivity: caseInsensitive ? 'accent' : 'variant',
    caseFirst: 'upper',
  });

  indexed.sort((a, b) => {
    const valA = sortByLastWord ? getLastWord(a.item) : a.item;
    const valB = sortByLastWord ? getLastWord(b.item) : b.item;

    let cmp = collator.compare(valA, valB);
    if (cmp === 0) {
      // Stable sort: keep original relative order
      return a.index - b.index;
    }
    return order === 'desc' ? -cmp : cmp;
  });

  let sorted = indexed.map((x) => x.item);

  if (reverse) {
    sorted = sorted.reverse();
  }

  const joinDelim = options.delimiter === 'comma' ? ', ' : options.delimiter === 'semicolon' ? '; ' : '\n';
  const output = sorted.join(joinDelim);

  return {
    sorted,
    totalItems,
    duplicatesRemoved,
    output,
  };
}
