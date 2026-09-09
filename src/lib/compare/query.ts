/** Encodes a list of Arabic roots into the `?roots=` query string value. */
export function encodeRootsQuery(roots: readonly string[]): string {
  return roots.map((r) => encodeURIComponent(r)).join(",");
}

/** Decodes the `?roots=` query string value back into a list of Arabic roots. */
export function decodeRootsQuery(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => decodeURIComponent(v.trim()))
    .filter((v) => v.length > 0);
}
