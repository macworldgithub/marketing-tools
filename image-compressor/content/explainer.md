# How Image Compressor Works

The Image Compressor reduces image file weight directly in your web browser using HTML5 Canvas rendering and browser-native lossy codecs.

## Compression Mechanics
When an image is dropped onto the tool, it is decoded into an in-memory bitmap using `createImageBitmap({ imageOrientation: 'from-image' })`. This API automatically applies orientation transforms specified in camera EXIF tags so photos never appear sideways.

The image is drawn to an off-screen `HTMLCanvasElement`. If optional dimension clamping is active (such as capping width at 2048 pixels), the canvas scales the image proportionally using high-quality bi-cubic interpolation. The canvas is then serialized using `canvas.toBlob(callback, format, quality)`:
- **JPEG Encoding:** Uses discrete cosine transform (DCT) quantization across 8×8 pixel blocks.
- **WebP Encoding:** Uses predictive intra-frame compression and variable-size macroblocks, often outperforming JPEG by 25–35% at identical perceived visual quality.

## Strict Size Protection
A frequent pitfall of automated compression is re-encoding an already heavily compressed image at a higher quality, resulting in an output file larger than the original. Our engine compares the post-compression byte count against the source file. If the output is not strictly smaller, the original file is preserved and flagged clearly.

## Percentage Savings and Batch Export
File size savings are measured as a direct percentage reduction: $\text{Savings} = \left(\frac{\text{Original Bytes} - \text{Compressed Bytes}}{\text{Original Bytes}}\right) \times 100$. For instance, reducing a 2,000,000-byte digital camera capture down to 500,000 bytes achieves an exact 75.0% file weight reduction. Users compressing dozens of images can download compressed assets individually or package the entire queue into an uncompressed ZIP container using fast client-side Deflate compression.

## Metadata Stripping & Privacy
Canvas serialization generates a pure pixel raster stream that contains zero EXIF metadata. Embedded camera serial numbers, lens profiles, exposure details, and GPS coordinates are stripped completely before download. No image bytes are sent over the network.