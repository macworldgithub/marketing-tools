# How JSON Formatter & Validator Works

The JSON Formatter & Validator formats, checks, minifies, and repairs JavaScript Object Notation data completely within the client browser.

## The Floating-Point Hazard & Lossless Parsing
Standard JavaScript engines parse JSON strings using `JSON.parse()`. Under the ECMAScript specification, all numeric tokens are mapped to IEEE 754 double-precision floating-point numbers. Any integer larger than $2^{53} - 1$ (`9,007,199,254,740,991`), such as 64-bit database identifiers (`12345678901234567890`) or high-precision financial values, suffers irreversible silent truncation.

This tool incorporates `lossless-json`. Rather than coercing numeric tokens into JavaScript `Number` primitives, numeric values are retained as discrete lossless numerical representations. Formatting or sorting keys preserves every significant digit and trailing zero byte-for-byte.

## Precision Error Reporting
When parsing fails, this utility maps the parser byte offset to the corresponding 1-based line and column coordinates. For instance, a syntax error such as a trailing comma in `{"a": 1,}` is reported specifically at Line 1, Column 8, allowing developers to debug payloads rapidly.

## Automated Syntax Repair
Human developers and AI output often produce slightly non-compliant JSON containing trailing commas, single quotes, unquoted keys, or Python boolean literals (`True`/`False`). The optional "Try to Repair" action applies `jsonrepair` heuristics to transform malformed text into valid RFC 8259 JSON safely without silent data loss.

## Alphabetical Key Sorting & Payloads
Developers frequently need to compare JSON payloads across staging and production environments. Enabling recursive key sorting organizes all nested object properties in alphabetical order, eliminating artificial diff noise caused by arbitrary key serialization. For bandwidth-sensitive production deployments, the Minify mode strips extraneous whitespace while safeguarding string literals and Unicode escapes. All formatting happens locally in browser memory, protecting proprietary API secrets and user tokens from third-party interception.