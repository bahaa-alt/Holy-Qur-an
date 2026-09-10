/** Encodes a list of topic slugs into the `?topics=` query string value. */
export function encodeTopicsQuery(slugs: readonly string[]): string {
  return slugs.map((s) => encodeURIComponent(s)).join(",");
}

/** Decodes the `?topics=` query string value back into a list of topic slugs. */
export function decodeTopicsQuery(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => decodeURIComponent(v.trim()))
    .filter((v) => v.length > 0);
}
