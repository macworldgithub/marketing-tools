# How the QR Code Generator Works

Quick Response (QR) codes are two-dimensional matrix barcodes invented in 1994 by Masahiro Hara of Denso Wave. They encode alphanumeric data across a square grid of dark and light modules organized with position detection patterns in three corners.

### Reed–Solomon Error Correction

QR codes employ Reed–Solomon algebraic error-correcting codes, enabling optical scanners to read data even if the code is torn, smudged, or partially occluded:
- **Level L (Low):** ~7% data recovery. Produces the smallest, simplest matrix.
- **Level M (Medium):** ~15% data recovery. The standard default for web links and marketing.
- **Level Q (Quartile):** ~25% data recovery. Used in industrial or high-wear environments.
- **Level H (High):** ~30% data recovery. Essential when placing a logo in the center.

### Optical Contrast & The "Inverted" Trap

A frequent mistake in graphic design is inverting QR codes (placing light modules on a dark background). The ISO/IEC 18004 specification defines QR codes with dark foreground modules on a light background. 

Many physical barcode scanners and older Android/iOS camera apps look strictly for dark finder patterns surrounded by light quiet zones. This generator evaluates the WCAG relative luminance contrast ratio:
$$\text{Contrast Ratio} = \frac{L_1 + 0.05}{L_2 + 0.05}$$
If your colors fall below a **4.5:1 ratio** or if foreground luminance exceeds background luminance, a visible warning appears to prevent printing unreadable codes.

### Direct Static Encoding vs. Redirect Traps

Many commercial QR generators encode a tracking link that redirects to your site—and breaks when you cancel their subscription. This tool creates **100% static, direct QR codes**. Your destination URL or contact data is encoded directly into the matrix with zero middlemen and zero expiration.