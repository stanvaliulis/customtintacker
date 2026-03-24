import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

export function ensureDataDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

export function readJsonFile<T>(filename: string, defaultValue: T): T {
  ensureDataDir();
  const filepath = path.join(DATA_DIR, filename);
  if (!existsSync(filepath)) return defaultValue;
  try {
    return JSON.parse(readFileSync(filepath, 'utf-8'));
  } catch {
    return defaultValue;
  }
}

export function writeJsonFile(filename: string, data: unknown) {
  ensureDataDir();
  writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2));
}
