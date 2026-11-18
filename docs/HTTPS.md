# Production HTTPS and browser security

The production domain is `https://resumaxer.vercel.app`, attached to the verified Vercel project `resumex`.

## Verified

- Standard certificate-chain and hostname validation succeeds for both the frontend and `resumex-backend-fm1z.onrender.com`. Certificate verification was not bypassed.
- The observed frontend certificate is issued by Google Trust Services and expires on 29 January 2027. The observed backend certificate expires on 20 December 2026. The hosting platforms manage their certificates; these dates will change on renewal.
- HTTP requests redirect to HTTPS with status 308. Vercel already supplies HSTS (`max-age=63072000; includeSubDomains; preload`).
- The production home and builder pages return HTTP 200 with the additional security headers below. Browser loading and navigation work without console errors.

## Applied live

A header-only project routing rule named **Browser security headers** was promoted through the Vercel API. This does not publish the pending local application changes or change destinations, DNS, authentication, certificates, or deployment protection.

| Header | Value |
| --- | --- |
| X-Content-Type-Options | nosniff |
| X-Frame-Options | DENY |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | camera=(), microphone=(), geolocation=() |
| Content-Security-Policy | base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests |

The same policy is recorded in `frontend/vercel.json` for future deployments. Keep project-level and repository policies synchronized when changing them. This is a baseline CSP for framing, base URLs, forms, embedded objects and insecure resource upgrades; it does not impose a comprehensive script-source allowlist.

Vercel route ID: `58faef1c-374f-4ae7-aa77-1869ff590f30`.

Promoted routing version: `1f76c9ae-ecb9-4504-a9b3-88e862aa60c6`.

The staged routing alias was protected by Vercel authentication. Its route definition was inspected through the authenticated API, then verified on the public production domain after promotion. No bypass/share link was created and deployment protection was not disabled.

## Network access limits

HTTPS protects communication on public Wi-Fi, but cannot guarantee reachability on every network. Captive portals, DNS problems, ISP/corporate filtering, incorrect device clocks, or local trust stores can still prevent access. Diagnose the exact browser error and affected network before changing DNS or certificates. A custom domain can help with domain-specific filtering, but cannot guarantee unrestricted access.

References: [Vercel SSL](https://vercel.com/docs/domains/working-with-ssl), [Vercel HTTPS redirects](https://vercel.com/docs/cdn-security/encryption).
