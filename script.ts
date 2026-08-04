// scratch.ts
import * as fs from 'node:fs';
import * as path from 'node:path';
import { SorParser } from './src/parser';
import { SorData } from './src/data';
import { CksumData } from './src/data/Cksum';
import { GenParamsData, GenParamsDataV1 } from './src/data/GenParams';
import { SupParamsData } from './src/data/SupParams';
import { FxdParamsData } from './src/data/FxdParams';
import { DataPtsData } from './src/data/DataPts';
import { KeyEvent, KeyEventsData } from './src/data/KeyEvents';
import { SorEventType } from './src/util/types';

console.clear()
// testing exportables

const fixturePath = path.resolve('./tests/fixtures/Core-1.sor');
const buf = fs.readFileSync(fixturePath);
const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

const parser = new SorParser(arrayBuffer);
const result = parser.parse();
const sorData: SorData = result;
const genParams: GenParamsData = result.GenParams
if ("fiberType" in genParams) {
    const typeFiber = genParams.fiberType
}
const supParams: SupParamsData = result.SupParams
const fxdParams: FxdParamsData = result.FxdParams
const dataPts: DataPtsData = result.DataPts
const keyEventTypes: Array<SorEventType> = result.KeyEvents.events.map((e: KeyEvent) => e.eventType)
const keyEvents: KeyEventsData = result.KeyEvents
const checksum: CksumData = result.Cksum

console.dir(result, { depth: null, colors: true });
