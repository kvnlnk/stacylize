/**
 * Parse JavaScript stack trace frames.
 * Expected format:
 *   at fnName (/path/to/file.js:line:col)
 *   at async fnName (/path/to/file.js:line:col)
 *   at /path/to/file.js:line:col
 *   at Object.<anonymous> (/path/to/file.js:line:col)
 *   at new ClassName (/path/to/file.js:line:col)
 *
 * @param {string[]} rawLines - Array of lines from the stack trace
 * @returns {Array<{file: string, line: number, col: number|null, fn: string, type: string}>}
 */
export function parseJavascriptFrames(rawLines) {
  const frames = [];
  const framePatterns = [
    // at fnName (/path/file.js:line:col)
    /^\s+at\s+(?:async\s+)?((?:new\s+)?(?:[A-Za-z$_][\w$.<>]*(?:\s+\()?)?[A-Za-z$_][\w$.<>]*|(?:<[^>]+>))\s+\(([^)]+):(\d+):(\d+)\)/,
    // at fnName (path:line)
    /^\s+at\s+(?:async\s+)?((?:new\s+)?(?:[A-Za-z$_][\w$.<>]*))\s+\(([^)]+):(\d+)\)/,
    // at /path/file.js:line:col (no fn)
    /^\s+at\s+(?:async\s+)?((\/[^:]+|[A-Za-z]:[\\/][^:]+):(\d+):(\d+))/,
    // at file:line:col (bare)
    /^\s+at\s+(?:async\s+)?([^(\s]\S+):(\d+):(\d+)/,
  ];

  for (const line of rawLines) {
    if (!line.trim()) continue;

    // Skip error heading lines
    if (/^(Error|SyntaxError|ReferenceError|TypeError|RangeError|URIError|EvalError|InternalError)\b/i.test(line.trim())) {
      continue;
    }
    if (/^Uncaught\s|^Unhandled\s/.test(line.trim())) {
      continue;
    }

    for (const pattern of framePatterns) {
      const match = line.match(pattern);
      if (match) {
        let fn = '';
        let file = '';
        let lineNum = null;
        let colNum = null;

        if (pattern === framePatterns[0]) {
          // at fn (path:line:col)
          fn = match[1].trim();
          file = match[2];
          lineNum = parseInt(match[3], 10);
          colNum = parseInt(match[4], 10);
        } else if (pattern === framePatterns[1]) {
          // at fn (path:line)
          fn = match[1].trim();
          file = match[2];
          lineNum = parseInt(match[3], 10);
        } else if (pattern === framePatterns[2]) {
          // at /path/file.js:line:col (no fn)
          // match[1] is the whole "path:line:col" string
          const fullPath = match[1];
          // Extract the path part (everything before the last two colons)
          const lastColon = fullPath.lastIndexOf(':');
          const secondLastColon = fullPath.lastIndexOf(':', lastColon - 1);
          file = fullPath.substring(0, secondLastColon);
          lineNum = parseInt(match[2], 10);
          colNum = parseInt(match[3], 10);
        } else if (pattern === framePatterns[3]) {
          // bare file:line:col or at something:line:col
          const parts = match[1];
          const lastColon = parts.lastIndexOf(':');
          const secondLastColon = parts.lastIndexOf(':', lastColon - 1);
          file = parts.substring(0, secondLastColon);
          lineNum = parseInt(match[2], 10);
          colNum = parseInt(match[3], 10);
        }

        frames.push({
          file: file || match[0],
          line: lineNum,
          col: colNum,
          fn: fn || '',
          type: 'user',
        });
        break;
      }
    }
  }

  return frames;
}

export default parseJavascriptFrames;
