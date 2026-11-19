# Resume export and recovery checks

## Verified in this update

- Native Safari on the development Mac: saved and inspected a three-page browser PDF with accented, Devanagari and Chinese names; all 55 long test entries preserved.
- Browser viewport checks at 320×740, 402×874, 874×402, 820×1180 and 1512×982: no horizontal overflow; mobile export controls stay inside the viewport and above the dock.
- Actual downloaded backup imported after edits: original draft restored, newer work preserved as a recovery version, and restored draft survives reload.
- Backend failure prepares the local print fallback. Browser PDF contains no external images, fonts, scripts, or backend requests.
- Automated fixtures cover HTML escaping, long names, multilingual text, 200 bullets, new metrics/skills/claims, corrupt backups, storage capacity/failure, and stale export protection.
- CI now warms the real template compiler and runs Jake/Deedy text-preservation and Deedy overflow tests; it also runs Simple long-resume/font-error tests and browser backup/outage flows.

## Physical iPhone/iPad sign-off still required

A simulated viewport does not verify iOS Safari or the share sheet. On a physical device:

1. Open the deployed builder, enter a test resume, and scroll through the complete form. Open/close the keyboard and rotate. Verify export controls remain reachable without covering focused fields or the dock.
2. Download Simple and Jake; save/open them in Files. Check first and last entries, page breaks, accents and contact information.
3. Use Browser PDF, choose Save as PDF (or the platform PDF/share action), disable print headers/footers, and check a long multilingual resume. This uses a single-column layout; it does not reproduce Jake/Deedy.
4. Download a backup to Files. Change the draft and import the backup. Confirm that the old draft is restored and newer work is available as a recovery version. Reload and verify persistence.
5. With the app already loaded, disconnect the network and try Browser PDF. Reconnect afterward. Browser-only export does not make AI analysis or a first visit available offline.
6. Compare original text beside AI rewrites. New metrics, selected responsibility/credential claims and selected technical skills require explicit verification before applying. These checks are heuristic and cannot establish factual accuracy.

Do not record this checklist as passed until performed on the actual device. Test data should be fictional.
