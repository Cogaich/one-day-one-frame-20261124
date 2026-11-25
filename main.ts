// main.ts — entry program for news-image-20261124 ("The World in One Day").
// The whole entry is a single poster PNG that ships in this repository
// beside this file. The program's only job is to place an exact copy of
// that PNG at <output>/entry.png, then read the copy back and check it
// matches byte for byte. Node 22, standard library only; nothing is
// fetched, nothing is random, and the output never depends on the clock,
// so every run writes identical bytes.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// The first eight bytes every PNG file starts with.
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function fingerprint(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function loadPoster(folder: string): Buffer {
  const posterPath = join(folder, "entry.png");
  if (!existsSync(posterPath)) {
    throw new Error(`poster missing: ${posterPath}`);
  }
  const bytes = readFileSync(posterPath);
  if (bytes.length === 0) {
    throw new Error("entry.png is empty");
  }
  if (!bytes.subarray(0, PNG_MAGIC.length).equals(PNG_MAGIC)) {
    throw new Error("entry.png is not a PNG file");
  }
  return bytes;
}

function main(): void {
  const repoDir = dirname(fileURLToPath(import.meta.url));
  const poster = loadPoster(repoDir);
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  const targetPath = join(outDir, "entry.png");

  mkdirSync(outDir, { recursive: true });
  writeFileSync(targetPath, poster);

  // Prove the copy is exact before claiming success.
  const written = readFileSync(targetPath);
  if (written.length !== poster.length || !written.equals(poster)) {
    throw new Error("output copy does not match entry.png");
  }
  console.log(
    `wrote ${targetPath} (${poster.length} bytes, sha256 ${fingerprint(poster)})`
  );
}

main();
