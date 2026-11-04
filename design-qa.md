# Karbeam visual and function check

**Result: passed with documented scope limits.** Checked against the live `https://iamjapinder.com/create?mode=video` source. No source video was generated and no files were uploaded to the source service.

## Visual comparison

| Area | Source | Karbeam | Result |
|---|---|---|---|
| Typography | Clash Grotesk display face with Poppins UI | Source font files bundled locally; Korean glyphs fall back to system Korean sans | Match in Latin face and hierarchy; Korean remains legible |
| Spacing and layout | Dark editor, pill navigation, promo badge, centered heading, vertical mode rail, photo/description area, setting chips, green CTA | Same major component order and compact editor structure, adapted to Korean wording and Karbeam identity | Close match; vehicle name and price fields add some editor height |
| Colors | Near-black background, charcoal panels, muted text, green accent | Same dark palette and green actions | Match |
| Images and assets | Source preview photos, no image at initial upload state | Local image preview from selected photos; no remote car artwork in the application | Functional replacement |
| Copy | English labels and instructions | Korean labels and instructions | Translated |

The source desktop view was inspected at 1265×715. The source mobile reference screenshot is `qa/screenshots/source-mobile-390x844.png`. Karbeam desktop capture is `qa/screenshots/deployed-video-maker.png`; the generated video preview is `qa/screenshots/deployed-video-preview.png`; the clean mobile capture is `qa/screenshots/deployed-mobile.png`. The browser's requested 390×844 override reported a 433×937 CSS viewport, with no horizontal overflow.

## Functional verification

- Uploaded two real car photos from the source site's public sample assets to the deployed Karbeam page only. The browser decoded them at 1920×1440 and 1920×2560; the application code uses object URLs and makes no photo-upload request.
- Entered vehicle name, price, and caption; rendered 10 seconds at 720p, 9:16 from two photos.
- Generated video appeared in the preview player and reported `readyState: 4`; playback advanced to 1.1 seconds.
- Downloaded `Porsche-911-shortform.webm`; file size was 2,252,696 bytes and its EBML/WebM signature was `1a45dfa3`.
- GitHub Actions build and Pages deploy both succeeded for commit `c89a15a`.

## Scope limits

Karbeam renders a real browser-encoded slideshow with pan/zoom, transitions between photos, and optional vehicle text. It does not connect to the source service's generative AI engine, account or credit system, or music/voice services. Output is WebM in browsers with MediaRecorder support.

