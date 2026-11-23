# How Wi-Fi QR Code Generator Works

The Wi-Fi QR Code Generator translates wireless network credentials into standardized barcode payloads recognized by iOS, Android, and modern camera scanners.

## The ZXing Wi-Fi Payload Standard
The generated QR code contains a structured payload formatted according to the ZXing protocol:
```text
WIFI:T:<WPA|WEP|nopass>;S:<ssid>;P:<password>;H:<true|false>;;
```
- **Authentication (`T`):** Represents the encryption standard (`WPA` for WPA/WPA2/WPA3, `WEP`, or `nopass`).
- **Network Name (`S`):** The Service Set Identifier (SSID).
- **Password (`P`):** The network pre-shared key.
- **Hidden Network (`H`):** Included only when the network does not broadcast its beacon.

## Delimiter Escaping Rules
Because semicolons (`;`), colons (`:`), and backslashes (`\`) serve as protocol delimiters, any occurrence of these characters inside the SSID or password is escaped with a backslash. For example, an SSID named `Home;Net` and password `p:ss\word` are serialized as `S:Home\;Net;P:p\:ss\\word;;`. Additionally, strings containing purely hexadecimal characters are wrapped in quotation marks to prevent misinterpretation as raw WEP keys.

## Vector SVG and High-Resolution Printing
Users can download generated barcodes as crisp scalable vector graphics (SVG) or high-resolution PNG bitmaps. Because SVG files scale infinitely without pixelation, graphic designers can embed codes directly into signage, acrylic desk plaques, and tabletop stand cards for coffee shops, offices, and guest suites. The tool also provides a one-click print card button with clean CSS media rules tailored for standard desktop printers.

## Client-Side Security & Plaintext Caveat
The QR code is generated 100% locally in your browser using client-side JavaScript. No network parameters are sent across the internet. However, because QR codes are an unencrypted visual representation, anyone with physical access to scan the code can extract the plain text password. For sensitive environments, place printed cards in controlled guest reception areas.