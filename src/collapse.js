/**
 * Collapse frames by de-duplicating identical adjacent frames
 * and grouping adjacent library/internal frames.
 *
 * Identical frames (same file, line, col, fn) are collapsed with a ×N suffix.
 * Adjacent library/internal frames can be grouped under a banner.
 *
 * @param {Array<{file: string, line: number|null, col: number|null, fn: string, type: string}>} frames
 * @returns {Array<{file: string, line: number|null, col: number|null, fn: string, type: string, count?: number, collapsed?: boolean, libraryCount?: number}>}
 */
export function collapseFrames(frames) {
  if (!frames || frames.length === 0) {
    return [];
  }

  const result = [];

  // First pass: collapse consecutive identical frames
  const collapsed = [];
  let i = 0;

  while (i < frames.length) {
    const current = frames[i];
    let count = 1;

    // Count consecutive identical frames (same file and line)
    while (
      i + count < frames.length &&
      frames[i + count].file === current.file &&
      frames[i + count].line === current.line &&
      frames[i + count].fn === current.fn
    ) {
      count++;
    }

    const entry = { ...current };
    if (count > 1) {
      entry.count = count;
      entry.collapsed = true;
    }
    collapsed.push(entry);
    i += count;
  }

  // Second pass: group adjacent library/internal frames
  // Detect library frames by checking if file contains 'node_modules', 'internal/', or known lib patterns
  i = 0;
  while (i < collapsed.length) {
    const entry = collapsed[i];
    const isLibrary = isLibraryFrame(entry);

    if (isLibrary && i + 1 < collapsed.length && isLibraryFrame(collapsed[i + 1])) {
      // Group adjacent library frames
      let libCount = 1;
      while (i + libCount < collapsed.length && isLibraryFrame(collapsed[i + libCount])) {
        libCount++;
      }

      result.push({
        type: 'library-group',
        libraryCount: libCount,
        count: entry.count || 1,
        file: entry.file,
        fn: entry.fn,
        line: entry.line,
        col: entry.col,
        collapsed: true,
      });

      i += libCount;
    } else if (isLibrary) {
      // Single library frame
      result.push({
        ...entry,
        type: 'library',
      });
      i++;
    } else {
      result.push(entry);
      i++;
    }
  }

  return result;
}

/**
 * Determine if a frame is a library/internal frame based on path patterns.
 * @param {{file: string}} frame
 * @returns {boolean}
 */
function isLibraryFrame(frame) {
  if (!frame || !frame.file) return false;

  const libPatterns = [
    /node_modules/,
    /internal\//,
    /\/node:/,
    /<internal>/,
    /\[native code\]/,
    /native\//,
    /java\.(base|lang|util|io|net|sql|nio|time|math|text)/,
    /sun\./,
    /jdk\./,
    /javax\./,
    /org\.(springframework|apache|hibernate|junit|mockito|slf4j|jboss|glassfish|eclipse)/,
    /com\.(sun|google|fasterxml|fasterxml|intellij|microsoft|oracle)/,
  ];

  return libPatterns.some(p => p.test(frame.file));
}

export default collapseFrames;
