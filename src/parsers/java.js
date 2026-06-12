/**
 * Parse Java stack trace frames.
 * Expected format:
 *   at com.example.Class.method(File.java:123)
 *   at java.base/java.lang.String.length(String.java:15)
 *   at com.example.Class.method(File.java:123) ~[some.jar:1.0]
 *   ... 5 more
 *   Caused by: java.lang.Exception: message
 *   at com.example.Class.otherMethod(File.java:45)
 *
 * @param {string[]} rawLines - Array of lines from the stack trace
 * @returns {Array<{file: string, line: number, col: number|null, fn: string, type: string, className?: string, causedBy?: boolean}>}
 */
export function parseJavaFrames(rawLines) {
  const frames = [];
  const framePattern = /^\s+at\s+(?:(.+?)\/)?([a-zA-Z_][\w.]*)\.([a-zA-Z_]\w*)\((.+?)(?::(\d+))?(?:\))/;
  // Also match shorter form: at com.example.Class.method(SourceFile:123)
  const framePattern2 = /^\s+at\s+([a-zA-Z_][\w.]*)\.([a-zA-Z_]\w*)\(((?:[^:)]+)(?::(\d+))?)\)/;
  const morePattern = /^\s+\.\.\.\s+(\d+)\s+more/;
  const causedByPattern = /^Caused by:\s+(.+)/;

  let causedBy = false;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    if (!line.trim()) continue;

    // Check for caused by
    const causedMatch = line.match(causedByPattern);
    if (causedMatch) {
      causedBy = true;
      frames.push({
        file: '',
        line: null,
        col: null,
        fn: '',
        type: 'caused-by',
        className: '',
        exception: causedMatch[1],
        causedBy: true,
      });
      continue;
    }

    // Check for ... N more
    const moreMatch = line.match(morePattern);
    if (moreMatch) {
      frames.push({
        file: '',
        line: null,
        col: null,
        fn: '',
        type: 'more',
        count: parseInt(moreMatch[1], 10),
      });
      continue;
    }

    // Try main pattern (with module info like java.base/)
    let match = line.match(framePattern);
    if (match) {
      const moduleName = match[1] || '';
      const className = match[2];
      const methodName = match[3];
      const sourceFile = match[4];
      const lineNum = match[5] ? parseInt(match[5], 10) : null;

      frames.push({
        file: moduleName ? `${moduleName}/${sourceFile}` : sourceFile,
        line: lineNum,
        col: null,
        fn: `${className}.${methodName}`,
        type: causedBy ? 'caused' : 'user',
        className: className,
        method: methodName,
        module: moduleName,
        causedBy: false,
      });
      causedBy = false; // reset for subsequent frames
      continue;
    }

    // Try simpler pattern
    match = line.match(framePattern2);
    if (match) {
      const className = match[1];
      const methodName = match[2];
      const sourceFile = match[3];
      const lineNum = match[4] ? parseInt(match[4], 10) : null;

      frames.push({
        file: sourceFile,
        line: lineNum,
        col: null,
        fn: `${className}.${methodName}`,
        type: causedBy ? 'caused' : 'user',
        className: className,
        method: methodName,
        causedBy: false,
      });
      causedBy = false;
      continue;
    }
  }

  return frames;
}

export default parseJavaFrames;
