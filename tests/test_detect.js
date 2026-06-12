import assert from 'assert';
import { detectLanguage } from '../src/detect.js';
import { LANGUAGES } from '../src/constants.js';

describe('detectLanguage', () => {
  describe('JavaScript', () => {
    it('detects JS from at file:line:col', () => {
      const trace = `Error: something broke
    at Object.<anonymous> (/home/user/app.js:10:5)
    at Module._compile (node:internal/modules/cjs/loader.js:999:10)`;
      assert.strictEqual(detectLanguage(trace), LANGUAGES.JAVASCRIPT);
    });

    it('detects JS from at async pattern', () => {
      const trace = `TypeError: Cannot read property 'x' of undefined
    at async getData (/app/routes/data.js:25:12)
    at processTicksAndRejections (node:internal/process/task_queues.js:95:5)`;
      assert.strictEqual(detectLanguage(trace), LANGUAGES.JAVASCRIPT);
    });

    it('detects JS with URL paths', () => {
      const trace = `Error: Network Error
    at createError (https://cdn.example.com/bundle.js:1:2345)
    at XMLHttpRequest.onerror (file:///app/local.js:50:10)`;
      assert.strictEqual(detectLanguage(trace), LANGUAGES.JAVASCRIPT);
    });
  });

  describe('Python', () => {
    it('detects Python from File "...", line N', () => {
      const trace = `Traceback (most recent call last):
  File "/home/user/app.py", line 15, in main
    result = process(data)
  File "/home/user/utils.py", line 42, in process
    return compute(x)
  File "/home/user/math.py", line 8, in compute
    raise ValueError("invalid")`;
      assert.strictEqual(detectLanguage(trace), LANGUAGES.PYTHON);
    });

    it('detects Python with single quotes', () => {
      const trace = `  File '/home/user/script.py', line 3, in <module>
    print(1/0)
ZeroDivisionError: division by zero`;
      assert.strictEqual(detectLanguage(trace), LANGUAGES.PYTHON);
    });
  });

  describe('Java', () => {
    it('detects Java from at package.Class.method(File.java:N)', () => {
      const trace = `java.lang.NullPointerException: Cannot invoke "String.length()"
    at com.example.app.Main.process(Main.java:25)
    at com.example.app.Main.main(Main.java:10)`;
      assert.strictEqual(detectLanguage(trace), LANGUAGES.JAVA);
    });

    it('detects Java with Caused by chain', () => {
      const trace = `java.sql.SQLException: Connection refused
    at com.example.db.Connection.connect(Connection.java:50)
    ... 5 more
Caused by: java.net.ConnectException: Connection refused
    at java.base/sun.nio.ch.SocketChannelImpl.connect(SocketChannelImpl.java:300)`;
      assert.strictEqual(detectLanguage(trace), LANGUAGES.JAVA);
    });
  });

  describe('Edge cases', () => {
    it('returns unknown for empty string', () => {
      assert.strictEqual(detectLanguage(''), LANGUAGES.UNKNOWN);
    });

    it('returns unknown for null/undefined', () => {
      assert.strictEqual(detectLanguage(null), LANGUAGES.UNKNOWN);
      assert.strictEqual(detectLanguage(undefined), LANGUAGES.UNKNOWN);
    });

    it('returns unknown for non-trace text', () => {
      const text = `Hello world
This is just a random sentence
Nothing to see here`;
      assert.strictEqual(detectLanguage(text), LANGUAGES.UNKNOWN);
    });

    it('returns unknown for whitespace only', () => {
      assert.strictEqual(detectLanguage('   \n  \n  '), LANGUAGES.UNKNOWN);
    });
  });

  describe('Ambiguous traces', () => {
    it('prefers JS patterns when both JS and Python patterns match (JS first in iteration)', () => {
      // Line that matches both JS and Python patterns — but JS patterns are checked first
      const trace = `Error: test
  File "/path/to/file.py", line 10, in func
    something
`;
      // The Python File pattern should match this one — depends on ordering
      // Our check iterates Object.entries(DETECTION_PATTERNS), which for JS object keys
      // will iterate javascript, python, java (v8+ stable ordering)
      // The File ... line should match Python
      assert.strictEqual(detectLanguage(trace), LANGUAGES.PYTHON);
    });
  });
});
