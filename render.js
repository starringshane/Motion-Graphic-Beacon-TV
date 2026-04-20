#!/usr/bin/env node
/**
 * BeaconTV teaser renderer.
 *
 * Captures teaser.html as a sequence of PNG frames at 1080x1920 @ 30fps,
 * then muxes them into an H.264 MP4 with ffmpeg.
 *
 * Usage:
 *   npm install
 *   npm run render        # -> out/beacontv-teaser.mp4
 *
 * Requires: Node 18+, Puppeteer (installed via npm), ffmpeg on PATH.
 */

const path = require("path");
const fs = require("fs");
const { spawnSync } = require("child_process");
const puppeteer = require("puppeteer");

const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;
const DURATION_S = 18;          // must match total animation length in teaser.html
const TOTAL_FRAMES = FPS * DURATION_S;

const ROOT = __dirname;
const OUT_DIR = path.join(ROOT, "out");
const FRAMES_DIR = path.join(OUT_DIR, "frames");
const VIDEO_PATH = path.join(OUT_DIR, "beacontv-teaser.mp4");
const HTML_PATH = "file://" + path.join(ROOT, "teaser.html");

function mkdirp(p) { fs.mkdirSync(p, { recursive: true }); }
function rimraf(p) { if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true }); }

(async () => {
  rimraf(FRAMES_DIR);
  mkdirp(FRAMES_DIR);
  mkdirp(OUT_DIR);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=none"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });

  // Freeze animations on a virtual clock so frames are deterministic.
  const client = await page.target().createCDPSession();
  await client.send("Animation.enable");

  await page.goto(HTML_PATH, { waitUntil: "networkidle0" });

  // Pause the page clock so we can advance frame-by-frame.
  await client.send("Emulation.setVirtualTimePolicy", {
    policy: "pause",
    budget: 0,
  });

  const stepMs = 1000 / FPS;

  for (let i = 0; i < TOTAL_FRAMES; i++) {
    await client.send("Emulation.setVirtualTimePolicy", {
      policy: "pauseIfNetworkFetchesPending",
      budget: stepMs,
    });
    // Wait until the browser reports the virtual budget was spent.
    await new Promise((r) => {
      client.once("Emulation.virtualTimeBudgetExpired", r);
      setTimeout(r, 2000); // safety fallback
    });

    const name = String(i).padStart(5, "0") + ".png";
    await page.screenshot({
      path: path.join(FRAMES_DIR, name),
      type: "png",
      clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
    });

    if (i % 30 === 0) process.stdout.write(`  frame ${i}/${TOTAL_FRAMES}\r`);
  }

  await browser.close();
  console.log(`\nRendered ${TOTAL_FRAMES} frames → ${FRAMES_DIR}`);

  // Mux with ffmpeg.
  const args = [
    "-y",
    "-framerate", String(FPS),
    "-i", path.join(FRAMES_DIR, "%05d.png"),
    "-c:v", "libx264",
    "-profile:v", "high",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    "-crf", "18",
    "-preset", "slow",
    "-vf", `scale=${WIDTH}:${HEIGHT}:flags=lanczos`,
    VIDEO_PATH,
  ];

  console.log("ffmpeg " + args.join(" "));
  const ff = spawnSync("ffmpeg", args, { stdio: "inherit" });
  if (ff.status !== 0) {
    console.error("ffmpeg failed. Is it installed and on PATH?");
    process.exit(ff.status || 1);
  }

  console.log(`\nDone → ${VIDEO_PATH}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
