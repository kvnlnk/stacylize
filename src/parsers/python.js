/**
 * Parse Python stack trace frames.
 * Expected CPython format:
 *   File "/path/to/file.py", line N, in function_name
 *     statement_that_failed
 *
 * @param {string[]} rawLines - Array of lines from the stack trace
 * @returns {Array<{file: string, line: number, col: number|null, fn: string, type: string}>}
 */
export function parsePythonFrames(rawLines) {
  const frames = [];
  const framePattern = /^\s*File\s+"([^"]+)",\s+line\s+(\d+)(?:,\s+in\s+(.+))?/;

  let currentCodeLine = '';
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    if (!line.trim()) continue;

    // Try to match a frame header
    const match = line.match(framePattern);
    if (match) {
      // Collect the code line that follows (indented line after the File header)
      let codeLine = '';
      if (i + 1 < rawLines.length) {
        const nextLine = rawLines[i + 1];
        // Python puts the failing statement on the next line, indented
        if (nextLine.trim() && /^\s+\S/.test(nextLine)) {
          codeLine = nextLine.trim();
          i++; // skip the code line in next iteration
        }
      }

      frames.push({
        file: match[1],
        line: parseInt(match[2], 10),
        col: null,
        fn: (match[3] || '<module>').trim(),
        type: 'user',
        code: codeLine,
      });
    }
  }

  return frames;
}

export default parsePythonFrames;
