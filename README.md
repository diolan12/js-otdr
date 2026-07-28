# js-otdr 📡

> A lightweight, zero-dependency TypeScript/JavaScript library for parsing Telcordia SR-4731 Optical Time Domain Reflectometer (`.sor`) binary files.

[![NPM](https://github.com/diolan12/js-otdr/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/diolan12/js-otdr/actions/workflows/npm-publish.yml)
[![npm version](https://img.shields.io/npm/v/@diolan12/js-otdr.svg)](https://www.npmjs.com/package/@diolan12/js-otdr)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

---

## 🚀 Features

- ⚡ **Fast & Lightweight**: Zero runtime dependencies.
- 📦 **Dual Module Format**: Works seamlessly in ESM and CommonJS environments (Node.js & Browsers).
- 🧩 **Object-Oriented Design**: Encapsulated `SorParser` and `SorData` models.
- 📄 **JSON Export**: Export parsed OTDR traces directly to JSON strings using `.toJson()`.
- 🛠️ **Fully Typed**: Written in TypeScript with complete type definitions included.

---

## 📦 Installation

```bash
npm install @diolan12/js-otdr
```

or with yarn / pnpm / bun:

```bash
yarn add @diolan12/js-otdr
# or
pnpm add @diolan12/js-otdr
# or
bun add @diolan12/js-otdr
```

### CDN (Browser `<script>` Tag)

You can also use `@diolan12/js-otdr` directly in the browser without a bundler via **jsDelivr** or **unpkg**:

#### Via IIFE (`<script>` tag with global `JsOtdr`):

```html
<script src="https://cdn.jsdelivr.net/npm/@diolan12/js-otdr/dist/index.global.js"></script>
<script>
  // Access via global JsOtdr namespace
  const parser = new JsOtdr.SorParser(arrayBuffer);
  const sorData = parser.parse();
  console.log(sorData.toJson(true));
</script>
```

#### Via ES Module (`<script type="module">`):

```html
<script type="module">
  import { SorParser } from 'https://cdn.jsdelivr.net/npm/@diolan12/js-otdr/+esm';

  const parser = new SorParser(arrayBuffer);
  const sorData = parser.parse();
</script>
```

---

## 💻 Usage

### 1. Basic Parsing

Pass an `ArrayBuffer` to `SorParser` to extract structured OTDR metadata:

```typescript
import { SorParser } from 'js-otdr';
import * as fs from 'node:fs';

// Read SOR binary file in Node.js
const fileBuffer = fs.readFileSync('trace.sor');
const arrayBuffer = fileBuffer.buffer.slice(
  fileBuffer.byteOffset,
  fileBuffer.byteOffset + fileBuffer.byteLength
);

// Instantiate parser and parse
const parser = new SorParser(arrayBuffer);
const sorData = parser.parse();

console.log(`Cable ID: ${sorData.cableId}`);
console.log(`Wavelength: ${sorData.wavelengthNm} nm`);
console.log(`Events Found: ${sorData.events.length}`);
```

### 2. Exporting to JSON (`toJson`)

Convert parsed OTDR data into a JSON string directly from `SorParser` or `SorData`:

```typescript
import { SorParser } from 'js-otdr';

const parser = new SorParser(arrayBuffer);

// Format with 2-space indentation
const prettyJson = parser.toJson(true);
console.log(prettyJson);

// Compact JSON string
const compactJson = parser.toJson(false);
```

You can also call `.toJson()` on an existing `SorData` instance:

```typescript
const sorData = parser.parse();
const jsonOutput = sorData.toJson(true);
```

---

## 📚 API Reference

### `SorParser`

```typescript
class SorParser {
  constructor(buffer: ArrayBuffer)
  
  // Parses the buffer and returns a SorData instance
  public parse(): SorData
  
  // Conveniently converts parsed SOR data directly into JSON
  public toJson(pretty?: boolean): string
}
```

### `SorData`

```typescript
class SorData implements SorMetadata {
  cableId: string;
  fiberId: string;
  wavelengthNm: number;
  pulseWidthNs: number;
  rangeMeters: number;
  refractiveIndex: number;
  events: SorEvent[];
  dataPoints: number[];

  // Formats data as JSON string
  public toJson(pretty?: boolean): string;

  // Returns plain JavaScript object clone
  public toObject(): SorMetadata;
}
```

---

## 🧪 Development & Unit Testing

We use [Vitest](https://vitest.dev/) for unit testing and [tsup](https://tsup.build/) for TypeScript bundling.

### Running Tests

```bash
# Run unit test suite once
npm test

# Run tests in watch mode during development
npm run test:watch
```

### Test Directory Structure

```text
tests/
├── fixtures/
│   └── Core-47.sor      # Sample .sor binary test files
└── parser.test.ts       # SorParser and SorData test suite
```

### Adding New Test Cases

When contributing new features or parsing capabilities, add corresponding unit test cases in `tests/parser.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { SorParser } from '../src/parser';

describe('My New Feature', () => {
  it('should parse custom SOR attributes', () => {
    // Write test expectations here
  });
});
```

---

## 🛠️ Building

To bundle ESM (`dist/index.js`), CommonJS (`dist/index.cjs`), and declaration files (`dist/index.d.ts`):

```bash
npm run build
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/my-feature`).
3. Write clean, readable TypeScript code following OOP principles.
4. Add unit tests for your changes and verify with `npm test`.
5. Open a Pull Request detailing your changes.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).