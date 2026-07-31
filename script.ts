// scratch.ts
import * as fs from 'node:fs';
import * as path from 'node:path';
import { SorParser } from './src/parser';

const fixturePath = path.resolve('./tests/fixtures/Core-47.sor');
const buf = fs.readFileSync(fixturePath);
const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

const parser = new SorParser(arrayBuffer);
const result = parser.parse();

console.dir(result, { depth: null, colors: true });
