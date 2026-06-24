import { copyFile, mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";

const rootDir = process.cwd();
const sourceDir = join(rootDir, "public");
const targetDir = join(rootDir, "next-app", "public");

await mkdir(targetDir, { recursive: true });

const entries = await readdir(sourceDir, { withFileTypes: true });
let copied = 0;

for (const entry of entries) {
    if (!entry.isFile()) {
        continue;
    }

    await copyFile(join(sourceDir, entry.name), join(targetDir, entry.name));
    copied += 1;
}

console.log(`Copied ${copied} public assets into next-app/public.`);
