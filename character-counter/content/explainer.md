# How the Character Counter Works

Accurately counting characters in modern digital communication is far more complex than counting computer bytes. Modern text relies on Unicode, where visual glyphs frequently consist of multiple underlying code points and surrogate pairs.

### True Grapheme Cluster Segmentation

Traditional string utilities count code units. In JavaScript, `"👋".length` evaluates to 2, and composite emoji like family sequences evaluate to 11 code units. 

This tool employs the ECMAScript Internationalization API (`Intl.Segmenter`) configured for **grapheme granularity**. A grapheme cluster represents a single perceived visual character, ensuring that an emoji, accented diacritic, or combining letter counts as exactly **one** character.

### Word and Sentence Counting Rules

- **Words:** Words are identified as whitespace-delimited tokens containing at least one Unicode letter (`\p{L}`) or number (`\p{N}`). Punctuation-only tokens are excluded, while hyphenated compounds (e.g., `state-of-the-art`) are preserved as single units matching desktop word processor rules.
- **Sentences:** Sentences are delineated by sentence-terminating punctuation marks (`.`, `!`, `?`) followed by whitespace or document boundaries.
- **Paragraphs:** Blocks separated by consecutive newline characters (`\n\s*\n`).

### Estimated Reading & Speaking Velocities

Reading speed is evaluated against the empirical standard of **238 words per minute (wpm)** for adult silent reading of non-technical prose. Speaking duration is computed at **150 wpm**, providing accurate pacing metrics for scripts, public speaking, and video voiceovers.

### Character Constraints and Platform Publishing

Different publishing environments impose distinct metric constraints. Microblogging platforms like X (formerly Twitter) enforce a 280-character ceiling, meta descriptions require approximately 155–160 characters for search engine result pages, and SMS messaging segments payloads at 160 GSM-7 characters. Monitoring both total character volume and character counts without whitespace ensures compliance with editorial style guides, grant applications, and character-restricted database fields.

### Local Client Privacy

This tool runs exclusively within your browser's local client thread. Your text is never stored in browser storage, logged, or sent across any network connection.