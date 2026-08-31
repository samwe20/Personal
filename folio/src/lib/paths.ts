const MD_EXT = /\.md$/i;

export function titleFromPath(path: string): string {
  const name = path.split(/[/\\]/).pop() ?? path;
  return name.replace(MD_EXT, "");
}

export function noteIdFromRelative(relativePath: string): string {
  return relativePath.replace(/\\/g, "/").replace(MD_EXT, "").toLowerCase();
}
