// Language identifiers
export const LANGUAGES = {
  JAVASCRIPT: 'javascript',
  PYTHON: 'python',
  JAVA: 'java',
  UNKNOWN: 'unknown',
};

// Regex patterns used for language detection (first match wins)
// Keyed by language, array of regexes that match characteristic frame lines
export const DETECTION_PATTERNS = {
  // Java checked first because both JS and Java use "at " prefix
  // Java patterns are more specific (package.Class.method pattern)
  [LANGUAGES.JAVA]: [
    /^\s+at\s+[a-zA-Z_][\w.]*\.[a-zA-Z_]\w*\(/,
    /^\s+\.\.\.\s+\d+\s+more/,
    /^Caused by:\s+/,
  ],
  [LANGUAGES.JAVASCRIPT]: [
    // JS frames have :line:col (col is optional but line must be present)
    // and do NOT match Java's package.Class pattern
    /^\s+at\s+(?:async\s+)?(?:[A-Za-z$_][\w$.<>]*(?:\s+\()?)?(?:.*?)\s*\(.*?:\d+(?::\d+)?\)/,
    /^\s+at\s+(?:async\s+)?.*?:\d+:\d+/,
    /^\s+at\s+(?:async\s+)?.*?\s+\(.*?:\d+\)/,
  ],
  [LANGUAGES.PYTHON]: [
    /^\s*File\s+"[^"]+",\s+line\s+\d+/,
    /^\s*File\s+'[^']+',\s+line\s+\d+/,
  ],
};

// Chalk-based color themes per language
// Each theme defines colors for different frame parts
export const THEMES = {
  [LANGUAGES.JAVASCRIPT]: {
    fn: 'cyan',
    file: 'yellow',
    line: 'green',
    col: 'greenBright',
    delimiter: 'dim',
    repeat: 'magenta',
    library: 'dim',
    libraryLabel: 'italic',
  },
  [LANGUAGES.PYTHON]: {
    fn: 'cyan',
    file: 'yellow',
    line: 'green',
    col: 'greenBright',
    delimiter: 'dim',
    repeat: 'magenta',
    library: 'dim',
    libraryLabel: 'italic',
  },
  [LANGUAGES.JAVA]: {
    fn: 'red',
    file: 'yellow',
    line: 'green',
    col: 'greenBright',
    delimiter: 'dim',
    repeat: 'magenta',
    library: 'dim',
    libraryLabel: 'italic',
    className: 'redBright',
  },
  [LANGUAGES.UNKNOWN]: {
    fn: 'white',
    file: 'white',
    line: 'white',
    col: 'white',
    delimiter: 'dim',
    repeat: 'white',
    library: 'white',
    libraryLabel: 'white',
  },
};
