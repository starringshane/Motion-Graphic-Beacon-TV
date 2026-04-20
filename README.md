# BeaconTV — Social Teaser (9:16)

A motion-graphic teaser for [BeaconTV](https://streambeacontv.com) — the streaming
home for True Crime, Paranormal, and Horror. Built as a self-contained HTML5
animation at **1080 × 1920 (9:16)** so it drops straight into **Instagram Reels,
TikTok, YouTube Shorts, Facebook Reels, and Pinterest Idea Pins** with no
reframing.

## What's in it

`teaser.html` — the whole teaser. Open it in a browser to preview.

Six scenes, ~18 seconds, looped:

| # | Scene                | Copy                                      |
|---|----------------------|-------------------------------------------|
| 1 | Cold open            | *"Something is out there."*               |
| 2 | Logo reveal          | BeaconTV wordmark + beam sweep            |
| 3 | Genre pillars        | TRUE CRIME / PARANORMAL / HORROR          |
| 4 | Now streaming        | SpeakEasy, Haunted America, Bigfoot       |
| 5 | Devices              | iOS, Android, Apple TV, Android TV, Roku, Web |
| 6 | Call to action       | **Sign up. Tune in.** → `streambeacontv.com/signup` |

Atmosphere is layered in CSS + a lightweight canvas: drifting fog, film grain,
scan lines, a flicker pass, and a vignette. A blood-red REC dot and
`@streambeacontv` handle hold top/bottom throughout so the brand is on-screen
every frame.

## Preview in a browser

```bash
npm run preview
# then open http://localhost:8080/teaser.html
```

Or just double-click `teaser.html`.

## Export to MP4

Renders a frame-accurate, deterministic 1080×1920 @ 30fps H.264 MP4 using
Puppeteer's virtual clock + ffmpeg.

Requirements: Node 18+, ffmpeg on your PATH.

```bash
npm install
npm run render
# -> out/beacontv-teaser.mp4
```

The output is YUV 4:2:0 / H.264 High / faststart — safe for every major social
upload spec.

## Quick capture (no tooling)

If you don't want to install anything, open `teaser.html` in Chrome and use
the browser's built-in screen recorder or QuickTime / OBS at 1080×1920. The
page already locks to that size.

## Editing the copy

Everything lives in `teaser.html`. Each scene is a `<div class="scene sN">`
block; swap the text inline. Scene timings are the `animation-delay` values
on `.s1`–`.s6` — keep total runtime aligned with `DURATION_S` in `render.js`
(currently 18s) if you extend it.
