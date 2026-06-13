# 🧵 stacylize

**Beautify and colorize stack traces from JS, Python, and Java — right in your terminal.**

---

## 🤖 Fully Vibecoded with Hermes Agent

This project was built entirely through natural language conversations with [Hermes Agent](https://hermes-agent.nousresearch.com) — an autonomous AI coding assistant. From architecture to deployment, every line of code was generated, tested, and shipped via chat prompts.

---

## ✨ Features

- **🌐 Multi-Language Detection** — Automatically detects JS, Python, or Java from frame patterns
- **🎨 Colorized Output** — Language-specific chalk themes (cyan/yellow for Python, red/orange for Java, green/blue for JS)
- **📦 Frame Collapsing** — Deduplicates identical adjacent frames (`×N`) and groups library frames
- **📥 stdin & File Input** — Pipe traces directly or read from a file with `-f`
- **🔤 Language Override** — Force a language with `-l python` when auto-detection is ambiguous
- **🚫 --no-color** — Strip ANSI codes for logs or CI output
- **⚡ Zero Dependencies** — Only uses `commander` and `chalk`

---

## 🛠️ Tech Stack

| Layer        | Technology    |
|-------------|---------------|
| Runtime     | Node.js 18+   |
| CLI         | commander     |
| Colors      | chalk         |
| Testing     | Node built-in (node:test, node:assert) |

---

## 🚀 Install & Usage

### Via npx (no install)

```bash
# Pipe a stack trace directly
cat error.log | npx stacylize

# Or paste inline
echo 'Error at fn (app.js:42:10)' | npx stacylize
```

### Via npm

```bash
npm install -g stacylize
stacylize --help
stacylize -f trace.txt
```

### Examples

**JavaScript:**
```bash
echo 'Error: something broke
    at Object.<anonymous> (/src/app.js:42:10)
    at Generator.next (<anonymous>)
    at asyncGeneratorStep (/src/helpers.js:15:3)
    at process.processTicksAndRejections (node:internal/process/task_queues.js:95:5)' | stacylize
```

Output: *(function names in green, files in blue, line:col in yellow)*
```
Object.<anonymous> (/src/app.js:42:10)
asyncGeneratorStep (/src/helpers.js:15:3)
... 2 frames from node:internal
```

**Python:**
```bash
echo '
Traceback (most recent call last):
  File "/app/main.py", line 42, in <module>
    main()
  File "/app/main.py", line 25, in main
    result = compute(data)
  File "/app/utils.py", line 15, in compute
    return 1 / 0
ZeroDivisionError: division by zero' | stacylize -l python
```

Output: *(function names in cyan, files in yellow, line numbers in white)*
```
<module> (/app/main.py:42)
main (/app/main.py:25)
compute (/app/utils.py:15)
```

**Java (with Caused by):**
```bash
echo 'Exception in thread "main" java.lang.NullPointerException
    at com.example.Main.process(Main.java:42)
    at com.example.Main.main(Main.java:15)
    at java.base/java.lang.reflect.Method.invoke(Method.java:580)
Caused by: java.io.IOException: connection refused
    at com.example.Net.connect(Net.java:88)
    at com.example.Main.process(Main.java:40)
    ... 3 more' | stacylize -l java
```

Output: *(class names in red, files in orange, line numbers in yellow)*
```
com.example.Main.process (Main.java:42)
com.example.Main.main (Main.java:15)
... 1 frame from java.base
Caused by: java.io.IOException: connection refused
com.example.Net.connect (Net.java:88)
com.example.Main.process (Main.java:40)
... 3 more
```

---

## 📁 Project Structure

```
stacylize/
├── bin/
│   └── stacylize              # CLI entry point (shebang)
├── src/
│   ├── index.js               # Orchestrator: detect → parse → collapse → colorize
│   ├── detect.js              # Language detection from frame patterns
│   ├── colorize.js            # Chalk-based colorization per language
│   ├── collapse.js            # Deduplicate & group frames
│   ├── constants.js           # Regex patterns, color themes, enums
│   └── parsers/
│       ├── javascript.js      # JS frame parser
│       ├── python.js          # Python frame parser
│       └── java.js            # Java frame parser
├── tests/
│   ├── test_detect.js         # Language detection tests
│   ├── test_parsers.js        # Frame parser tests (all 3 languages)
│   ├── test_collapse.js       # Collapse logic tests
│   └── test_index.js          # Integration tests
├── package.json
└── README.md
```

---

## 🧪 Tests

```bash
npm test
```

- **43 tests** across 4 suites
- Language detection (12 tests), parsers (15 tests), collapse (8 tests), integration (8 tests)
- Covers JS, Python, Java traces, edge cases, empty input, `Caused by` chains

---

## 📄 License

MIT

---

<p align="center">Made with ❤️ by <a href="https://github.com/kvnlnk">kvnlnk</a></p>
