import assert from 'assert';
import { collapseFrames } from '../src/collapse.js';

describe('collapseFrames', () => {
  it('returns empty array for empty input', () => {
    assert.deepStrictEqual(collapseFrames([]), []);
    assert.deepStrictEqual(collapseFrames(null), []);
    assert.deepStrictEqual(collapseFrames(undefined), []);
  });

  it('passes through unique frames unchanged', () => {
    const frames = [
      { file: '/a.js', line: 1, col: 2, fn: 'foo', type: 'user' },
      { file: '/b.js', line: 3, col: 4, fn: 'bar', type: 'user' },
    ];
    const result = collapseFrames(frames);
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].fn, 'foo');
    assert.strictEqual(result[1].fn, 'bar');
    assert.strictEqual(result[0].collapsed, undefined);
  });

  it('collapses consecutive identical frames with ×N', () => {
    const frames = [
      { file: '/a.js', line: 1, col: 2, fn: 'foo', type: 'user' },
      { file: '/a.js', line: 1, col: 2, fn: 'foo', type: 'user' },
      { file: '/a.js', line: 1, col: 2, fn: 'foo', type: 'user' },
    ];
    const result = collapseFrames(frames);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].count, 3);
    assert.strictEqual(result[0].collapsed, true);
  });

  it('does not collapse non-consecutive identical frames', () => {
    const frames = [
      { file: '/a.js', line: 1, col: 2, fn: 'foo', type: 'user' },
      { file: '/b.js', line: 3, col: 4, fn: 'bar', type: 'user' },
      { file: '/a.js', line: 1, col: 2, fn: 'foo', type: 'user' },
    ];
    const result = collapseFrames(frames);
    assert.strictEqual(result.length, 3);
    assert.strictEqual(result[0].count, undefined);
    assert.strictEqual(result[2].count, undefined);
  });

  it('groups adjacent library frames', () => {
    const frames = [
      { file: '/app/user.js', line: 1, col: 2, fn: 'userFunc', type: 'user' },
      { file: 'node_modules/lodash/index.js', line: 100, col: 5, fn: 'lodash', type: 'user' },
      { file: 'node_modules/express/index.js', line: 200, col: 5, fn: 'express', type: 'user' },
      { file: '/app/other.js', line: 10, col: 2, fn: 'otherFunc', type: 'user' },
    ];
    const result = collapseFrames(frames);
    assert.strictEqual(result.length, 3);
    assert.strictEqual(result[0].fn, 'userFunc');
    assert.strictEqual(result[1].type, 'library-group');
    assert.strictEqual(result[1].libraryCount, 2);
    assert.strictEqual(result[2].fn, 'otherFunc');
  });

  it('marks single library frames as library type', () => {
    const frames = [
      { file: 'node_modules/lodash/index.js', line: 100, col: 5, fn: 'lodash', type: 'user' },
    ];
    const result = collapseFrames(frames);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].type, 'library');
  });

  it('handles edge case with one frame', () => {
    const frames = [
      { file: '/a.js', line: 1, col: 2, fn: 'foo', type: 'user' },
    ];
    const result = collapseFrames(frames);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].fn, 'foo');
  });

  it('handles Java internal frames', () => {
    const frames = [
      { file: 'com.example.Main.java', line: 10, col: null, fn: 'com.example.Main.run', type: 'user' },
      { file: 'java.lang.Thread.java', line: 50, col: null, fn: 'java.lang.Thread.start', type: 'user' },
      { file: 'java.base/Thread.java', line: 100, col: null, fn: 'java.base/java.lang.Thread.run', type: 'user' },
    ];
    const result = collapseFrames(frames);
    // First is user, second and third are Java internal frames
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].fn, 'com.example.Main.run');
    assert.strictEqual(result[1].type, 'library-group');
    assert.strictEqual(result[1].libraryCount, 2);
  });
});
