# Loading verification — November 18, 2026

Production Vite build, local preview server, cache disabled, Chromium controlled through browser DevTools Protocol. Applied 4× CPU slowdown, 150 ms latency, 200,000 bytes/second download (~1.6 Mbps) and 93,750 bytes/second upload. One controlled navigation:

- DOMContentLoaded: 1,044.5 ms
- Load event: 1,977.5 ms
- First contentful paint: 516 ms (early page paint; not a claim that the full app was interactive then)
- Main JS transfer: 30,542 bytes; vendor: 98,116 bytes; CSS: 9,338 bytes
- Homepage background: 152,222 bytes
- PDF parser and worker: absent from initial network requests; load on PDF preview

Paste Text opened and accepted input under this profile. This is a controlled lab check, not a Lighthouse score, field Core Web Vitals measurement, or a guarantee of remote-server latency. Throttling and cache overrides were reset after testing. Backend cold starts remain separate from page loading.
