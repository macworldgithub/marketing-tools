# How Base64 Encoding and Decoding Works

Base64 is a binary-to-text encoding scheme defined in RFC 4648 that represents arbitrary binary sequences using a compact set of 64 printable ASCII characters (`A-Z`, `a-z`, `0-9`, `+`, and `/`).

## The Encoding Mechanics
Every 3 bytes of binary data (24 bits) are split into four 6-bit chunks. Each 6-bit integer (ranging from 0 to 63) maps to an index in the Base64 alphabet:
- Bits `0–25` represent `A–Z`
- Bits `26–51` represent `a–z`
- Bits `52–61` represent `0–9`
- Bit `62` represents `+` (or `-` in URL-safe mode)
- Bit `63` represents `/` (or `_` in URL-safe mode)

When the total input byte count is not divisible by 3, one or two `=` characters are appended as padding to complete the 4-character alignment boundary.

## UTF-8 Safe Architecture
Standard legacy web APIs like `window.btoa` and `window.atob` operate strictly on 8-bit Latin-1 strings and throw an uncaught `InvalidCharacterError` when encountering multi-byte Unicode codepoints (such as accented vowels, Asian scripts, or emojis). This tool utilizes native `TextEncoder` and `TextDecoder` pipelines combined with chunked binary buffers, guaranteeing 100% loss-free representation across all international character sets.

## URL-Safe and MIME Formats
Web query parameters and filenames frequently disallow `+` and `/` characters. Enabling URL-safe formatting replaces these symbols with hyphen-minus (`-`) and underscore (`_`) while removing trailing padding. For legacy email architectures, the MIME 76-character line wrap option splits continuous Base64 output with CRLF delimiters as specified in RFC 2045.

## Browser-Only Security
All conversions occur locally in your browser memory. Uploaded binary files and sensitive encoded tokens are never transmitted to external APIs or logged to disk.