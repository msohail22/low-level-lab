import { access } from "node:fs/promises";
import { delimiter, join } from "node:path";

export async function which(bin: string): Promise<string | null> {
  const pathEnv = process.env.PATH ?? "";
  for (const dir of pathEnv.split(delimiter)) {
    if (!dir) continue;
    const candidate = join(dir, bin);
    try {
      await access(candidate);
      return candidate;
    } catch {
      // keep looking
    }
  }
  return null;
}
