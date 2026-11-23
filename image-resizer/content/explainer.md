# How the Image Resizer Works

Resizing photos on the web traditionally required uploading large image files to remote servers, raising privacy risks and introducing network delays. This tool performs 100% of image decoding, bicubic interpolation, and re-encoding directly on your machine.

### Aspect Ratio Calculations

When you resize an image while keeping the aspect ratio locked, the non-adjusted dimension is computed using exact proportional scaling:

$$\text{Target Height} = \max\left(1, \text{round}\left(\frac{\text{Target Width} \times \text{Original Height}}{\text{Original Width}}\right)\right)$$

For example, an image with dimensions of **4000 × 3000 px** scaled to a target width of **1200 px** yields:
$$\text{Target Height} = \frac{1200 \times 3000}{4000} = 900\text{ px}$$

Similarly, scaling by a percentage uses direct multiplier arithmetic:
$$\text{New Dimension} = \max\left(1, \text{round}\left(\frac{\text{Original Dimension} \times \text{Percentage}}{100}\right)\right)$$
A 50% scale of a 4000 × 3000 px photo produces exactly **2000 × 1500 px**.

### High-Fidelity Downscaling

To prevent aliasing and jagged edges when performing substantial downscaling (e.g., from 4K down to a web thumbnail), the canvas engine uses `imageSmoothingQuality = 'high'` with bicubic interpolation. When exporting transparent PNGs to JPEG format, the canvas fills transparent alpha areas with white.

### Standard Digital Canvas Ratios

Modern web publishing frequently calls for standardized aspect ratios: 16:9 widescreen for desktop hero headers and video banners, 4:3 for documentation figures, 1:1 square for catalog avatars and social feeds, and 9:16 vertical for mobile cards. By calculating target dimensions against the original pixel aspect ratio, this tool guarantees distortion-free geometry without stretching or unintended letterboxing.

### Memory Lifecycle & Zero Upload Guarantee

Images are loaded into temporary memory via `createImageBitmap` with automatic EXIF orientation normalization. Once rendered and downloaded, object URLs are promptly released with `URL.revokeObjectURL()` to maintain low browser RAM usage.