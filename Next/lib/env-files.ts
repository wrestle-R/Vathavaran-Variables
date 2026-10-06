import type { EnvFile } from "./contracts";

export function groupFilesByDirectory(files: EnvFile[]) {
  const groups = new Map<string, EnvFile[]>();
  for (const file of files) {
    const directory = file.directory || "";
    const group = groups.get(directory) ?? [];
    group.push(file);
    groups.set(directory, group);
  }
  return [...groups].sort(([a], [b]) => a.localeCompare(b)).map(([directory, entries]) => {
    const ordered = [...entries].sort((a, b) => {
      const timestamp = (file: EnvFile) => {
        const value = Date.parse(file.updatedAt || file.createdAt);
        return Number.isFinite(value) ? value : 0;
      };
      return timestamp(b) - timestamp(a) || b.id.localeCompare(a.id);
    });
    return { directory, latest: ordered[0], history: ordered.slice(1) };
  });
}
