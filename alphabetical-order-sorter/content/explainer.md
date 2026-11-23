# How Alphabetical Order Sorter Works

The Alphabetical Order Sorter organizes lists of words, names, citations, and numbers into ordered sequences using international Unicode Collation via `Intl.Collator`.

## Natural Number Sorting vs Binary Sorting
Standard binary ASCII sorting compares character codepoints sequentially. In standard ASCII ordering, `"10"` sorts before `"2"` because the character `'1'` precedes `'2'`. When **Natural Numbers** is enabled, numeric sequences inside text strings are parsed as discrete numerical magnitudes, ordering `2` before `10` naturally as humans expect.

## International Collation & Case Sensitivity
The sorter relies on the native ECMAScript Internationalization API (`Intl.Collator`). Rather than performing simple uppercase transformations that break accented characters (like `é` or `ü`), the collator applies standard linguistic rules. Case-insensitive mode treats letters with identical base glyphs as equivalent while preserving original capitalization.

## Stable Sorting & Deduplication
- **Algorithm Stability:** JavaScript's sorting implementation preserves the original relative position of items that evaluate to equal comparison values.
- **Duplicate Removal:** When deduplication is active, the engine tracks seen keys in a set. It retains the very first occurrence of an item and discards subsequent duplicates, reporting both total item count and removed duplicate counts live.
- **Sort by Last Word:** Extracts the final token of each line to alphabetize lists of people's full names by surname effortlessly.

## Delimiter Handling and Academic Indexing
Writers, legal researchers, and academics often manage bibliographies and indexes separated by different delimiters. The tool permits toggling dynamically between line breaks, comma-separated lists, and tab-separated entries. Automatic whitespace trimming strips accidental leading spaces so punctuation and indentations do not misplace alphabetized entries. Everything processes in real-time in your browser without data transmission.