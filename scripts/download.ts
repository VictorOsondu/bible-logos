// Downloads pinned sources, checks their SHA-256 hashes and keeps verified copies in data/sources
// so re-seeding (and CI) does not fetch them again.

import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import type { ChapterSource, Source } from './sources';

const CACHE_DIR = path.join(process.cwd(), 'data', 'sources');

const sha256 = (data: Buffer) => crypto.createHash('sha256').update(data).digest('hex');
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class ChecksumError extends Error {}

function readCache(file: string, expected: string): string | null {
  if (!fs.existsSync(file)) return null;
  const data = fs.readFileSync(file);
  if (sha256(data) === expected) return data.toString('utf8');
  console.warn(`  Cached ${path.basename(file)} is corrupt; downloading again.`);
  return null;
}

function verifyAndCache(file: string, data: Buffer, expected: string, what: string): string {
  const actual = sha256(data);
  if (actual !== expected) throw new ChecksumError(`checksum mismatch for ${what}: expected ${expected}, got ${actual}`);
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(file, data);
  return data.toString('utf8');
}

async function download(url: string, maxRetries = 3, quiet = false): Promise<Buffer> {
  for (let attempt = 1; ; attempt++) {
    try {
      if (!quiet) console.log(`  Downloading ${url}${attempt > 1 ? ` (attempt ${attempt}/${maxRetries})` : ''}...`);
      const res = await fetch(url, { signal: AbortSignal.timeout(120000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (error) {
      if (attempt >= maxRetries) throw new Error(`${url}: ${error instanceof Error ? error.message : error}`);
      const delay = attempt * 2000;
      console.warn(`  Attempt ${attempt} for ${url} failed, retrying in ${delay / 1000}s...`);
      await sleep(delay);
    }
  }
}

const stripBom = (text: string) => text.replace(/^﻿/, '');

/** Returns a pinned file's contents, from the local cache or downloaded, after checking its hash. */
export async function fetchSource({ url, sha256: expected }: Source): Promise<string> {
  const file = path.join(CACHE_DIR, `${expected.slice(0, 16)}-${path.basename(new URL(url).pathname)}`);
  const cached = readCache(file, expected);
  if (cached !== null) return stripBom(cached);
  return stripBom(verifyAndCache(file, await download(url), expected, url));
}

/**
 * Returns a translation published as one JSON file per chapter (wldeh/bible-api), assembled into
 * one list of [book, chapter, verse, text] rows. The hash covers the assembled list.
 */
export async function fetchChapters({ base, name, sha256: expected, folders = {} }: ChapterSource, books: { id: number; name: string; chapters: number }[]): Promise<string> {
  const file = path.join(CACHE_DIR, `${expected.slice(0, 16)}-${name}.json`);
  const cached = readCache(file, expected);
  if (cached !== null) return cached;

  const jobs = books.flatMap(b => {
    const folder = b.name.toLowerCase().replace(/ /g, '');
    return Array.from({ length: b.chapters }, (_, i) => ({ book: b.id, url: `${base}/books/${folders[folder] ?? folder}/chapters/${i + 1}.json` }));
  });
  console.log(`  Downloading ${jobs.length} chapters from ${base}...`);
  const results: [number, number, number, string][][] = new Array(jobs.length);
  let next = 0;
  const worker = async () => {
    while (next < jobs.length) {
      const index = next++;
      const { book, url } = jobs[index];
      const { data } = JSON.parse(stripBom((await download(url, 4, true)).toString('utf8'))) as { data: { chapter: string; verse: string; text: string }[] };
      results[index] = data.map(v => [book, Number(v.chapter), Number(v.verse), v.text]);
    }
  };
  await Promise.all(Array.from({ length: 16 }, worker));
  return verifyAndCache(file, Buffer.from(JSON.stringify(results.flat())), expected, `${base} (assembled)`);
}
