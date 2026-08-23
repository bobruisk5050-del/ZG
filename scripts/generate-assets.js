#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const IMG_RE = /\.(jpe?g|png|webp)$/i;

function listImages(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => IMG_RE.test(f) && !f.startsWith("."))
    .sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
}

function encodePath(rel) {
  return rel
    .split("/")
    .map((seg, i) => (i === 0 ? seg : encodeURIComponent(seg)))
    .join("/");
}

// --- club ---
const clubDir = path.join(root, "assets", "club");
const clubFiles = listImages(clubDir);

const clubImages = clubFiles.map((file) => {
  const base = file.replace(/\.[^.]+$/, "").toLowerCase();
  const isHero = base === "hero";
  return {
    file,
    src: encodePath(`assets/club/${file}`),
    alt: isHero ? "ZAGA GAME — главное фото клуба" : "ZAGA GAME — фото клуба",
    isHero
  };
});

// hero всегда первым
clubImages.sort((a, b) => (b.isHero ? 1 : 0) - (a.isHero ? 1 : 0));

// --- games ---
const gamesDir = path.join(root, "assets", "games");
const gameFiles = listImages(gamesDir);

const gameImages = gameFiles.map((file) => {
  const base = file.replace(/\.[^.]+$/, "");
  return {
    file,
    src: encodePath(`assets/games/${file}`),
    base
  };
});

const out = `/* Автогенерация by scripts/generate-assets.js — не редактировать вручную */
window.CLUB_IMAGES = ${JSON.stringify(clubImages, null, 2)};
window.GAME_IMAGES = ${JSON.stringify(gameImages, null, 2)};
`;

const outPath = path.join(root, "js", "generated", "club-images.js");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, out, "utf8");

console.log(`OK: ${clubImages.length} club, ${gameImages.length} games → ${path.relative(root, outPath)}`);
