# stacylize — Architecture

## Type
Node.js CLI tool (npm package)

## Target User
Developers debugging application crashes who want cleaner, colorized stack traces across JS, Python, and Java.

## Value Proposition
Transforms raw, hard-to-parse stack traces into colorized, collapsed, scannable output — reducing cognitive load during debugging. Language detection is automatic, so the user never has to specify what they're looking at.

## Tech Stack + Rationale

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Runtime | Node.js 18+ | Cross-platform; ecosystem has excellent CLI libraries |
| CLI framework | commander | Industry standard for Node.js CLIs; declarative option parsing |
| Colors | chalk | Most popular ANSI color lib; widely maintained, fast |
| Package mgr | npm | Standard for Node distribution |

## Folder Structure

```
stacylize/
├── bin/
│   └── stacylize          # CLI entry point (shebang)
├── src/
│   ├── index.js            # Main logic: parse → detect → colorize → collapse
│   ├── detect.js           # Language detection from frame patterns
│   ├── colorize.js         # Chalk-based themed colorization per language
│   ├── collapse.js         # Collapse duplicate/adjacent frames
│   ├── parsers/
│   │   ├── javascript.js   # JS frame parser
│   │   ├── python.js       # Python frame parser
│   │   └── java.js         # Java frame parser
│   └── formatters/
│       ├── terminal.js     # Terminal output formatter
│       └── html.js         # (Future) HTML output formatter
├── test/
├── .gitignore
├── .env.example
├── README.md
├── ARCHITECTURE.md
└── package.json
```

## Data Flow

```
 stdin / file arg
       │
       ▼
 ┌─────────────┐
 │  CLI (commander)  │  Parse args, read input
 └──────┬──────┘
        │ raw trace text
        ▼
 ┌─────────────┐
 │  detect.js  │  Match frame patterns → language enum
 └──────┬──────┘
        │ language + frames
        ▼
 ┌─────────────┐
 │  parsers/   │  Parse each frame into structured objects
 │  * .js      │    {file, line, col, fn, type}
 └──────┬──────┘
        │ structured frames[]
        ▼
 ┌─────────────┐
 │ collapse.js │  Group adjacent identical frames, count repeats
 └──────┬──────┘
        │ collapsed frames[]
        ▼
 ┌─────────────┐
 │ colorize.js │  Apply chalk colors per language theme
 └──────┬──────┘
        │ colorized string
        ▼
 ┌─────────────┐
 │  stdout     │  Final output
 └─────────────┘
```

## Key Design Decisions

1. **Streaming vs buffered** — Buffered input (read entire trace first) → simpler parsing, not a bottleneck since traces are small.
2. **Language detection via regex heuristics** — Each parser registers regex patterns (e.g., `at com.example` → Java, `File "..."` → Python). First match wins. Keeps detection O(n) and dependency-free.
3. **Collapse strategy** — Frames identical in file/line are collapsed with a `×N` suffix. Adjacent library frames can be grouped under a `... N more frames from <package>` banner.
4. **Chalk themes** — Language-specific color themes (e.g., Python = cyan/yellow, Java = red/orange). Theme is a simple JSON constant.
5. **npm binary** — `bin` field in package.json maps `stacylize` to `bin/stacylize.js`.

## Estimated Time Budget

| Area | Estimate |
|------|----------|
| CLI scaffolding + commander setup | 1h |
| Language detection heuristics | 1.5h |
| Frame parsers (JS, Python, Java) | 3h |
| Collapse logic | 1h |
| Colorization / themes | 1.5h |
| Tests | 2h |
| npm packaging / docs | 1h |
| **Total** | **~11h** |
