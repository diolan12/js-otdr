import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { SorParser } from '../src/parser';
import { SorData } from '../src/data';
import { SorEventType, SorFiberType } from '../src/util/types';

function getArrayBuffer(filePath: string): ArrayBuffer {
    const buffer = fs.readFileSync(filePath);
    return buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
    );
}

describe('SorParser - yokogawa.sor fixture test', () => {
    let fixturePath: string;
    let arrayBuffer: ArrayBuffer;
    let parser: SorParser;
    let result: SorData;

    beforeAll(() => {
        fixturePath = path.resolve(__dirname, 'fixtures/yokogawa.sor');
        expect(fs.existsSync(fixturePath)).toBe(true);
        arrayBuffer = getArrayBuffer(fixturePath);
        parser = new SorParser(arrayBuffer);
        result = parser.parse();
    });

    it('should successfully parse yokogawa.sor into SorData', () => {
        expect(result).toBeInstanceOf(SorData);
    });

    it('should parse GenParams correctly', () => {
        const { GenParams } = result;
        expect(GenParams.blockName).toBe('GenParams');
        expect(GenParams.version).toBe(2);
        expect(GenParams.lang).toBe('EN');
        expect(GenParams.cableId).toBe('0117');
        expect(GenParams.fiberId).toBeUndefined();
        expect("fiberType" in GenParams).toBe(true);
        if ("fiberType" in GenParams) {
            expect(GenParams.fiberType).toBe(SorFiberType.G652);
        }
        expect(GenParams.wavelengthNm).toBe(1310);
        expect(GenParams.buildCondition).toBe('BC');
        expect(GenParams.userOffset).toBe(0);
    });

    it('should parse SupParams correctly', () => {
        const { SupParams } = result;
        expect(SupParams.blockName).toBe('SupParams');
        expect(SupParams.supplier).toBe('YOKOGAWA TEST AND MEASUREMENT CORPORATION');
        expect(SupParams.otdr).toBe('AQ1210');
        expect(SupParams.otdrSn).toBe('C3ZA16019F');
        expect(SupParams.module).toBe('M_0E_0');
        expect(SupParams.software).toBe('1.07-S1');
    });

    it('should parse FxdParams correctly', () => {
        const { FxdParams } = result;
        expect(FxdParams.blockName).toBe('FxdParams');
        expect(FxdParams.timestamp).toBe(1781958546);
        expect(FxdParams.dateTime).toBeInstanceOf(Date);
        expect(FxdParams.unit).toBe('km');
        expect(FxdParams.wavelengthNm).toBe(1310);
        expect(FxdParams.pulseWidthNs).toBe(20000);
        expect(FxdParams.sampleSpacingUnits).toBeCloseTo(0.16);
        expect(FxdParams.numDataPoints).toBe(3125);
        expect(FxdParams.ior).toBe(1.46);
        expect(FxdParams.backscatterCoeffDb).toBe(-80);
        expect(FxdParams.averagesCount).toBe(14848);
        expect(FxdParams.lossThreshold).toBe(0.2);
        expect(FxdParams.reflectionThreshold).toBeCloseTo(19.264);
        expect(FxdParams.traceLengthMeters).toBe(500);
    });

    it('should parse KeyEvents correctly', () => {
        const { KeyEvents } = result;
        expect(KeyEvents.blockName).toBe('KeyEvents');
        expect(KeyEvents.numEvents).toBe(5);
        expect(KeyEvents.events).toHaveLength(5);

        // Event 1
        const e1 = KeyEvents.events[0];
        expect(e1.eventNumber).toBe(1);
        expect(e1.distanceKm).toBe(16.066);
        expect(e1.slopeDbPerKm).toBe(0.363);
        expect(e1.spliceLossDb).toBe(0.193);
        expect(e1.reflectionLossDb).toBe(0);
        expect(e1.isReflective).toBe(true);
        expect(e1.rawType).toBe('0F9999LS');
        expect(e1.eventType).toBe(SorEventType.CONNECTOR);
        expect(e1.isManual).toBe(false);

        // Event 5 (End of Fiber)
        const e5 = KeyEvents.events[4];
        expect(e5.eventNumber).toBe(5);
        expect(e5.distanceKm).toBe(39.49);
        expect(e5.spliceLossDb).toBe(0);
        expect(e5.reflectionLossDb).toBe(-49.298);
        expect(e5.eventType).toBe(SorEventType.ENDOFFIBER);

        // Summary
        expect(KeyEvents.summary.totalLossDb).toBe(31.589);
        expect(KeyEvents.summary.lossStartKm).toBe(16.066);
        expect(KeyEvents.summary.lossFinishKm).toBe(39.49);
        expect(KeyEvents.summary.orlDb).toBe(32.333);
        expect(KeyEvents.summary.totalScanRangeKm).toBe(0.5);
    });

    it('should parse DataPts correctly', () => {
        const { DataPts } = result;
        expect(DataPts.blockName).toBe('DataPts');
        expect(DataPts.numDataPoints).toBe(3125);
        expect(DataPts.scalingFactor).toBe(0.001);
        expect(DataPts.rawPoints).toBeInstanceOf(Uint16Array);
        expect(DataPts.rawPoints).toHaveLength(3125);
        expect(DataPts.dbPoints).toBeInstanceOf(Float32Array);
        expect(DataPts.dbPoints).toHaveLength(3125);
    });

    it('should parse Cksum correctly and pass validation', () => {
        const { Cksum } = result;
        expect(Cksum.blockName).toBe('Cksum');
        expect(Cksum.storedChecksum).toBe(35760);
        expect(Cksum.calculatedChecksum).toBe(35760);
        expect(Cksum.isValid).toBe(true);
        expect(Cksum.algorithmUsed).toBe('CRC-16-CCITT (0xFFFF)');
    });

    it('should convert parsed data to JSON and plain object', () => {
        const jsonFromParser = parser.toJson(true);
        expect(typeof jsonFromParser).toBe('string');
        const parsedJson = JSON.parse(jsonFromParser);
        expect(parsedJson.GenParams.cableId).toBe('0117');
        expect(parsedJson.FxdParams.wavelengthNm).toBe(1310);

        const jsonFromData = result.toJson();
        expect(typeof jsonFromData).toBe('string');

        const metadataObj = result.toObject();
        expect(metadataObj.GenParams.cableId).toBe('0117');
        expect(metadataObj.Cksum.isValid).toBe(true);
    });
});