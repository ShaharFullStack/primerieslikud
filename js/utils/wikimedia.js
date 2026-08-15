/**
 * Builds a stable Wikimedia Commons image URL from a bare filename.
 * Special:FilePath is Wikimedia's own recommended redirect endpoint for
 * external hotlinking: it resolves the file's real hashed storage path
 * server-side, so callers never need to compute/guess the MD5 folder
 * prefix (the fragile "/thumb/c/c5/Name.jpg/300px-Name.jpg" pattern that
 * broke silently whenever a file was renamed or the hash was mistyped).
 */
export function commonsFilePath(filename, width = 320) {
  if (!filename) return '';
  const encoded = encodeURIComponent(filename.replace(/ /g, '_'));
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encoded}?width=${width}`;
}
