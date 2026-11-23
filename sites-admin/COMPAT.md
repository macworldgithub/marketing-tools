# Content Specification & Compatibility Contract (COMPAT.md)

This document specifies the content schemas, serialization rules, and template compilation standards used by **Sites Admin** to ensure 100% byte-for-byte and operational compatibility with the 23 tool websites.

---

## 1. Directory & File Conventions

Sites Admin operates exclusively on content files within the tools repository:

```
<slug>/content/site.json
<slug>/content/faqs.json
<slug>/content/privacy.md
<slug>/content/terms.md
<slug>/content/explainer.md       # Read-only in Admin v1
_shared/privacy.master.md         # Baseline template for Privacy Policy
_shared/terms.master.md           # Baseline template for Terms of Service
```

Any files outside `<slug>/content/` and `_shared/` are strictly ignored and never modified.

---

## 2. JSON Serialization Standards

To guarantee minimal and clean Git diffs:
1. **Indentation:** Exactly 2 spaces.
2. **Trailing Newline:** Every JSON file must terminate with a single Unix LF newline `\n`.
3. **Stable Key Order:**
   - **`site.json`:**
     1. `schemaVersion` (number, literal 1)
     2. `slug` (kebab-case string)
     3. `siteName` (string, max 100)
     4. `toolName` (string, max 100)
     5. `primaryKeyword` (string, max 100)
     6. `domain` (string)
     7. `tagline` (string, max 250)
     8. `contactEmail` (valid email string)
     9. `accent` (enum: `blue`, `teal`, `indigo`, `emerald`, `slate`)
     10. `effectiveDate` (string, `YYYY-MM-DD`)
     11. `features` (object: `ads` boolean, `analytics` enum `none|plausible|ga4`, `localStorageKeys` string array)
   - **`faqs.json`:**
     1. `schemaVersion` (number, literal 1)
     2. `items` (array of objects with `id`, `question`, `answer` in display order)

---

## 3. Strict Template Interpolation Rules

The legal templates (`privacy.md`, `terms.md`, `_shared/*.master.md`) use deterministic token replacement:

### Allowed Variables:
- `{{siteName}}`
- `{{toolName}}`
- `{{domain}}`
- `{{contactEmail}}`
- `{{effectiveDate}}`
- `{{localStorageKeys}}`

### Allowed Conditionals:
- `{{#if ads}}...{{/if}}`
- `{{#if analytics}}...{{/if}}`
- `{{#if localStorage}}...{{/if}}`

### Error Conditions (Strict Failure):
- Any variable not in the allowed list triggers an immediate parse error.
- Any conditional block not in the allowed list triggers an immediate parse error.
- Any unbalanced `{{#if}}` and `{{/if}}` tags trigger an immediate parse error.

---

## 4. Markdown Sanitization Compatibility

In production tool sites, markdown is sanitized with `rehype-sanitize`:
- **Allowed Tags:** `h2`, `h3`, `p`, `ul`, `ol`, `li`, `strong`, `b`, `em`, `i`, `a`, `code`, `blockquote`, `hr`.
- **Disallowed Tags:** `h1` (reserved exclusively for page title), `h4`-`h6`, `script`, `iframe`, `img`, `svg`, raw HTML.
- **Linter Rule:** Any top-level `# Heading` in markdown templates is flagged as an `ERROR` before saving, preventing silent heading removal on the live site.

