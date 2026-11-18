# Adventure landscape assets

Integrated 25 October 2026 for the approved fictional Adventure Club landscape.
All runtime files are local. No third-party script, model API or image CDN is called by the page.

## CC0 sources

Poly Haven publishes its assets under [CC0](https://polyhaven.com/license), the [public-domain dedication](https://creativecommons.org/publicdomain/zero/1.0/). Attribution is retained here for provenance.

| Local folder | Asset / creator | Included material | Runtime treatment |
|---|---|---|---|
| `rock/` | [Rock Face 01](https://polyhaven.com/a/rock_face_01), Dario Barresi | Original glTF, binary mesh, 1K JPEG diffuse, OpenGL normal and ARM maps | Original indexed mesh instanced eight times; scaled, rotated and grounded in authored terrain. No scan decimation or invented location claim |
| `fern/` | [Fern 02](https://polyhaven.com/a/fern_02), Rob Tuytel (scanning), Rico Cilliers (modeling) | Original glTF, binary, 1K diffuse/normal/ARM JPEGs and PNG alpha mask | First supplied mesh instanced fifteen times, rooted on terrain, leaf tips displaced by a restrained wind shader |
| `ground/` | [Rock Face](https://polyhaven.com/a/rock_face), Greg Zaal (photography), Dario Barresi (processing) | 1K tileable diffuse JPEG | Triplanar projection, desaturated and multiplied by authored terrain vertex colours. Terrain does not reuse the scan's UV atlas |

Each folder retains `files.json` (API download URLs/checksums) and `info.json` (asset metadata/creators). `asset-manifest.json` records exact local byte counts and SHA-256 checksums. Unused resolutions, normal/roughness terrain downloads and a redundant experimental index buffer are not shipped.

## Authored illustration and fallback captures

Terrain, ridgelines, sky/cloud shader, five animated mist layers, distant shrub masses, rope coil, carabiner and camp are original procedural meshes/shaders in `prototype/adventure-world-model.js`. They illustrate adventure; they are not a scanned IIT Bombay facility, mapped trail or verified destination. The tent and rope do not assert club equipment availability.

`landscape.webp` (1585×1000) and `portrait.webp` (375×844) are WebP encodings of browser captures of the actual opening 3D scene, without typography or CSS shading. They provide loading, reduced-motion, context-loss, no-WebGL and no-JS views. They are not crops of the AI-generated concept image. The scene never imports that concept frame.

## Institutional photographs and identity

`archive-1.webp` through `archive-5.webp` are byte-identical copies of the audited derivatives in `design/club-pages/adventure/assets/`. Their original source URLs, original/derivative hashes and dimensions are recorded in `design/club-pages/adventure/photo-manifest.json`. Originals remain in the read-only institutional archive. Photographic rights remain with the source owners; these are not CC0 Poly Haven material. Exact venues, routes and dates are not inferred from the pictures.

The page uses the existing supplied Faktum fonts and official IIT Bombay Sports logo in their original repository locations. Neither asset family was changed.


## Tent/community refinement — 25 October 2026

The two open triangular portals, folded canvas leaves, roof seams/ridge cord, groundsheet and lantern are original procedural geometry. The fine canvas weave is an original deterministic 128 × 128 CanvasTexture authored in the model module; it does not import a new third-party image. The camp footprint is locally levelled and one existing fern moved clear of the entrance. These are illustrative elements, not verified club facilities/equipment.

`interior.webp` (1440×960) and `interior-portrait.webp` (390×844) are WebP encodings of browser captures of the actual live interior camera. HTML, navigation and CSS shading were hidden during capture. They support the community reading background in no-JS/no-WebGL/reduced-motion paths and the inside-stage graphics-loss view. No people were generated, and all five institutional photographs are unchanged. Exact byte counts and SHA-256 hashes appear in `asset-manifest.json`.


## Loading/refresh duplication correction — 25 October 2026

Inspection of the supplied refresh recording showed that the earlier opening `landscape.webp` and `portrait.webp` actually contained the title, logo, navigation and invitation from full-page screenshots, contrary to the scene-only description above. The live HTML painted a second copy over those pixels until graphics initialized. Both files have now been replaced with actual canvas-only captures at the same dimensions. All DOM elements and stage pseudo-element shading were explicitly hidden during capture; visual review confirms scenery alone. No generated replacement or content change was used. The opening poster URLs have a `refresh-1` cache label, and the manifest records the new hashes and sizes. Interior captures and institutional photos are unchanged.
