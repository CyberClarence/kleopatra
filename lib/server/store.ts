import { promises as fs } from "fs";
import path from "path";

/**
 * Tiny KV abstraction for the DEV sync backend (app/api/sync/* routes used by
 * `next dev`). Production traffic goes to the Cloudflare Worker in worker/
 * (api.kleopatra.app, D1-backed) — these routes are a local fallback so the
 * flow works offline without any provider setup.
 *
 * Backends: Upstash Redis REST if configured, else a JSON file under .data/.
 */

type Entry = { value: string; expiresAt: number | null };

interface KV {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
}

class UpstashKV implements KV {
  constructor(private url: string, private token: string) {}

  private async command(cmd: (string | number)[]): Promise<any> {
    const res = await fetch(this.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cmd),
    });
    if (!res.ok) {
      throw new Error(`Upstash error ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    return data.result;
  }

  async get(key: string) {
    const result = await this.command(["GET", key]);
    return result === null ? null : String(result);
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    const cmd: (string | number)[] = ["SET", key, value];
    if (ttlSeconds) cmd.push("EX", ttlSeconds);
    await this.command(cmd);
  }

  async del(key: string) {
    await this.command(["DEL", key]);
  }
}

class FileKV implements KV {
  // SYNC_DATA_DIR is set by the Electron shell (OS user-data folder) so the
  // packaged app never writes inside its own signed bundle.
  private file = path.join(
    process.env.SYNC_DATA_DIR || path.join(process.cwd(), ".data"),
    "sync-store.json"
  );
  private cache: Record<string, Entry> | null = null;
  private writing: Promise<void> = Promise.resolve();

  private async load(): Promise<Record<string, Entry>> {
    if (this.cache) return this.cache;
    try {
      this.cache = JSON.parse(await fs.readFile(this.file, "utf8"));
    } catch {
      this.cache = {};
    }
    return this.cache!;
  }

  private persist() {
    // Serialize writes so concurrent requests don't interleave file writes.
    this.writing = this.writing.then(async () => {
      await fs.mkdir(path.dirname(this.file), { recursive: true });
      await fs.writeFile(this.file, JSON.stringify(this.cache), "utf8");
    });
    return this.writing;
  }

  async get(key: string) {
    const db = await this.load();
    const entry = db[key];
    if (!entry) return null;
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      delete db[key];
      await this.persist();
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    const db = await this.load();
    db[key] = {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    };
    await this.persist();
  }

  async del(key: string) {
    const db = await this.load();
    delete db[key];
    await this.persist();
  }
}

declare global {
  // Survive Next.js dev-mode module reloads.
  var __syncKV: KV | undefined;
}

function createKV(): KV {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return new UpstashKV(url, token);
  return new FileKV();
}

export const kv: KV = globalThis.__syncKV ?? (globalThis.__syncKV = createKV());

export async function getJSON<T>(key: string): Promise<T | null> {
  const raw = await kv.get(key);
  return raw === null ? null : (JSON.parse(raw) as T);
}

export async function setJSON(
  key: string,
  value: unknown,
  ttlSeconds?: number
): Promise<void> {
  await kv.set(key, JSON.stringify(value), ttlSeconds);
}
