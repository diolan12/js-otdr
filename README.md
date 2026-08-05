# js-otdr 📡

> A lightweight, zero-dependency TypeScript/JavaScript library for parsing Telcordia SR-4731 Optical Time Domain Reflectometer (`.sor`) binary files.

[![NPM](https://github.com/diolan12/js-otdr/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/diolan12/js-otdr/actions/workflows/npm-publish.yml)
[![npm version](https://img.shields.io/npm/v/@diolan12/js-otdr.svg)](https://www.npmjs.com/package/@diolan12/js-otdr)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

---

## 🚀 Features

- ⚡ **Fast & Lightweight**: Zero runtime dependencies.
- 📦 **Dual Module & Browser Support**: Works in ESM, CommonJS, and Browser environments (Node.js & Web).
- 🧩 **Complete Standard Block Support**: Parses `GenParams`, `SupParams`, `FxdParams`, `KeyEvents`, `DataPts`, and `Cksum` blocks according to Telcordia SR-4731 specifications.
- 🔒 **Integrity Verification**: Automatic CRC-16 checksum validation for parsed SOR files.
- 📄 **JSON Export**: Convenient `.toJson()` serialization with formatting options.
- 🛠️ **CLI Tool Included**: Convert `.sor` files to `.json` directly from the command line.
- 🟦 **Fully Typed**: Written in TypeScript with exportable interfaces and types.

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

Include `@diolan12/js-otdr` directly in the browser via **jsDelivr** or **unpkg**:

#### Via IIFE (`<script>` tag with global `JsOtdr`):

```html
<script src="https://cdn.jsdelivr.net/npm/@diolan12/js-otdr/dist/index.global.js"></script>
<script>
  // Access via global JsOtdr namespace
  const parser = new JsOtdr.SorParser(arrayBuffer);
  const sorData = parser.parse();
  console.log(sorData.GenParams.cableId);
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
import { SorParser } from '@diolan12/js-otdr';
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

// Access parsed block metadata
console.log(`Cable ID: ${sorData.GenParams.cableId}`);
console.log(`Wavelength: ${sorData.FxdParams.wavelengthNm} nm`);
console.log(`Pulse Width: ${sorData.FxdParams.pulseWidthNs} ns`);
console.log(`OTDR Supplier: ${sorData.SupParams.supplier}`);
console.log(`Events Count: ${sorData.KeyEvents.numEvents}`);
console.log(`Checksum Valid: ${sorData.Cksum.isValid}`);
```

### 2. Accessing Key Events & Data Points

Iterate over events detected along the fiber trace:

```typescript
// Access individual key events
sorData.KeyEvents.events.forEach((event) => {
  console.log(
    `Event #${event.eventNumber}: ${event.eventType} at ${event.distanceKm} km (Loss: ${event.spliceLossDb} dB, Reflectance: ${event.reflectionLossDb} dB)`
  );
});

// Access trace summary
const { totalLossDb, orlDb } = sorData.KeyEvents.summary;
console.log(`Total Loss: ${totalLossDb} dB, Optical Return Loss: ${orlDb} dB`);

// Access trace dB values array for plotting
const dbPoints = sorData.DataPts.dbPoints; // Float32Array of loss values in dB
```

### 3. Exporting to JSON (`toJson`)

Convert parsed OTDR data into a JSON string:

```typescript
const parser = new SorParser(arrayBuffer);

// Format with 2-space indentation
const prettyJson = parser.toJson(true);
console.log(prettyJson);

// Compact JSON string from SorData
const sorData = parser.parse();
const compactJson = sorData.toJson(false);
```

---

## 🖥️ Command Line Interface (CLI)

The package includes a CLI utility to convert `.sor` files to `.json` directly:

```bash
# Process a .sor file and save output to trace.json
npx @diolan12/js-otdr -i trace.sor -o trace.json

# Or run via script in local repository
npm run cli -- -i tests/fixtures/yokogawa.sor -o output.json
```

---

## 📚 API Reference

### `SorParser`

```typescript
class SorParser {
  constructor(buffer: ArrayBuffer);
  
  // Parses the buffer and returns a SorData instance
  public parse(): SorData;
  
  // Converts parsed SOR data directly into JSON string
  public toJson(pretty?: boolean): string;
}
```

### `SorData`

`SorData` encapsulates all standard Telcordia SR-4731 blocks:

```typescript
class SorData implements SorMetadata {
  GenParams: GenParamsData;   // General parameters (cable ID, fiber type, location, etc.)
  SupParams: SupParamsData;   // Supplier parameters (manufacturer, OTDR model, software, etc.)
  FxdParams: FxdParamsData;   // Fixed parameters (wavelength, pulse width, IOR, trace length, data points, etc.)
  KeyEvents: KeyEventsData;   // Event table and summary metrics (splice loss, reflectance, ORL, etc.)
  DataPts: DataPtsData;       // Raw and scaled data points (Uint16Array & Float32Array)
  Cksum: CksumData;           // Checksum validation result (stored vs calculated CRC-16)

  // Serializes all block data to JSON string
  public toJson(pretty?: boolean): string;

  // Returns plain JavaScript object containing all block data
  public toObject(): SorMetadata;
}
```

---

## 🧪 Testing & Development

Unit tests are written using [Vitest](https://vitest.dev/).

```bash
# Run unit test suite
npm test

# Run tests in watch mode during development
npm run test:watch

# Build package outputs (ESM, CJS, IIFE, DTS)
npm run build
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
