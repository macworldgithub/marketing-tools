# How Word and Character Counter Works

The Word and Character Counter provides deep editorial analytics, reading time metrics, and keyword frequency statistics directly in your web browser.

## Counting Methodology & Grapheme Clusters
Many character counting tools use simple string length properties (`text.length`). In JavaScript, UTF-16 surrogates cause compound emojis (e.g. 👋, 🌍, or 👨‍👩‍👧‍👦) to count as two or more characters. This tool employs the modern `Intl.Segmenter` API configured for grapheme granularity:
- **Characters (with spaces):** Counts perceived visual glyphs (grapheme clusters). Every compound emoji and newline character counts as exactly 1.
- **Characters (no spaces):** Filters out all Unicode whitespace characters (spaces, non-breaking spaces, tabs, and newlines).
- **Word Counting:** Whitespace-delimited tokens containing at least one Unicode letter (`\p{L}`) or number (`\p{N}`). Following Microsoft Word and Google Docs conventions, hyphen-joined words (e.g., `well-known`) are parsed as single word tokens.
- **Sentence Segmentation:** Uses linguistic boundary heuristics where short introductory phrases (<3 words ending in punctuation) attach cleanly to the subsequent clause.

## Reading and Speaking Velocities
- **Silent Reading Velocity:** Calculated at 238 words per minute, the empirical average for adult readers established in psychological reading studies.
- **Conversational Speech Speed:** Calculated at 150 words per minute, the standard benchmark for speeches, voiceovers, and presentation rehearsals.

## Keyword Density Analysis
The engine builds an occurrence map of all words. When the stop-word filter is active, over 100 common English functional words (such as `the`, `is`, `and`, `with`) are excluded to reveal the top 10 substantive keywords with exact percentage densities.