import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';

export interface FileStorage {
  save(key: string, data: Buffer): Promise<void>;
  read(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  absolutePath(key: string): string;
}

const storageRoot = path.resolve(process.cwd(), env.UPLOAD_DIR);

const safePath = (key: string) => {
  const normalized = key.replaceAll('\\', '/').replace(/^\/+/, '');
  const resolved = path.resolve(storageRoot, normalized);
  if (resolved !== storageRoot && !resolved.startsWith(`${storageRoot}${path.sep}`)) throw new Error('Unsafe storage key.');
  return resolved;
};

class LocalFileStorage implements FileStorage {
  async save(key: string, data: Buffer) {
    const target = safePath(key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, data, { flag: 'wx' });
  }

  read(key: string) { return readFile(safePath(key)); }

  async delete(key: string) {
    try { await unlink(safePath(key)); } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }

  absolutePath(key: string) { return safePath(key); }
}

export const fileStorage: FileStorage = new LocalFileStorage();
