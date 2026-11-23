# How Image to PDF Converter Works

The Image to PDF Converter compiles individual image files into a single, multipage PDF document using the pure JavaScript library `pdf-lib` executing directly in the client browser.

## Typographic Geometry & Placement
PDF coordinates are defined in typographic points, where 1 inch equals exactly 72 points:
- **A4 Standard:** 595.28 × 841.89 pt (210 × 297 mm)
- **US Letter:** 612.00 × 792.00 pt (8.5 × 11.0 in)
- **Fit to Image:** Creates a custom page bounding box matching the image pixel dimensions plus specified margin padding.

When calculating layout in **Contain** mode, available printable width and height are determined by subtracting twice the margin parameter:
```text
availWidth = pageWidth - (2 * margin)
availHeight = pageHeight - (2 * margin)
scale = Math.min(availWidth / imageWidth, availHeight / imageHeight)
```
The image is drawn at `x = margin + (availWidth - drawnWidth) / 2` and `y = margin + (availHeight - drawnHeight) / 2`, centering the photograph on the page without distorting its natural aspect ratio.

## Binary Embedding
JPEG and PNG image streams are embedded into the PDF document as discrete XObject image dictionaries. Non-standard or raw graphic buffers are first normalized into standard PNG streams using HTML5 Canvas before document inclusion.

## Document Customization and Print Readiness
Users can arrange input images into sequential pages, set landscape or portrait orientations per document, and adjust margin spacing to suit physical binder borders (18 pt for compact margins or 36 pt for standard half-inch print margins). Because image streams retain their intrinsic color profiles without re-sampling, generated PDFs maintain high-resolution sharpness suitable for formal government applications, academic course submissions, and professional printing.

## Local Execution
All document assembly occurs within browser WebAssembly and JavaScript threads. No documents, invoices, or ID scans are ever uploaded to a cloud server, ensuring full regulatory compliance and personal privacy.