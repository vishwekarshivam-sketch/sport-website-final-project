# Coverage and known gaps

Capture date: **18 October 2026**. Source: https://gymkhana.iitb.ac.in/sports/.

## Route coverage

All **36 fixed public routes** declared in the published router have rendered HTML, readable text, JSON and local reader pages. There is also an additional girls' GC capture. The route inventory records **14 administrative routes** without visiting them, and a certificate-verification route that requires a real certificate identifier.

The site exposes 14 sports and 5 clubs. All 19 are captured. Complete source content supplements rendered views for tabs, filters, calendars, galleries and expandable sections.

The archived source identifies administrative functionality, but this archive does not contain authenticated backend records, issued private certificates, submitted grievances, or administrative dashboards fetched from the server. No booking, feedback, prediction or other form was submitted.

## Content and assets

- 269 calendar source entries; the initial rendered calendar shows only its selected week.
- 126 public player directory records captured after data loaded.
- 1,102 nonempty yearbook workbook responses. These are response rows, not a count of distinct people.
- Both GC categories and per-sport scores extracted from the published source, plus a timestamped snapshot of the public live-match feed. Live scores can change after capture.
- All five full blog descriptions.
- Original yearbook PDF and workbook, plus text exports of both linked booking guidelines.
- Original sport images, council portraits, logos, yearbook photos that resolved in the settled browser, and blog image downloads. Two Google Drive blog links are mapped to their successfully downloaded files in `asset-aliases.json`.

All saved downloads are checked against their recorded SHA-256 hashes. See `summary.json` and `downloads.json` for counts and sizes.

## Unavailable source resources

1. `/sports/pictures/phone.svg` returns the application's HTML shell instead of an icon. It appears nine times on the SAC page. The archive records the broken reference and does not invent a replacement.
2. The court-status service's `/api/sports` endpoint returns HTTP 404. The public court-status page and table headers are saved, but no working facility feed was available from that endpoint.
3. The feedback service's `/api/feedback/contacts` endpoint returns HTTP 404. The rendered feedback form and its source are preserved; a working recipient feed was unavailable.

The yearbook tries several filename variants before finding a photo. `failed-intermediate-photo-candidates.json` records 141 failed intermediate requests from the early capture; these are not 141 missing final photos. `unavailable-current-resources.json` distinguishes current failures. `unarchived-page-images.json` lists unresolved final image occurrences, including repeated uses of the broken phone icon.

External social profiles, Google Maps embeds, and arbitrary external links were inventoried, not recursively scraped. Yearbook-linked external photos/videos remain discoverable in the workbook and `external-links.json`; only media loaded by the public page or directly linked as a site asset was downloaded. No claim is made to archive entire third-party services or unlinked historical site versions.

## Content issues to review during redesign

- The SAC page contains “Full name” placeholders and a 2024–2025 heading.
- Council pages show season 2026–27, while static GC results identify season 2025–26. Preserve the distinction.
- Blog month labels include 2024 dates while some descriptions refer to 2025 activities. Dates should be editorially verified.
- Some homepage figures are animated, and screenshots/DOM captures can reflect intermediate counter values. Consult supplied source and verify factual counts before publishing new copy.
- Yearbook copy uses an existing ride-service theme. It is preserved as original content, not adopted as the redesign direction.
- Original image resolution, duplicate content and placeholders are preserved. Improving or replacing them is a separate design/editorial decision.

## Reuse limits

This is a content and asset archive, not a fully functional clone. Readable offline pages do not submit forms or replay live interactions. Production booking, court status, feedback, certificates and live scores need deliberate backend integration and validation. Snapshot data should not be used to imply future availability or current permission to book a court.
