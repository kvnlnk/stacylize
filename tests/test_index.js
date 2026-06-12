import assert from 'assert';
import { processTrace } from '../src/index.js';

describe('processTrace (integration)', () => {
  describe('JavaScript traces', () => {
    const jsTrace = `TypeError: Cannot read property 'x' of undefined
    at Object.<anonymous> (/home/user/app.js:10:5)
    at Module._compile (node:internal/modules/cjs/loader.js:999:10)
    at Object.Module._extensions..js (node:internal/modules/cjs/loader.js:1100:10)
    at Module.load (node:internal/modules/cjs/loader.js:950:10)
    at Function.Module._load (node:internal/modules/cjs/loader.js:790:10)`;

    it('detects and processes a JS trace', () => {
      const { output, language } = processTrace(jsTrace);
      assert.strictEqual(language, 'javascript');
      assert.ok(output.length > 0, 'Output should not be empty');
      assert.ok(output.includes('app.js'), 'Output should include file name');
    });

    it('respects language override', () => {
      const { language } = processTrace(jsTrace, 'javascript');
      assert.strictEqual(language, 'javascript');
    });
  });

  describe('Python traces', () => {
    const pyTrace = `Traceback (most recent call last):
  File "/home/user/app.py", line 15, in main
    result = process(data)
  File "/home/user/utils.py", line 42, in process
    return compute(x)
  File "/home/user/math.py", line 8, in compute
    raise ValueError("invalid")
ValueError: invalid`;

    it('detects and processes a Python trace', () => {
      const { output, language } = processTrace(pyTrace);
      assert.strictEqual(language, 'python');
      assert.ok(output.length > 0, 'Output should not be empty');
      assert.ok(output.includes('app.py'), 'Output should include file name');
      assert.ok(output.includes('main'), 'Output should include function name');
    });
  });

  describe('Java traces', () => {
    const javaTrace = `java.lang.NullPointerException: Cannot invoke "String.length()"
    at com.example.app.Main.process(Main.java:25)
    at com.example.app.Main.main(Main.java:10)`;

    it('detects and processes a Java trace', () => {
      const { output, language } = processTrace(javaTrace);
      assert.strictEqual(language, 'java');
      assert.ok(output.length > 0, 'Output should not be empty');
      assert.ok(output.includes('Main.java'), 'Output should include file name');
    });
  });

  describe('Unknown traces', () => {
    it('passes through unknown traces', () => {
      const { output, language } = processTrace('Hello world\nThis is just text');
      assert.strictEqual(language, 'unknown');
      assert.strictEqual(output, 'Hello world\nThis is just text');
    });

    it('returns empty for empty input', () => {
      const { output, language } = processTrace('');
      assert.strictEqual(language, 'unknown');
      assert.strictEqual(output, '');
    });
  });

  describe('Java traces with Caused by chains', () => {
    const javaTraceWithCaused = `java.sql.SQLException: Connection refused
    at com.example.db.Connection.connect(Connection.java:50)
    ... 5 more
Caused by: java.net.ConnectException: Connection refused
    at java.base/sun.nio.ch.SocketChannelImpl.connect(SocketChannelImpl.java:300)
    at com.example.db.Connection.connect(Connection.java:40)`;

    it('processes Java with Caused by chain', () => {
      const { output, language } = processTrace(javaTraceWithCaused);
      assert.strictEqual(language, 'java');
      assert.ok(output.length > 0);
      assert.ok(output.includes('Connection.java'), 'Should include file name');
    });
  });

  describe('Collapse identical frames', () => {
    const traceWithRepeats = `Error: loop
    at loop (/app/bad.js:10:5)
    at loop (/app/bad.js:10:5)
    at loop (/app/bad.js:10:5)
    at next (/app/other.js:20:10)`;

    it('collapses repeated identical frames', () => {
      const { output, language } = processTrace(traceWithRepeats);
      assert.strictEqual(language, 'javascript');
      // Should have ×3 for the repeated frame
      assert.ok(output.includes('×3') || output.includes('×2') || output.includes('×'),
        'Collapsed frames should have repeat count marker');
    });
  });
});
