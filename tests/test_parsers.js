import assert from 'assert';
import { parseJavascriptFrames } from '../src/parsers/javascript.js';
import { parsePythonFrames } from '../src/parsers/python.js';
import { parseJavaFrames } from '../src/parsers/java.js';

describe('parseJavascriptFrames', () => {
  it('parses a basic frame with fn, file, line, col', () => {
    const lines = [
      'Error: test',
      '    at Object.<anonymous> (/home/user/app.js:10:5)',
    ];
    const frames = parseJavascriptFrames(lines);
    assert.strictEqual(frames.length, 1);
    assert.strictEqual(frames[0].fn, 'Object.<anonymous>');
    assert.strictEqual(frames[0].file, '/home/user/app.js');
    assert.strictEqual(frames[0].line, 10);
    assert.strictEqual(frames[0].col, 5);
  });

  it('parses async frames', () => {
    const lines = [
      'TypeError: x is undefined',
      '    at async fetchData (/app/routes/data.js:25:12)',
    ];
    const frames = parseJavascriptFrames(lines);
    assert.strictEqual(frames.length, 1);
    assert.strictEqual(frames[0].fn, 'fetchData');
    assert.strictEqual(frames[0].line, 25);
    assert.strictEqual(frames[0].col, 12);
  });

  it('parses multiple frames', () => {
    const lines = [
      'Error: broke',
      '    at first (/src/a.js:1:2)',
      '    at second (/src/b.js:3:4)',
      '    at third (/src/c.js:5:6)',
    ];
    const frames = parseJavascriptFrames(lines);
    assert.strictEqual(frames.length, 3);
    assert.strictEqual(frames[0].fn, 'first');
    assert.strictEqual(frames[1].fn, 'second');
    assert.strictEqual(frames[2].fn, 'third');
  });

  it('returns empty array for no frames', () => {
    assert.strictEqual(parseJavascriptFrames([]).length, 0);
    assert.strictEqual(parseJavascriptFrames(['Just some text']).length, 0);
  });

  it('skips error heading lines', () => {
    const lines = [
      'Error: test',
      '    at handler (/app.js:5:10)',
      'Uncaught ReferenceError: x not defined',
    ];
    const frames = parseJavascriptFrames(lines);
    assert.strictEqual(frames.length, 1);
  });
});

describe('parsePythonFrames', () => {
  it('parses a basic Python frame', () => {
    const lines = [
      'Traceback (most recent call last):',
      '  File "/home/user/app.py", line 15, in main',
      '    result = process(data)',
    ];
    const frames = parsePythonFrames(lines);
    assert.strictEqual(frames.length, 1);
    assert.strictEqual(frames[0].file, '/home/user/app.py');
    assert.strictEqual(frames[0].line, 15);
    assert.strictEqual(frames[0].fn, 'main');
    assert.strictEqual(frames[0].code, 'result = process(data)');
  });

  it('parses <module> frames', () => {
    const lines = [
      '  File "/home/user/script.py", line 3, in <module>',
      '    print(1/0)',
    ];
    const frames = parsePythonFrames(lines);
    assert.strictEqual(frames.length, 1);
    assert.strictEqual(frames[0].fn, '<module>');
    assert.strictEqual(frames[0].line, 3);
  });

  it('parses multiple frames', () => {
    const lines = [
      'Traceback (most recent call last):',
      '  File "/home/user/app.py", line 15, in main',
      '    result = process(data)',
      '  File "/home/user/utils.py", line 42, in process',
      '    return compute(x)',
      '  File "/home/user/math.py", line 8, in compute',
      '    raise ValueError("invalid")',
    ];
    const frames = parsePythonFrames(lines);
    assert.strictEqual(frames.length, 3);
    assert.strictEqual(frames[0].fn, 'main');
    assert.strictEqual(frames[1].fn, 'process');
    assert.strictEqual(frames[2].fn, 'compute');
  });

  it('handles frames without a function name (<module> default)', () => {
    const lines = [
      '  File "/home/user/script.py", line 3',
      '    print(1/0)',
    ];
    const frames = parsePythonFrames(lines);
    assert.strictEqual(frames.length, 1);
    assert.strictEqual(frames[0].fn, '<module>');
  });

  it('returns empty for non-trace lines', () => {
    assert.strictEqual(parsePythonFrames([]).length, 0);
    assert.strictEqual(parsePythonFrames(['Hello world']).length, 0);
  });
});

describe('parseJavaFrames', () => {
  it('parses a basic Java frame', () => {
    const lines = [
      'java.lang.NullPointerException',
      '    at com.example.app.Main.process(Main.java:25)',
    ];
    const frames = parseJavaFrames(lines);
    assert.strictEqual(frames.length, 1);
    assert.strictEqual(frames[0].fn, 'com.example.app.Main.process');
    assert.strictEqual(frames[0].file, 'Main.java');
    assert.strictEqual(frames[0].line, 25);
    assert.strictEqual(frames[0].className, 'com.example.app.Main');
  });

  it('parses frames with module prefix', () => {
    const lines = [
      '    at java.base/java.lang.String.length(String.java:15)',
    ];
    const frames = parseJavaFrames(lines);
    assert.strictEqual(frames.length, 1);
    assert.strictEqual(frames[0].fn, 'java.lang.String.length');
    assert.strictEqual(frames[0].file, 'java.base/String.java');
    assert.strictEqual(frames[0].line, 15);
  });

  it('parses "Caused by" chains', () => {
    const lines = [
      'java.sql.SQLException: Connection refused',
      '    at com.example.db.Connection.connect(Connection.java:50)',
      '    ... 5 more',
      'Caused by: java.net.ConnectException: Connection refused',
      '    at java.base/sun.nio.ch.SocketChannelImpl.connect(SocketChannelImpl.java:300)',
    ];
    const frames = parseJavaFrames(lines);
    assert.strictEqual(frames.length, 4);
    assert.strictEqual(frames[0].type, 'user');
    assert.strictEqual(frames[1].type, 'more');
    assert.strictEqual(frames[1].count, 5);
    assert.strictEqual(frames[2].type, 'caused-by');
    assert.strictEqual(frames[3].type, 'caused');
  });

  it('parses multiple frames', () => {
    const lines = [
      '    at com.example.a.run(Application.java:100)',
      '    at com.example.b.start(Boot.java:200)',
      '    at com.example.c.init(Config.java:300)',
    ];
    const frames = parseJavaFrames(lines);
    assert.strictEqual(frames.length, 3);
  });

  it('returns empty for non-trace lines', () => {
    assert.strictEqual(parseJavaFrames([]).length, 0);
    assert.strictEqual(parseJavaFrames(['Hello world']).length, 0);
  });
});
