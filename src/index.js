import fs from 'fs';
import { detectLanguage } from './detect.js';
import { parseJavascriptFrames } from './parsers/javascript.js';
import { parsePythonFrames } from './parsers/python.js';
import { parseJavaFrames } from './parsers/java.js';
import { collapseFrames } from './collapse.js';
import { colorize } from './colorize.js';
import { LANGUAGES } from './constants.js';

/**
 * Process a raw stack trace string through the full pipeline:
 *   detect → parse → collapse → colorize
 *
 * @param {string} rawTrace - The full stack trace text
 * @param {string} [languageOverride] - Optional language override
 * @returns {{ output: string, language: string }}
 */
export function processTrace(rawTrace, languageOverride) {
  const language = languageOverride || detectLanguage(rawTrace);

  if (language === LANGUAGES.UNKNOWN) {
    return {
      output: rawTrace, // Pass through as-is if unknown
      language,
    };
  }

  const lines = rawTrace.split('\n');

  // Parse frames according to detected language
  let frames;
  switch (language) {
    case LANGUAGES.JAVASCRIPT:
      frames = parseJavascriptFrames(lines);
      break;
    case LANGUAGES.PYTHON:
      frames = parsePythonFrames(lines);
      break;
    case LANGUAGES.JAVA:
      frames = parseJavaFrames(lines);
      break;
    default:
      return { output: rawTrace, language };
  }

  // Collapse duplicate/adjacent frames
  const collapsed = collapseFrames(frames);

  // Colorize the output
  const output = colorize(collapsed, language);

  return { output, language };
}

/**
 * Read input from a file path.
 * @param {string} filePath
 * @returns {string}
 */
export function readFromFile(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Read input from stdin.
 * @returns {Promise<string>}
 */
export function readFromStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    if (process.stdin.isTTY) {
      // No piped input, resolve empty
      resolve('');
      return;
    }
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => chunks.push(chunk));
    process.stdin.on('end', () => resolve(chunks.join('')));
    process.stdin.on('error', (err) => reject(err));
    // Set a timeout in case stdin hangs
    setTimeout(() => resolve(chunks.join('')), 5000);
  });
}

export default { processTrace, readFromFile, readFromStdin };
