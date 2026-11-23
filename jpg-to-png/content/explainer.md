# How JPG to PNG Converter Works

The JPG to PNG Converter decodes JPEG raster images locally and re-encodes them into the lossless Portable Network Graphics (PNG) format using the HTML5 Canvas API.

## Technical Realities of Format Conversion
Understanding the differences between lossy and lossless image codecs is crucial when converting files:
1. **The Irreversibility of JPEG Loss:** When an image is saved as a JPEG, a discrete cosine transform discards high-frequency visual information to minimize file size. Converting that file into a PNG cannot reconstruct the discarded frequencies; it simply captures the currently visible pixels into a lossless wrapper.
2. **File Size Expansion:** JPEG compression achieves ratios of 10:1 to 20:1. Because PNG preserves the exact RGB value of every decoded pixel using DEFLATE compression, the resulting PNG is typically 2 to 5 times larger than the input JPEG.
3. **Prevention of Further Degradation:** The primary benefit of converting to PNG is preventing *generation loss*. Editing and re-saving an image as JPEG compounds compression artifacts, whereas editing a PNG preserves quality across successive saves.

## Browser-Side Conversion Flow
When a user selects files, each image is loaded into memory via an `HTMLImageElement` object. An off-screen canvas is dimensioned to the image's intrinsic width and height. The pixel buffer is transferred to the canvas and serialized to an `image/png` blob. Multiple files can be packed into a ZIP archive in memory using `fflate` without server round-trips.

## Transparency and Graphic Design Preparation
While source JPEGs do not support transparent backgrounds, converting them to PNG establishes an RGBA pixel buffer with a 32-bit alpha channel. This format serves as the foundational starting point for graphic designers and digital artists preparing product photos, icons, and logo assets for background extraction, layer compositing, and vector masking in photo editing software. Zero bytes are uploaded to remote servers, safeguarding sensitive commercial imagery.