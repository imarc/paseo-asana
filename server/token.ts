import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const dir = join(homedir(), ".config", "paseo-asana");
const file = join(dir, "token");

export async function readToken(): Promise<string | null> {
  try {
    const token = (await readFile(file, "utf8")).trim();
    return token || null;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function writeToken(token: string): Promise<boolean> {
  const trimmed = token.trim();
  if (!trimmed) {
    await rm(file, { force: true });
    return false;
  }
  await mkdir(dir, { recursive: true, mode: 0o700 });
  await writeFile(file, trimmed, { mode: 0o600 });
  return true;
}
