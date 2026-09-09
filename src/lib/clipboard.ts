/**
 * Copies text to the clipboard, falling back to a hidden-textarea +
 * `execCommand("copy")` when the async Clipboard API is unavailable or
 * rejects (e.g. an insecure context, or a browser without permission).
 * Shared by every "copy" action in the app (AyahActions, CiteButton) so
 * there's exactly one fallback implementation to get right.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}
