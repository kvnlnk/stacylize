import { LANGUAGES, DETECTION_PATTERNS } from './constants.js';

/**
 * Detect the programming language of a stack trace.
 * Splits raw text into lines and checks each line against known frame patterns.
 * First matching language wins. Ignores blank lines and common headings.
 *
 * @param {string} rawTrace - The full stack trace text
 * @returns {string} One of LANGUAGES.JAVASCRIPT, LANGUAGES.PYTHON, LANGUAGES.JAVA, or LANGUAGES.UNKNOWN
 */
export function detectLanguage(rawTrace) {
  if (!rawTrace || typeof rawTrace !== 'string' || rawTrace.trim().length === 0) {
    return LANGUAGES.UNKNOWN;
  }

  const lines = rawTrace.split('\n');

  // Check each line against each language's patterns
  for (const line of lines) {
    const trimmed = line.trimEnd();
    if (trimmed.length === 0) continue;

    // Skip common non-frame lines
    if (/^(Traceback|Error|Exception|SyntaxError|ReferenceError|TypeError|RangeError|URIError|EvalError|InternalError)\b/i.test(trimmed)) {
      continue;
    }
    if (/^(Uncaught\s|Unhandled\s)/.test(trimmed)) {
      continue;
    }

    for (const [language, patterns] of Object.entries(DETECTION_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(trimmed)) {
          return language;
        }
      }
    }
  }

  return LANGUAGES.UNKNOWN;
}

export default detectLanguage;
