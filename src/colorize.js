import chalk from 'chalk';
import { LANGUAGES, THEMES } from './constants.js';

/**
 * Colorize a collapsed frame array for terminal output.
 * Applies chalk colors based on the language-specific theme.
 *
 * @param {Array} collapsedFrames - Array of collapsed frame objects
 * @param {string} language - Language identifier from LANGUAGES
 * @returns {string} Colorized string ready for stdout
 */
export function colorize(collapsedFrames, language) {
  if (!collapsedFrames || collapsedFrames.length === 0) {
    return '';
  }

  const theme = THEMES[language] || THEMES[LANGUAGES.UNKNOWN];
  const lines = [];

  for (const frame of collapsedFrames) {
    if (frame.type === 'caused-by') {
      lines.push(chalk[theme.delimiter](`Caused by: ${frame.exception || ''}`));
      continue;
    }

    if (frame.type === 'more') {
      lines.push(chalk[theme.delimiter](`... ${frame.count} more`));
      continue;
    }

    if (frame.type === 'library-group') {
      lines.push(
        chalk[theme.library](`... ${frame.libraryCount} frames from ${frame.file || 'internal'}`)
      );
      continue;
    }

    if (frame.type === 'library') {
      lines.push(
        formatFrame(frame, theme, true)
      );
      continue;
    }

    // Regular (user) frame
    lines.push(formatFrame(frame, theme, false));
  }

  return lines.join('\n');
}

/**
 * Format a single frame with chalk colors.
 * @param {{file: string, line: number|null, col: number|null, fn: string, count?: number}} frame
 * @param {Object} theme - Color theme object
 * @param {boolean} isLibrary - Whether this is a library frame
 * @returns {string}
 */
function formatFrame(frame, theme, isLibrary) {
  const fnStr = frame.fn ? chalk[theme.fn](frame.fn) : '';
  const fileStr = chalk[theme.file](frame.file || '');
  let location = '';

  if (frame.line !== null) {
    const lineStr = chalk[theme.line](String(frame.line));
    if (frame.col !== null) {
      const colStr = chalk[theme.col](String(frame.col));
      location = `${fileStr}:${lineStr}:${colStr}`;
    } else {
      location = `${fileStr}:${lineStr}`;
    }
  } else {
    location = fileStr;
  }

  // Build the line
  let line;
  if (fnStr) {
    line = `${fnStr} (${location})`;
  } else {
    line = location;
  }

  // Add count suffix for collapsed frames
  if (frame.count && frame.count > 1) {
    line += ` ${chalk[theme.repeat](`×${frame.count}`)}`;
  }

  if (isLibrary) {
    line = chalk[theme.library](line);
  }

  return line;
}

export default colorize;
