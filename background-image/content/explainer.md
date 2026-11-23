# How Background Image Maker Works

The Background Image Maker synthesizes crisp, custom background graphics, desktop wallpapers, and social media backdrops entirely within your browser using the HTML5 Canvas API.

## Algorithmic Generation Modes
Instead of downloading heavy static stock imagery across a network, this utility renders procedural visuals locally on your hardware:
- **Linear & Radial Gradients:** Color transitions are interpolated mathematically across directional vector angles using Canvas 2D linear gradient contexts. Every color stop and angular offset is mapped directly to standard CSS syntax for immediate export to web stylesheets.
- **Geometric Texture Patterns:** Crisp vector-style polka dots, structural wireframe grids, and diagonal hatch stripes are drawn with customizable pixel steps and transparency values.
- **Photo Backdrops with Gaussian Blur:** If you choose to supply your own local photo, it is loaded directly into browser memory using `createImageBitmap`. You can apply adjustable Gaussian blur radii and semi-transparent dark or colored scrims to create high-contrast backdrop images ideal for text overlay.

## Technical Specifications & Canvas Boundaries
The engine accommodates standard display presets—such as Full HD (1920×1080), 2K QHD (2560×1440), 4K UHD (3840×2160), and phone portrait aspect ratios (1080×1920)—while permitting custom dimensions up to 8192 pixels per side. Hardware-accelerated GPU blitting ensures that rendering 4K buffers takes under 100 milliseconds without UI lag.

## Dual Output: CSS Stylesheets and Bitmap Downloads
Designers can toggle between copying clean CSS gradient code blocks directly into their stylesheets and downloading high-resolution PNG or JPEG image assets. Because the color stops map cleanly to W3C CSS specifications, web developers can test visual layouts in the live canvas before committing identical color tokens to their CSS or Tailwind design system.

## Privacy & Security
Zero external network calls are made. No telemetry, analytics, or image bytes ever leave your local machine, guaranteeing complete confidentiality for personal photographs and proprietary brand palettes.