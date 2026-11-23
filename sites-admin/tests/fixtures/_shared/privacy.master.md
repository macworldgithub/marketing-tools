## Privacy Policy for {{siteName}}

**Effective Date:** {{effectiveDate}}

At {{siteName}} (available at {{domain}}), we take your privacy seriously. This Privacy Policy describes how we handle information when you visit or use {{toolName}}.

## 1. Client-Side Only Processing

All computations, conversions, and data processing in {{toolName}} happen entirely within your web browser. 

- **No User Data Transmission:** Your inputs, values, files, or calculations are never sent to our servers or any third-party servers.
- **No Remote Storage:** We do not collect, log, store, or transmit any data you enter into the tool.
- **Data Retention:** Once you close or refresh your browser tab, all entered inputs and generated results are cleared from browser memory.

## 2. Cookies and Local Storage

The site itself does not set or use tracking cookies.

{{#if localStorage}}
### Local Storage
We use browser local storage solely to remember non-identifying user interface preferences between visits. Specifically, we store the following keys:
- `{{localStorageKeys}}`

This data remains stored locally on your device and is never transmitted to us. You can clear local storage at any time via your browser settings.
{{/if}}

{{#if ads}}
### Advertising
We may display third-party advertisements to support the operation of this free utility. These advertising partners may use cookies, web beacons, or similar tracking technologies to serve ads based on your prior visits to this website or other sites on the Internet. You can manage your ad personalization settings or opt out of interest-based advertising by visiting [About Ads](https://www.aboutads.info/choices/) or [Network Advertising Initiative](https://www.networkadvertising.org/choices/).
{{/if}}

{{#if analytics}}
### Analytics
We use privacy-respecting analytics to collect aggregated, anonymous traffic metrics (such as page views, referrer sources, and browser types) to understand how visitors use the site. No personal identifiers or calculation inputs are ever tracked or tied to your browsing session.
{{/if}}

## 3. Server Logging

Like virtually all web hosts, the infrastructure hosting {{domain}} may record standard technical server logs. These logs may include your IP address, browser user-agent, requested URL, and access timestamps. These logs are maintained by our hosting provider for infrastructure security, DDoS mitigation, and operational integrity, and are not combined with any calculation data.

## 4. Changes to This Policy

We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated effective date.

## 5. Contact Us

If you have questions or concerns regarding this Privacy Policy, please contact us at:
- **Email:** {{contactEmail}}
- **Website:** {{domain}}

