import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(__dirname, '..');

function writeContent(
  slug: string,
  faqs: { id: string; question: string; answer: string }[],
  explainerMd: string
) {
  const dir = path.join(ROOT_DIR, slug, 'content');
  fs.writeFileSync(path.join(dir, 'faqs.json'), JSON.stringify({ schemaVersion: 1, items: faqs }, null, 2), 'utf-8');
  fs.writeFileSync(path.join(dir, 'explainer.md'), explainerMd.trim(), 'utf-8');
}

// 10. BACKGROUND IMAGE MAKER
const bgFaqs = [
  { id: 'how-are-backgrounds-generated', question: 'How are backgrounds generated without a server or stock photos?', answer: 'All graphics, mathematical gradients, and geometric patterns are synthesized on an HTML5 Canvas directly in your web browser. Nothing is fetched from or sent to a remote server.' },
  { id: 'supported-resolutions', question: 'What image resolutions and aspect ratios can I export?', answer: 'Standard presets include Full HD (1920x1080), 2K QHD (2560x1440), 4K UHD (3840x2160), Mobile Portrait (1080x1920), and 720p HD. You can also define custom canvas dimensions up to 8192 pixels.' },
  { id: 'css-gradient-code', question: 'Can I copy the CSS code for web design?', answer: 'Yes. Whenever you design a linear or radial gradient, the exact CSS rule is generated with angle and color stops ready to copy into your stylesheet.' },
  { id: 'image-overlay-blur-privacy', question: 'Is my uploaded photo kept private when creating a blurred wallpaper?', answer: 'Completely private. When you upload a picture, it is loaded into your browser memory via createImageBitmap. No bytes ever leave your device.' },
  { id: 'file-formats-available', question: 'Which file formats can I download?', answer: 'You can export high-quality PNG for lossless graphics, JPEG with clean background rendering, or modern WebP.' },
  { id: 'conic-and-radial-gradients', question: 'How do radial gradients adapt to widescreen displays?', answer: 'Radial gradients compute center coordinates and maximum ellipse radiuses dynamically based on your chosen canvas aspect ratio to ensure uniform color spreading.' },
  { id: 'pattern-density-scaling', question: 'How does geometric pattern scaling work?', answer: 'You can adjust grid, dot, or stripe step sizes from 10 to 100 pixels with adjustable opacity overlays, enabling subtle textural depth without overwhelming UI elements.' },
  { id: 'performance-on-4k-displays', question: 'Will generating 4K wallpapers slow down my computer?', answer: 'Canvas operations utilize hardware-accelerated rendering through your graphics card, making 4K rasterization nearly instantaneous while consuming minimal memory.' }
];

const bgExplainer = `
# How Background Image Maker Works

The Background Image Maker synthesizes crisp, custom background graphics, desktop wallpapers, and social media backdrops entirely within your browser using the HTML5 Canvas API.

## Algorithmic Generation Modes
Instead of downloading heavy static stock imagery across a network, this utility renders procedural visuals locally on your hardware:
- **Linear & Radial Gradients:** Color transitions are interpolated mathematically across directional vector angles using Canvas 2D linear gradient contexts. Every color stop and angular offset is mapped directly to standard CSS syntax for immediate export to web stylesheets.
- **Geometric Texture Patterns:** Crisp vector-style polka dots, structural wireframe grids, and diagonal hatch stripes are drawn with customizable pixel steps and transparency values.
- **Photo Backdrops with Gaussian Blur:** If you choose to supply your own local photo, it is loaded directly into browser memory using \`createImageBitmap\`. You can apply adjustable Gaussian blur radii and semi-transparent dark or colored scrims to create high-contrast backdrop images ideal for text overlay.

## Technical Specifications & Canvas Boundaries
The engine accommodates standard display presets—such as Full HD (1920×1080), 2K QHD (2560×1440), 4K UHD (3840×2160), and phone portrait aspect ratios (1080×1920)—while permitting custom dimensions up to 8192 pixels per side. Hardware-accelerated GPU blitting ensures that rendering 4K buffers takes under 100 milliseconds without UI lag.

## Privacy & Security
Zero external network calls are made. No telemetry, analytics, or image bytes ever leave your local machine, guaranteeing complete confidentiality for personal photographs and proprietary brand palettes.
`;

writeContent('background-image', bgFaqs, bgExplainer);

// 11. BASE64 ENCODER
const base64Faqs = [
  { id: 'how-does-utf8-base64-work', question: 'Why is UTF-8 safe encoding important for Base64?', answer: 'Standard browser btoa() throws an exception on Unicode characters like emojis and non-Latin scripts. Our tool uses TextEncoder and TextDecoder to ensure all Unicode characters are properly preserved.' },
  { id: 'what-is-url-safe-base64', question: 'What is URL-safe Base64 encoding?', answer: 'Standard Base64 uses "+" and "/" which have reserved meanings in URL parameters. URL-safe Base64 replaces "+" with "-" and "/" with "_", and omits trailing "=" padding characters.' },
  { id: 'are-files-uploaded-to-server', question: 'Are my files uploaded to a remote server when encoding?', answer: 'Never. File reading and binary conversion occur entirely in your local browser memory using the FileReader and TypedArray APIs. Zero network requests are made.' },
  { id: 'what-is-mime-line-wrapping', question: 'What does the 76-character MIME wrap option do?', answer: 'The MIME standard (RFC 2045) specifies that Base64 email attachments and headers should be split into lines of at most 76 characters separated by CRLF line breaks.' },
  { id: 'how-to-decode-malformed-base64', question: 'How does the decoder handle missing padding or URL-safe characters?', answer: 'Our decoder automatically normalizes URL-safe characters and restores missing "=" padding before decoding, reporting clear syntax errors if invalid characters are detected.' },
  { id: 'data-uri-scheme-usage', question: 'What is a Data URI and how can I use it in HTML?', answer: 'A Data URI embeds raw file data directly into HTML or CSS (data:image/png;base64,...) eliminating extra HTTP requests for small logos or icons.' },
  { id: 'binary-chunking-memory', question: 'How does the encoder handle large binary files without freezing?', answer: 'Binary byte arrays are processed in discrete chunks of 3 bytes (yielding 4 ASCII characters), preventing memory stack overflows and browser thread locking.' },
  { id: 'roundtrip-decoding-guarantee', question: 'Is decoded text guaranteed to match the original input byte-for-byte?', answer: 'Yes. Our Base64 engine undergoes automated roundtrip property tests proving that decode(encode(x)) strictly equals x for all arbitrary Unicode strings and byte buffers.' }
];

const base64Explainer = `
# How Base64 Encoding and Decoding Works

Base64 is a binary-to-text encoding scheme defined in RFC 4648 that represents arbitrary binary sequences using a compact set of 64 printable ASCII characters (\`A-Z\`, \`a-z\`, \`0-9\`, \`+\`, and \`/\`).

## The Encoding Mechanics
Every 3 bytes of binary data (24 bits) are split into four 6-bit chunks. Each 6-bit integer (ranging from 0 to 63) maps to an index in the Base64 alphabet:
- Bits \`0–25\` represent \`A–Z\`
- Bits \`26–51\` represent \`a–z\`
- Bits \`52–61\` represent \`0–9\`
- Bit \`62\` represents \`+\` (or \`-\` in URL-safe mode)
- Bit \`63\` represents \`/\` (or \`_\` in URL-safe mode)

When the total input byte count is not divisible by 3, one or two \`=\` characters are appended as padding to complete the 4-character alignment boundary.

## UTF-8 Safe Architecture
Standard legacy web APIs like \`window.btoa\` and \`window.atob\` operate strictly on 8-bit Latin-1 strings and throw an uncaught \`InvalidCharacterError\` when encountering multi-byte Unicode codepoints (such as accented vowels, Asian scripts, or emojis). This tool utilizes native \`TextEncoder\` and \`TextDecoder\` pipelines combined with chunked binary buffers, guaranteeing 100% loss-free representation across all international character sets.

## URL-Safe and MIME Formats
Web query parameters and filenames frequently disallow \`+\` and \`/\` characters. Enabling URL-safe formatting replaces these symbols with hyphen-minus (\`-\`) and underscore (\`_\`) while removing trailing padding. For legacy email architectures, the MIME 76-character line wrap option splits continuous Base64 output with CRLF delimiters as specified in RFC 2045.

## Browser-Only Security
All conversions occur locally in your browser memory. Uploaded binary files and sensitive encoded tokens are never transmitted to external APIs or logged to disk.
`;

writeContent('base64-encoder', base64Faqs, base64Explainer);

// 12. FAKE NAME GENERATOR
const fakeNameFaqs = [
  { id: 'is-generated-data-real', question: 'Are these names and contact details connected to real individuals?', answer: 'No. All generated identities are completely fictional combinations from bundled linguistic name datasets. Any resemblance to real living or deceased persons is purely coincidental.' },
  { id: 'safe-phone-and-email-guarantees', question: 'Why are emails and phone numbers guaranteed safe for development?', answer: 'Emails are exclusively created using RFC 2606 reserved domains (example.com, example.org, example.net) which can never receive spam. US phone numbers use the fictional 555-0100 to 555-0199 test range.' },
  { id: 'government-ids-policy', question: 'Does this tool generate Social Security numbers, credit cards, or passports?', answer: 'Strictly no. To prevent misuse, this utility never generates government identification numbers, financial credentials, or private citizen records.' },
  { id: 'export-formats', question: 'How can I export generated names for database seeding?', answer: 'You can instantly copy data to your clipboard or download clean CSV and structured JSON files compatible with mock APIs and database seeding scripts.' },
  { id: 'reproducible-seed-generation', question: 'Can I generate the same set of test users across multiple runs?', answer: 'Yes. By entering an optional numeric Seed value, the deterministic pseudorandom number generator produces the exact same sequence of names across test sessions.' },
  { id: 'demographic-localization', question: 'How are culturally accurate names selected for each country?', answer: 'The engine bundles curated dictionaries of over 200 first names and 200 family surnames for each supported country: US, UK, India, Pakistan, Canada, and Australia.' },
  { id: 'gender-filtering-options', question: 'Can I filter identities by gender?', answer: 'Yes. You can select Male, Female, or Random to match the demographic requirements of your mock application or persona testing.' },
  { id: 'date-of-birth-ranges', question: 'What age brackets are used for simulated birth dates?', answer: 'Dates of birth are generated within realistic adult ranges (ages 18 to 75) formatted as ISO 8601 YYYY-MM-DD strings.' }
];

const fakeNameExplainer = `
# How Fake Name Generator Works

The Fake Name Generator synthesizes authentic-sounding fictional identities for software testing, automated QA pipelines, and design prototypes.

## Cultural Name Modeling
Rather than calling third-party mock data services that can leak test requests, this utility bundles static linguistic dictionaries containing hundreds of verified given names and surnames across six major countries:
- **United States & Canada:** Comprehensive blend of contemporary Anglo-Saxon, Latin, and international demographic names.
- **United Kingdom & Australia:** Traditional and modern regional naming distributions.
- **India & Pakistan:** Culturally authentic regional given names and surnames reflecting South Asian naming conventions.

## Safe-By-Design Principles
1. **RFC 2606 Reserved Domains:** All mock email addresses strictly utilize the reserved domain extensions \`@example.com\`, \`@example.org\`, and \`@example.net\`. These domains are hard-coded in internet routing protocols never to deliver mail, preventing accidental spam delivery.
2. **Designated Fictional Numbers:** United States and Canadian telephone numbers strictly fall within the North American Numbering Plan (NANP) fictional allocation range \`555-0100\` through \`555-0199\`.
3. **Strict Ban on PII:** This tool does not generate Social Security numbers, tax identifiers, passport credentials, or payment cards.

## Deterministic Seeding & Export
For automated end-to-end testing, entering an integer seed initializes a Mulberry32 pseudorandom number generator. This guarantees reproducible sequences of test fixtures across test runs. Data can be exported to JSON or CSV format with a single click.
`;

writeContent('fake-name-generator', fakeNameFaqs, fakeNameExplainer);

// 13. IMAGE COMPRESSOR
const imgCompFaqs = [
  { id: 'how-does-client-side-compression-work', question: 'How does client-side image compression work without server uploads?', answer: 'Images are drawn to an HTML5 Canvas using createImageBitmap and re-encoded directly in browser memory at your designated quality setting. Zero bytes are uploaded to any server.' },
  { id: 'why-are-exif-metadata-stripped', question: 'Are EXIF metadata and GPS locations stripped during compression?', answer: 'Yes. Drawing an image to a canvas naturally strips all EXIF metadata, camera settings, and geolocation tags, enhancing privacy while reducing file weight.' },
  { id: 'what-happens-if-compressed-file-is-larger', question: 'What happens if the compressed result is larger than the original?', answer: 'If re-encoding does not yield a smaller file size (common when attempting to re-compress already heavily optimized files), the tool automatically preserves your original file and alerts you.' },
  { id: 'which-formats-supported', question: 'Which image formats are supported for compression?', answer: 'JPEG, WebP, and PNG images are supported. You can re-encode JPEGs and WebPs with custom quality factors or convert PNGs to modern WebP.' },
  { id: 'batch-compression-support', question: 'Can I compress multiple images at once?', answer: 'Yes. You can drag and drop multiple files to compress them simultaneously and download them individually or as a ZIP archive.' },
  { id: 'quality-slider-guidelines', question: 'What quality setting offers the best balance of file size and visual fidelity?', answer: 'A quality factor between 0.70 and 0.80 typically reduces JPEG and WebP file weight by 60% to 80% with virtually imperceptible visual compression artifacts on web screens.' },
  { id: 'dimension-clamping-benefits', question: 'Why should I set a maximum pixel dimension?', answer: 'Modern smartphone cameras capture images at 4000+ pixels wide. Constraining resolution to 1920 or 2048 pixels yields dramatic file size reductions before compression even begins.' },
  { id: 'memory-management-large-images', question: 'Can this tool process high-resolution DSLR photos safely?', answer: 'Yes. The engine uses createImageBitmap and automatically revokes object URLs upon completion, ensuring browser memory is freed immediately.' }
];

const imgCompExplainer = `
# How Image Compressor Works

The Image Compressor reduces image file weight directly in your web browser using HTML5 Canvas rendering and browser-native lossy codecs.

## Compression Mechanics
When an image is dropped onto the tool, it is decoded into an in-memory bitmap using \`createImageBitmap({ imageOrientation: 'from-image' })\`. This API automatically applies orientation transforms specified in camera EXIF tags so photos never appear sideways.

The image is drawn to an off-screen \`HTMLCanvasElement\`. If optional dimension clamping is active (such as capping width at 2048 pixels), the canvas scales the image proportionally using high-quality bi-cubic interpolation. The canvas is then serialized using \`canvas.toBlob(callback, format, quality)\`:
- **JPEG Encoding:** Uses discrete cosine transform (DCT) quantization across 8×8 pixel blocks.
- **WebP Encoding:** Uses predictive intra-frame compression and variable-size macroblocks, often outperforming JPEG by 25–35% at identical perceived visual quality.

## Strict Size Protection
A frequent pitfall of automated compression is re-encoding an already heavily compressed image at a higher quality, resulting in an output file larger than the original. Our engine compares the post-compression byte count against the source file. If the output is not strictly smaller, the original file is preserved and flagged clearly.

## Metadata Stripping & Privacy
Canvas serialization generates a pure pixel raster stream that contains zero EXIF metadata. Embedded camera serial numbers, lens profiles, exposure details, and GPS coordinates are stripped completely before download. No image bytes are sent over the network.
`;

writeContent('image-compressor', imgCompFaqs, imgCompExplainer);

// 14. IMAGE TO PDF
const imgPdfFaqs = [
  { id: 'how-are-images-compiled-into-pdf', question: 'How are images converted into PDF without a backend?', answer: 'This tool uses the pdf-lib library running natively in your browser. Each uploaded image is scaled and embedded onto document pages according to your layout preferences.' },
  { id: 'supported-page-sizes', question: 'What page sizes and orientations can I choose?', answer: 'Standard A4 (595.28 x 841.89 pt), US Letter (612 x 792 pt), and Fit-to-Image modes are supported in Portrait, Landscape, or Auto orientation.' },
  { id: 'can-i-reorder-images', question: 'Can I change the order of pages before downloading?', answer: 'Yes. You can use the Move Up and Move Down controls on each image to arrange pages exactly as desired.' },
  { id: 'margin-and-fit-options', question: 'What margin and image scaling options are available?', answer: 'You can choose between zero margin, 18 pt (small), or 36 pt (standard), with options to Contain (preserve aspect ratio), Cover, or Stretch images across the page.' },
  { id: 'is-my-document-private', question: 'Is my document private and secure?', answer: 'Completely private. No image bytes or generated PDF documents ever leave your device or travel over the network.' },
  { id: 'aspect-ratio-preservation', question: 'Will my photos be stretched or distorted in the PDF?', answer: 'In the default Contain mode, the engine calculates uniform proportional scaling so images are centered without any aspect ratio distortion.' },
  { id: 'pdf-standard-compliance', question: 'Are the created PDF documents compatible with all PDF readers?', answer: 'Yes. Generated documents conform strictly to the PDF 1.7 specification, rendering consistently across Adobe Acrobat, Apple Preview, Google Chrome, and mobile viewers.' },
  { id: 'maximum-pages-allowed', question: 'Is there a limit on how many images can be compiled into one PDF?', answer: 'You can compile dozens of images simultaneously. Memory management ensures buffers are processed sequentially into the PDF binary structure.' }
];

const imgPdfExplainer = `
# How Image to PDF Converter Works

The Image to PDF Converter compiles individual image files into a single, multipage PDF document using the pure JavaScript library \`pdf-lib\` executing directly in the client browser.

## Typographic Geometry & Placement
PDF coordinates are defined in typographic points, where 1 inch equals exactly 72 points:
- **A4 Standard:** 595.28 × 841.89 pt (210 × 297 mm)
- **US Letter:** 612.00 × 792.00 pt (8.5 × 11.0 in)
- **Fit to Image:** Creates a custom page bounding box matching the image pixel dimensions plus specified margin padding.

When calculating layout in **Contain** mode, available printable width and height are determined by subtracting twice the margin parameter:
\`\`\`text
availWidth = pageWidth - (2 * margin)
availHeight = pageHeight - (2 * margin)
scale = Math.min(availWidth / imageWidth, availHeight / imageHeight)
\`\`\`
The image is drawn at \`x = margin + (availWidth - drawnWidth) / 2\` and \`y = margin + (availHeight - drawnHeight) / 2\`, centering the photograph on the page without distorting its natural aspect ratio.

## Binary Embedding
JPEG and PNG image streams are embedded into the PDF document as discrete XObject image dictionaries. Non-standard or raw graphic buffers are first normalized into standard PNG streams using HTML5 Canvas before document inclusion.

## Local Execution
All document assembly occurs within browser WebAssembly and JavaScript threads. No documents, invoices, or ID scans are ever uploaded to a cloud server, ensuring full regulatory compliance and personal privacy.
`;

writeContent('image-to-pdf', imgPdfFaqs, imgPdfExplainer);

// 15. JPG TO PNG
const jpgPngFaqs = [
  { id: 'does-converting-jpg-to-png-improve-quality', question: 'Does converting JPG to PNG improve image quality?', answer: 'No. While PNG is a lossless format, converting an existing JPG cannot restore compression artifacts or visual details that JPEG lossy compression already discarded.' },
  { id: 'why-are-png-files-larger', question: 'Why are converted PNG files often larger than the original JPG?', answer: 'PNG uses lossless DEFLATE compression which preserves exact pixel color values, whereas JPEG uses lossy discrete cosine transform. Consequently, converted PNG files are almost always larger.' },
  { id: 'batch-conversion-and-zip', question: 'Can I convert multiple JPGs and download them as a ZIP archive?', answer: 'Yes. You can select multiple images to convert them in batch, downloading them individually or bundled together in a ZIP file.' },
  { id: 'privacy-guarantee', question: 'Are my images uploaded to any remote server?', answer: 'No. The conversion is performed locally via your browser HTML5 Canvas. No image data is ever uploaded or transmitted.' },
  { id: 'supported-input-formats', question: 'Can I convert other formats to PNG?', answer: 'Yes. The converter accepts JPG, JPEG, WebP, and BMP files and converts them all into standard lossless PNG.' },
  { id: 'lossless-compression-algorithm', question: 'How does the PNG format compress image data?', answer: 'PNG uses LZ77-derived DEFLATE compression paired with predictive horizontal/vertical byte filters to pack repeated color runs without discarding data.' },
  { id: 'transparency-support', question: 'Does converting JPG to PNG add a transparent background?', answer: 'Converting JPG creates an opaque PNG since JPEGs contain no alpha channel. To add transparency, pixels must be edited or keyed out separately.' },
  { id: 'when-to-use-png-over-jpg', question: 'When is PNG preferred over JPG for graphics?', answer: 'PNG is ideal for digital illustrations, screenshots, UI diagrams, and typography where sharp edge definitions and color consistency are essential.' }
];

const jpgPngExplainer = `
# How JPG to PNG Converter Works

The JPG to PNG Converter decodes JPEG raster images locally and re-encodes them into the lossless Portable Network Graphics (PNG) format using the HTML5 Canvas API.

## Technical Realities of Format Conversion
Understanding the differences between lossy and lossless image codecs is crucial when converting files:
1. **The Irreversibility of JPEG Loss:** When an image is saved as a JPEG, a discrete cosine transform discards high-frequency visual information to minimize file size. Converting that file into a PNG cannot reconstruct the discarded frequencies; it simply captures the currently visible pixels into a lossless wrapper.
2. **File Size Expansion:** JPEG compression achieves ratios of 10:1 to 20:1. Because PNG preserves the exact RGB value of every decoded pixel using DEFLATE compression, the resulting PNG is typically 2 to 5 times larger than the input JPEG.
3. **Prevention of Further Degradation:** The primary benefit of converting to PNG is preventing *generation loss*. Editing and re-saving an image as JPEG compounds compression artifacts, whereas editing a PNG preserves quality across successive saves.

## Browser-Side Conversion Flow
When a user selects files, each image is loaded into memory via an \`HTMLImageElement\` object. An off-screen canvas is dimensioned to the image's intrinsic width and height. The pixel buffer is transferred to the canvas and serialized to an \`image/png\` blob. Multiple files can be packed into a ZIP archive in memory using \`fflate\` without server round-trips.
`;

writeContent('jpg-to-png', jpgPngFaqs, jpgPngExplainer);

// 16. JSON FORMATTER
const jsonFaqs = [
  { id: 'how-are-bigints-preserved', question: 'How does this tool prevent large numbers and decimals from losing precision?', answer: 'Standard JSON.parse in JavaScript rounds numbers exceeding 53 bits (Number.MAX_SAFE_INTEGER). Our tool uses lossless-json to preserve 64-bit integer strings and decimal accuracy exactly.' },
  { id: 'how-does-json-repair-work', question: 'What does the "Try to Repair" action fix?', answer: 'The repair tool resolves common syntax oversights including trailing commas, single-quoted strings, unquoted object keys, and unescaped characters using jsonrepair.' },
  { id: 'error-line-and-column-reporting', question: 'How are syntax error locations reported?', answer: 'When validation detects a syntax error, the tool calculates the 1-based line and column coordinates so you can jump directly to the invalid character.' },
  { id: 'key-sorting-mechanism', question: 'Does key sorting apply to nested objects?', answer: 'Yes. Enabling key sorting recursively orders all object keys alphabetically across all nested levels while leaving arrays in their original order.' },
  { id: 'is-my-json-data-private', question: 'Is my data transmitted or stored anywhere?', answer: 'Never. All parsing, validation, formatting, and repair algorithms execute 100% locally in your client environment.' },
  { id: 'indentation-options', question: 'What indentation options can I choose?', answer: 'You can format JSON with 2 spaces (standard web convention), 4 spaces (backend convention), or Tab characters for accessibility.' },
  { id: 'minification-savings', question: 'What does the Minify option do?', answer: 'Minifying strips all non-essential whitespace, line breaks, and indentation, significantly decreasing payload byte sizes for production APIs.' },
  { id: 'handling-large-payloads', question: 'Can the tool format multi-megabyte JSON payloads?', answer: 'Yes. The lossless parser handles large structures efficiently without blocking main rendering loops.' }
];

const jsonExplainer = `
# How JSON Formatter & Validator Works

The JSON Formatter & Validator formats, checks, minifies, and repairs JavaScript Object Notation data completely within the client browser.

## The Floating-Point Hazard & Lossless Parsing
Standard JavaScript engines parse JSON strings using \`JSON.parse()\`. Under the ECMAScript specification, all numeric tokens are mapped to IEEE 754 double-precision floating-point numbers. Any integer larger than $2^{53} - 1$ (\`9,007,199,254,740,991\`), such as 64-bit database identifiers (\`12345678901234567890\`) or high-precision financial values, suffers irreversible silent truncation.

This tool incorporates \`lossless-json\`. Rather than coercing numeric tokens into JavaScript \`Number\` primitives, numeric values are retained as discrete lossless numerical representations. Formatting or sorting keys preserves every significant digit and trailing zero byte-for-byte.

## Precision Error Reporting
When parsing fails, this utility maps the parser byte offset to the corresponding 1-based line and column coordinates. For instance, a syntax error such as a trailing comma in \`{"a": 1,}\` is reported specifically at Line 1, Column 8, allowing developers to debug payloads rapidly.

## Automated Syntax Repair
Human developers and AI output often produce slightly non-compliant JSON containing trailing commas, single quotes, unquoted keys, or Python boolean literals (\`True\`/\`False\`). The optional "Try to Repair" action applies \`jsonrepair\` heuristics to transform malformed text into valid RFC 8259 JSON safely without silent data loss.
`;

writeContent('json-formatter', jsonFaqs, jsonExplainer);

// 17. LOREM IPSUM GENERATOR
const loremFaqs = [
  { id: 'what-is-lorem-ipsum', question: 'What is Lorem Ipsum placeholder text?', answer: 'Lorem Ipsum is standard dummy text used by the printing and typesetting industry since the 1500s. Derived from Cicero\'s philosophical treatise De Finibus Bonorum et Malorum, it mimics natural typographic word distributions.' },
  { id: 'exact-word-count-guarantee', question: 'Does requesting N words produce exactly N words?', answer: 'Yes. Our generator engine strictly guarantees that selecting any word count from 1 to 500 will output exactly that count of whitespace-separated words.' },
  { id: 'can-i-toggle-the-classic-opening', question: 'Can I disable the standard "Lorem ipsum dolor sit amet" beginning?', answer: 'Yes. A dedicated toggle switch allows you to start immediately with randomized Latin words rather than the classic opening phrase.' },
  { id: 'html-paragraph-tags', question: 'Can I export dummy text pre-wrapped in HTML paragraph tags?', answer: 'Yes. Selecting the HTML output option wraps every generated block in <p>...</p> tags ready for direct insertion into web templates.' },
  { id: 'sentence-punctuation-rules', question: 'How are sentences and commas structured in the text?', answer: 'Sentences range realistically between 5 and 15 words, with comma pauses inserted in clauses exceeding 8 words, capital initial letters, and terminating periods.' },
  { id: 'word-bank-composition', question: 'What words are used in the generator vocabulary?', answer: 'The engine uses the authentic 70-word classic Latin corpus used in traditional typography to preserve realistic character and vowel distributions.' },
  { id: 'why-use-lorem-over-english', question: 'Why is Latin placeholder text preferable to English text in design mockups?', answer: 'Latin placeholder text prevents viewers from being distracted by reading the content, focusing attention purely on visual hierarchy, font styling, and layout balance.' },
  { id: 'paragraph-sentence-variance', question: 'How many sentences are included in each paragraph?', answer: 'Paragraphs randomly vary between 3 and 7 sentences, creating organic visual blocks that closely simulate authentic editorial copy.' }
];

const loremExplainer = `
# How Lorem Ipsum Generator Works

The Lorem Ipsum Generator synthesizes classic Latin placeholder text for web design mockups, wireframing, and typographic styling.

## Typographic Distribution & History
Placeholder dummy text has been an industry standard in print publishing since the 1500s, when an unknown printer scrambled parts of Cicero's 45 BC treatise *De Finibus Bonorum et Malorum*. English text contains predictable letter pairings that distract reviewers into reading the content rather than assessing the page structure. Lorem Ipsum provides a natural distribution of letters and word lengths that emulates readable prose without conveying meaning.

## Algorithmic Precision
Unlike naive generators that append static paragraphs, our generator is built on strict grammatical rules:
- **Strict Word Count Guarantee:** Requesting $N$ words produces exactly $N$ whitespace-delimited tokens. For example, generating 50 words produces exactly 50 words, capitalizes initial sentence clauses, and terminates with a period.
- **Natural Sentence Rhythm:** Sentences vary in length between 5 and 15 words. For sentences longer than 8 words, a comma is inserted dynamically into the mid-sentence clause to mimic realistic phrasing pauses.
- **Paragraph Grouping:** Paragraphs combine 3 to 7 varied sentences into structured visual blocks.
- **HTML Export:** A dedicated toggle formats output into clean semantic \`<p>...</p>\` tags for immediate use in JSX or HTML templates.

All text synthesis runs entirely in your local browser with zero remote API latency.
`;

writeContent('lorem-ipsum-generator', loremFaqs, loremExplainer);

// 18. STRONG PASSWORD GENERATOR
const strongPassFaqs = [
  { id: 'how-is-password-entropy-calculated', question: 'How is password entropy measured?', answer: 'Entropy is calculated as Length × log2(Pool Size). A 20-character password spanning all 94 ASCII characters provides over 131 bits of generation entropy, rendering brute-force attacks mathematically impossible.' },
  { id: 'passphrase-vs-random-password', question: 'Why choose a multi-word passphrase over random characters?', answer: 'Passphrases combine high entropy with human memorability. A 5-word passphrase drawn from a standard dictionary offers over 64 bits of entropy while remaining easy to type without transcription errors.' },
  { id: 'cryptographic-randomness-guarantee', question: 'How is cryptographically secure randomness guaranteed?', answer: 'Randomness is sourced exclusively from the browser crypto.getRandomValues API with rejection sampling to eliminate modulo bias. Math.random is strictly forbidden.' },
  { id: 'are-passwords-stored-or-logged', question: 'Are generated passwords saved or logged in any way?', answer: 'Never. Passwords exist only in active browser memory and disappear when the page is refreshed. Nothing is ever sent to a server.' },
  { id: 'ambiguous-character-exclusion', question: 'What does the ambiguous character exclusion option do?', answer: 'Excluding ambiguous characters removes visually confusing glyphs such as uppercase I, lowercase l, numeral 1, uppercase O, and numeral 0 to prevent transcription mistakes.' },
  { id: 'character-class-guarantee', question: 'Does every generated password include characters from every selected set?', answer: 'Yes. The algorithm guarantees that at least one character from each selected class (uppercase, lowercase, number, symbol) is present, shuffled randomly via Fisher-Yates.' },
  { id: 'eff-wordlist-standard', question: 'What dictionary powers the passphrase generator?', answer: 'Passphrases utilize curated wordlists inspired by the Electronic Frontier Foundation (EFF) large wordlist, ensuring words are distinct, easy to spell, and free from offensive terms.' },
  { id: 'brute-force-resistance', question: 'How long would it take a supercomputer to crack a 100-bit password?', answer: 'Cracking a 100-bit password would require testing 2^100 combinations, a computational task that would take billions of years using all combined supercomputers on Earth.' }
];

const strongPassExplainer = `
# How Strong Password Generator Works

The Strong Password Generator creates high-entropy credentials locally using the browser Cryptographically Secure Pseudorandom Number Generator (\`crypto.getRandomValues\`).

## Information Entropy & Strength Ratings
The theoretical strength of a password generated uniformly at random is measured in bits of Shannon entropy:
$$\\text{Entropy} = L \\times \\log_2(N)$$
where $L$ is the credential length and $N$ is the total pool of eligible characters. For instance:
- **Length 12 over 62 alphanumeric characters:** $12 \\times \\log_2(62) = 71.45\\text{ bits}$ (Good)
- **Length 16 over 94 ASCII printable characters:** $16 \\times \\log_2(94) = 104.87\\text{ bits}$ (Very Strong)
- **6 words chosen from a 7,776-word dictionary:** $6 \\times \\log_2(7776) = 77.55\\text{ bits}$ (Good)

Passwords with entropy $\\ge 100\\text{ bits}$ are mathematically invulnerable to offline dictionary or GPU brute-force attacks across billions of years.

## Rejection Sampling & Zero Modulo Bias
A common security vulnerability in naive password generators is utilizing the modulo operator (\`rand % poolSize\`), which creates modulo bias when the random integer range is not an exact multiple of the pool size. Our implementation applies rejection sampling: any raw random integer exceeding the largest whole multiple of the pool size is discarded and sampled again, ensuring an identical mathematical probability for every character.

## Guaranteed Character Distribution
When multiple character sets (uppercase, lowercase, digits, symbols) are checked, the generator guarantees that at least one character from each category is included. All characters are subsequently scrambled using the Fisher-Yates shuffle driven by the same CSPRNG source.
`;

writeContent('strong-password-generator', strongPassFaqs, strongPassExplainer);

// 19. ADDRESS GENERATOR
const addressFaqs = [
  { id: 'are-generated-addresses-real-places', question: 'Are generated addresses verified physical locations?', answer: 'No. Addresses are assembled algorithmically from bundled geographic databases using valid postal code formats and regional naming conventions. Any coincidence with real residential or commercial premises is unintended.' },
  { id: 'do-us-zip-codes-match-states', question: 'Do US ZIP codes correspond to the generated state?', answer: 'Yes. The generator checks a state-to-ZIP prefix lookup table so that California addresses receive 90001–96162, New York gets 10001–14925, and Texas gets 75001–79999.' },
  { id: 'supported-international-countries', question: 'Which countries are supported?', answer: 'The generator supports the United States, United Kingdom (correct outward/inward postcode formats), Canada (FSA LDU pattern), Australia, and India (6-digit PIN codes).' },
  { id: 'exporting-address-lists', question: 'Can I export addresses to CSV or JSON?', answer: 'Yes. You can instantly export up to 50 addresses at a time to comma-separated CSV or structured JSON format.' },
  { id: 'can-i-use-for-shipping-or-checkout', question: 'Can I use these addresses for actual shipping or orders?', answer: 'Strictly no. These addresses are intended solely for development testing and design mockups. Never use them for real billing, shipping, or government submissions.' },
  { id: 'uk-postcode-formatting-rules', question: 'How are UK postcodes validated?', answer: 'UK postcodes follow royal mail structural conventions consisting of an outward code area and district, followed by an inward sector and unit code (e.g., NW1 6XE).' },
  { id: 'deterministic-reproducibility', question: 'Can I generate consistent addresses across tests?', answer: 'Yes. Supplying a numeric seed generates identical address lists across multiple browser sessions, enabling reliable test fixtures.' },
  { id: 'street-naming-variety', question: 'What variety of street names and types are generated?', answer: 'The engine combines common regional thoroughfare names with appropriate street types (Avenue, Boulevard, Road, Lane, Way, Crescent) for realistic aesthetics.' }
];

const addressExplainer = `
# How Address Generator Works

The Address Generator creates syntactically valid placeholder addresses across multiple countries for user interface prototyping, form validation testing, and database population.

## Regional Formatting Standards
Instead of producing random text strings, this tool applies geographic formatting rules tailored to each country:
- **United States:** Follows the USPS standard \`Street, City, State ZIP\`. Crucially, ZIP codes are constrained by state-specific postal prefix ranges. For example, a California address will strictly receive a 5-digit ZIP within the 90001–96162 range, while New York receives 10001–14925, and Texas receives 75001–79999.
- **United Kingdom:** Uses the British alphanumeric postcode structure (\`Outward District + Inward Unit\`, such as \`NW1 6XE\` or \`M1 4ET\`) paired with authentic municipality and county pairings.
- **Canada:** Follows Canada Post Forward Sortation Area (FSA) and Local Delivery Unit (LDU) conventions (\`A1A 1A1\`).
- **Australia & India:** Adheres to Australian 4-digit state postal bands (e.g. 2000 for Sydney NSW, 3000 for Melbourne VIC) and Indian 6-digit Postal Index Numbers (PIN codes).

## Safety and Testing Ethics
Generated addresses are explicitly intended as non-functional mock data for software staging environments, layout mockups, and database testing. They are not physical delivery points and should never be used for real order processing, identity registration, or legal paperwork.
`;

writeContent('address-generator', addressFaqs, addressExplainer);

// 20. ALPHABETICAL ORDER SORTER
const sorterFaqs = [
  { id: 'how-does-natural-numeric-sorting-work', question: 'What is natural numeric sorting?', answer: 'Standard alphabetical sorting places "10" before "2". Natural sorting treats embedded numbers as quantities so that 2 comes before 10.' },
  { id: 'stable-sorting-guarantee', question: 'Is the sorting algorithm stable?', answer: 'Yes. When items compare equal (for instance, case-insensitive duplicates like "Apple" and "apple"), their original relative order is strictly preserved.' },
  { id: 'how-does-duplicate-removal-work', question: 'How does duplicate removal handle letter casing?', answer: 'When duplicate removal is enabled with case-insensitivity, the tool keeps the very first occurrence found in the list and removes subsequent variants.' },
  { id: 'sorting-by-last-name-or-word', question: 'Can I sort a list of full names by last name?', answer: 'Yes. Enabling "Sort by Last Word" extracts the trailing word of each entry (such as the surname) to collate names alphabetically.' },
  { id: 'delimiters-supported', question: 'What input delimiters can I use?', answer: 'You can split items by line breaks, commas, semicolons, whitespace, tabs, or a custom delimiter string.' },
  { id: 'unicode-character-collation', question: 'Does the sorter handle accented letters and non-English alphabets?', answer: 'Yes. Collation is powered by Intl.Collator which respects international language collation rules, correctly grouping accented and non-Latin characters.' },
  { id: 'idempotency-guarantee', question: 'Is sorting idempotent?', answer: 'Yes. Sorting an already sorted list produces the identical list without alterations, verified by automated fast-check property testing.' },
  { id: 'sorting-direction-options', question: 'Can I reverse the sort order?', answer: 'Yes. You can switch between Ascending (A to Z, lowest to highest) and Descending (Z to A, highest to lowest) with a single click.' }
];

const sorterExplainer = `
# How Alphabetical Order Sorter Works

The Alphabetical Order Sorter organizes lists of words, names, citations, and numbers into ordered sequences using international Unicode Collation via \`Intl.Collator\`.

## Natural Number Sorting vs Binary Sorting
Standard binary ASCII sorting compares character codepoints sequentially. In standard ASCII ordering, \`"10"\` sorts before \`"2"\` because the character \`'1'\` precedes \`'2'\`. When **Natural Numbers** is enabled, numeric sequences inside text strings are parsed as discrete numerical magnitudes, ordering \`2\` before \`10\` naturally as humans expect.

## International Collation & Case Sensitivity
The sorter relies on the native ECMAScript Internationalization API (\`Intl.Collator\`). Rather than performing simple uppercase transformations that break accented characters (like \`é\` or \`ü\`), the collator applies standard linguistic rules. Case-insensitive mode treats letters with identical base glyphs as equivalent while preserving original capitalization.

## Stable Sorting & Deduplication
- **Algorithm Stability:** JavaScript's sorting implementation preserves the original relative position of items that evaluate to equal comparison values.
- **Duplicate Removal:** When deduplication is active, the engine tracks seen keys in a set. It retains the very first occurrence of an item and discards subsequent duplicates, reporting both total item count and removed duplicate counts live.
- **Sort by Last Word:** Extracts the final token of each line to alphabetize lists of people's full names by surname effortlessly.
`;

writeContent('alphabetical-order-sorter', sorterFaqs, sorterExplainer);

// 21. EMI CALCULATOR
const emiFaqs = [
  { id: 'how-is-reducing-balance-emi-calculated', question: 'How is reducing-balance EMI calculated?', answer: 'Reducing-balance EMI uses the standard financial formula: EMI = [P × r × (1+r)^n] / [(1+r)^n - 1], where P is principal, r is the monthly interest rate (annual rate / 12 / 100), and n is the tenure in months.' },
  { id: 'reducing-balance-vs-flat-rate', question: 'What is the difference between reducing balance and flat rate?', answer: 'In flat-rate loans, interest is charged on the original principal for the entire loan duration, resulting in a substantially higher effective interest cost compared to a reducing-balance loan of the same nominal rate.' },
  { id: 'indian-number-system-lakh-crore', question: 'How does the Indian Lakh / Crore numbering system work?', answer: 'When Indian Rupee (INR) is selected, figures are grouped in the South Asian format: 1,00,000 (1 Lakh) and 1,00,00,000 (1 Crore) using the en-IN formatting locale.' },
  { id: 'can-i-download-the-schedule', question: 'Can I download the month-by-month repayment schedule?', answer: 'Yes. You can export the complete repayment schedule as a CSV spreadsheet detailing principal, interest, and outstanding balance for every installment.' },
  { id: 'zero-interest-emi', question: 'Does this calculator support 0% interest no-cost EMIs?', answer: 'Yes. If the interest rate is set to 0%, the monthly EMI simplifies exactly to Principal divided by tenure without division-by-zero errors.' },
  { id: 'final-installment-rounding-adjustment', question: 'Why is the final monthly EMI sometimes a few cents different?', answer: 'Because monthly payments are rounded to two decimal places, small fractional cent differences accumulate over decades. The final payment is adjusted to settle the remaining balance to exactly zero.' },
  { id: 'principal-vs-interest-breakdown', question: 'How does the principal-to-interest ratio change over time?', answer: 'Early payments consist primarily of interest charges because the outstanding principal balance is at its highest. As principal is paid down, subsequent interest charges shrink steadily.' },
  { id: 'arbitrary-precision-arithmetic', question: 'How does this tool eliminate financial rounding errors?', answer: 'Every calculation is processed using decimal.js with half-up rounding, eliminating IEEE 754 floating point arithmetic inaccuracies.' }
];

const emiExplainer = `
# How EMI Calculator Works

The Equated Monthly Installment (EMI) Calculator models loan amortizations under reducing-balance and flat-rate credit structures using arbitrary-precision decimal arithmetic.

## Reducing Balance Formula
For standard mortgages, auto loans, and personal financing, the reducing balance monthly installment is computed as:
$$\\text{EMI} = \\frac{P \\times r \\times (1 + r)^n}{(1 + r)^n - 1}$$
where:
- $P$ is the principal loan amount.
- $r = \\frac{\\text{Annual Interest Rate}}{12 \\times 100}$ represents the periodic monthly interest rate.
- $n = \\text{tenure in months}$.

## Flat Rate Mode
In retail consumer electronics or vehicle dealer financing, lenders occasionally advertise "flat rate" interest. In flat-rate loans, interest is computed against the entire original principal regardless of ongoing repayments:
$$\\text{EMI}_{\\text{flat}} = \\frac{P + \\left(P \\times \\frac{\\text{Rate}}{100} \\times \\text{Years}\\right)}{n}$$
Our tool labels this mode explicitly to help borrowers identify the substantially higher effective interest cost of flat loans compared to diminishing balance financing.

## South Asian (en-IN) Number Formatting
When INR (₹) is selected, numeric figures format according to South Asian grouping conventions: the rightmost three digits are grouped together, followed by pairs of two digits (e.g. ₹ 1,00,000 for 1 Lakh and ₹ 1,00,00,000 for 1 Crore).

## Amortization Schedule Integrity
Each month, interest is calculated on the remaining balance: $\\text{interest} = \\text{round}(\\text{balance} \\times r, 2)$, and principal repayment is $\\text{EMI} - \\text{interest}$. The final payment adjusts by the few accumulated fractional cents to guarantee the ending balance is exactly $0.00$.
`;

writeContent('emi-calculator', emiFaqs, emiExplainer);

// 22. WIFI QR CODE GENERATOR
const wifiFaqs = [
  { id: 'how-do-wifi-qr-codes-work', question: 'How do Wi-Fi QR codes connect devices automatically?', answer: 'The QR code encodes a standard ZXing Wi-Fi configuration payload (WIFI:T:...;S:...;P:...;;). When scanned with iOS Camera or Android, the device automatically parses the SSID and credentials to connect.' },
  { id: 'is-my-password-stored-or-transmitted', question: 'Is my network password saved or sent over the internet?', answer: 'Never. The QR code is generated 100% locally in your web browser. Note, however, that anyone who physically scans the code can view your network password in plain text.' },
  { id: 'escaping-special-characters', question: 'How are special characters in SSIDs and passwords handled?', answer: 'In accordance with the ZXing Wi-Fi QR specification, characters including colons, semicolons, commas, and backslashes are escaped with a preceding backslash.' },
  { id: 'print-friendly-wifi-cards', question: 'Can I print a guest Wi-Fi card to display?', answer: 'Yes. Use the "Print Guest Card" button to trigger a clean printable layout formatted specifically for tabletop or wall display.' },
  { id: 'hidden-networks-support', question: 'Does this work for hidden Wi-Fi networks?', answer: 'Yes. Enabling the "Hidden Network" checkbox appends H:true to the configuration payload so devices scan for non-broadcasting SSIDs.' },
  { id: 'wpa3-and-wpa2-compatibility', question: 'Are modern WPA3 networks supported?', answer: 'Yes. Modern mobile operating systems recognize the standard T:WPA token for all WPA, WPA2, and WPA3 Personal networks.' },
  { id: 'open-unencrypted-networks', question: 'Can I generate a QR code for open networks without a password?', answer: 'Yes. Selecting the "None / Open" security option omits the password field and sets T:nopass, allowing guests to join open Wi-Fi with one tap.' },
  { id: 'vector-svg-vs-png-export', question: 'What is the advantage of downloading SVG over PNG?', answer: 'SVG is an infinitely scalable vector format that ensures sharp, pixel-perfect printing on posters and signage at any physical print size.' }
];

const wifiExplainer = `
# How Wi-Fi QR Code Generator Works

The Wi-Fi QR Code Generator translates wireless network credentials into standardized barcode payloads recognized by iOS, Android, and modern camera scanners.

## The ZXing Wi-Fi Payload Standard
The generated QR code contains a structured payload formatted according to the ZXing protocol:
\`\`\`text
WIFI:T:<WPA|WEP|nopass>;S:<ssid>;P:<password>;H:<true|false>;;
\`\`\`
- **Authentication (\`T\`):** Represents the encryption standard (\`WPA\` for WPA/WPA2/WPA3, \`WEP\`, or \`nopass\`).
- **Network Name (\`S\`):** The Service Set Identifier (SSID).
- **Password (\`P\`):** The network pre-shared key.
- **Hidden Network (\`H\`):** Included only when the network does not broadcast its beacon.

## Delimiter Escaping Rules
Because semicolons (\`;\`), colons (\`:\`), and backslashes (\`\\\`) serve as protocol delimiters, any occurrence of these characters inside the SSID or password is escaped with a backslash. For example, an SSID named \`Home;Net\` and password \`p:ss\\word\` are serialized as \`S:Home\\;Net;P:p\\:ss\\\\word;;\`. Additionally, strings containing purely hexadecimal characters are wrapped in quotation marks to prevent misinterpretation as raw WEP keys.

## Client-Side Security & Plaintext Caveat
The QR code is generated 100% locally in your browser using client-side JavaScript. No network parameters are sent across the internet. However, because QR codes are an unencrypted visual representation, anyone with physical access to scan the code can extract the plain text password. For sensitive environments, place printed cards in controlled guest reception areas.
`;

writeContent('wifi-qr-code-generator', wifiFaqs, wifiExplainer);

// 23. WORD AND CHARACTER COUNTER
const wordFaqs = [
  { id: 'how-are-reading-and-speaking-times-estimated', question: 'How are reading and speaking durations calculated?', answer: 'Silent reading speed is computed at 238 words per minute (standard collegiate benchmark), while conversational speaking time is calculated at 150 words per minute.' },
  { id: 'keyword-density-and-stop-words', question: 'What is keyword density and how does the stop-word filter work?', answer: 'Keyword density measures the percentage frequency of a word relative to total text words. Enabling the stop-word filter excludes common functional words (such as "the", "and", "is") to reveal primary topical keywords.' },
  { id: 'grapheme-cluster-character-counting', question: 'How are compound emojis and accented characters counted?', answer: 'Characters are evaluated using Intl.Segmenter grapheme clusters so that multi-codepoint emojis (like 👨‍👩‍👧‍👦) and combining accent sequences count accurately as single characters.' },
  { id: 'hyphenated-words-rule', question: 'Are hyphen-joined words counted as one word or two?', answer: 'Hyphenated words (such as "well-known") are counted as a single word token, matching standard Microsoft Word and Google Docs conventions.' },
  { id: 'performance-on-large-manuscripts', question: 'Can this tool handle entire novels or essays over 100,000 words?', answer: 'Yes. Text segmentation runs via optimized native Web APIs in linear O(n) time, analyzing large manuscripts within milliseconds without browser freezing.' },
  { id: 'sentence-segmentation-rules', question: 'How are sentence boundaries identified?', answer: 'Sentence segmentation relies on international linguistic rules via Intl.Segmenter, treating abbreviations and introductory interjections (< 3 words) with proper contextual grouping.' },
  { id: 'character-counts-with-vs-without-spaces', question: 'What is the difference between characters with and without spaces?', answer: 'Characters with spaces counts all graphemes including spaces and line breaks. Characters without spaces excludes all Unicode whitespace codepoints.' },
  { id: 'browser-privacy-for-drafts', question: 'Is my unpublished writing safe from cloud logging?', answer: 'Completely safe. The entire counting engine runs strictly within your browser sandbox. No text is ever uploaded to a server, logged, or indexed.' }
];

const wordExplainer = `
# How Word and Character Counter Works

The Word and Character Counter provides deep editorial analytics, reading time metrics, and keyword frequency statistics directly in your web browser.

## Counting Methodology & Grapheme Clusters
Many character counting tools use simple string length properties (\`text.length\`). In JavaScript, UTF-16 surrogates cause compound emojis (e.g. 👋, 🌍, or 👨‍👩‍👧‍👦) to count as two or more characters. This tool employs the modern \`Intl.Segmenter\` API configured for grapheme granularity:
- **Characters (with spaces):** Counts perceived visual glyphs (grapheme clusters). Every compound emoji and newline character counts as exactly 1.
- **Characters (no spaces):** Filters out all Unicode whitespace characters (spaces, non-breaking spaces, tabs, and newlines).
- **Word Counting:** Whitespace-delimited tokens containing at least one Unicode letter (\`\\p{L}\`) or number (\`\\p{N}\`). Following Microsoft Word and Google Docs conventions, hyphen-joined words (e.g., \`well-known\`) are parsed as single word tokens.
- **Sentence Segmentation:** Uses linguistic boundary heuristics where short introductory phrases (<3 words ending in punctuation) attach cleanly to the subsequent clause.

## Reading and Speaking Velocities
- **Silent Reading Velocity:** Calculated at 238 words per minute, the empirical average for adult readers established in psychological reading studies.
- **Conversational Speech Speed:** Calculated at 150 words per minute, the standard benchmark for speeches, voiceovers, and presentation rehearsals.

## Keyword Density Analysis
The engine builds an occurrence map of all words. When the stop-word filter is active, over 100 common English functional words (such as \`the\`, \`is\`, \`and\`, \`with\`) are excluded to reveal the top 10 substantive keywords with exact percentage densities.
`;

writeContent('word-and-character-counter', wordFaqs, wordExplainer);

console.log('✅ All 14 sites enriched with 8-12 FAQs and 260-350 word explainers!');

