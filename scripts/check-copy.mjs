import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const root = process.cwd();
const ignored = new Set(["node_modules", "dist", ".git", ".vercel"]);
const textExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".md", ".sql", ".json", ".html", ".toml"]);
const forbidden = /[\u2014\u2013\u2212]/;

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!ignored.has(entry.name)) files.push(...await collect(join(directory, entry.name)));
    } else if (textExtensions.has(entry.name.slice(entry.name.lastIndexOf(".")))) {
      files.push(join(directory, entry.name));
    }
  }
  return files;
}

const failures = [];
for (const file of await collect(root)) {
  const content = await readFile(file, "utf8");
  if (forbidden.test(content)) failures.push(relative(root, file));
}

if (failures.length > 0) {
  console.error(`Found typographic dash characters in:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log("Copy check passed. No em dash, en dash, or minus sign characters found.");
