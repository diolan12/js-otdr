import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { SorParser } from '../src/parser';

// Helper to convert Node.js Buffer to ArrayBuffer
function getArrayBuffer(filePath: string): ArrayBuffer {
    const buffer = fs.readFileSync(filePath);
    return buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
    );
}

describe('SorParser', () => {
    it('should throw an error if buffer is empty or smaller than 4 bytes', () => {
        const emptyBuffer = new Uint8Array([]).buffer;
        const parser = new SorParser(emptyBuffer);

        expect(() => parser.parse()).toThrow();
    });

    it('should throw an error for invalid non-SOR files', () => {
        // Mock an invalid 4-byte buffer that does NOT start with "Map"
        const fakeBuffer = new Uint8Array([0x00, 0x01, 0x02, 0x03]).buffer;
        const parser = new SorParser(fakeBuffer);

        expect(() => parser.parse()).toThrowError('Invalid SOR file: Missing Map block');
    });

    it('should parse a synthetic buffer starting with "Map"', () => {
        const header = new TextEncoder().encode('Map\0');
        const parser = new SorParser(header.buffer);
        const result = parser.parse();

        expect(result).toBeDefined();
        expect(result.cableId).toBe('DEFAULT_CABLE');
        expect(result.wavelengthNm).toBe(1550);
        expect(Array.isArray(result.events)).toBe(true);
        expect(Array.isArray(result.dataPoints)).toBe(true);
    });

    it('should parse real fixture file Core-47.sor if present', () => {
        const fixturePath = path.resolve(__dirname, 'fixtures/Core-47.sor');

        if (!fs.existsSync(fixturePath)) {
            console.warn('Skipping test: Core-47.sor not found in tests/fixtures/');
            return;
        }

        const arrayBuffer = getArrayBuffer(fixturePath);
        const parser = new SorParser(arrayBuffer);
        const result = parser.parse();
        const index = 0;

        expect(result).toBeDefined();
        expect(result.cableId).toBe("0117");
        expect(result.timestamp).toBe(1781958546);
        expect(result.wavelengthNm).toBe(1310);
        expect(result.pulseWidthNs).toBe(20000);
        expect(result.duration).toBe(20.0);
        expect(result.rangeMeters).toBe(102669);
        expect(result.events).toHaveLength(5);
        expect(result.events[0].distanceMeters).toBe(16066)
        expect(result.events[0].eventType).toBe("splice")
        expect(result.events[0].typeCode).toBe("0F9999LS")
        expect(result.events[0].eventNumber).toBe(1)
        expect(result.events[0].spliceLossDb).toBe(0.193)
        expect(result.events[1].distanceMeters).toBe(20961)
        expect(result.events[1].spliceLossDb).toBe(1.967)
        expect(result.events[2].distanceMeters).toBe(29503)
        expect(result.events[2].spliceLossDb).toBe(4.915)
        expect(result.events[4].eventType).toBe("connector")
        expect(result.events[4].reflectionLossDb).toBe(-49.298)
        expect(result.endToEndLossDb).toBe(31.589)
        expect(result.opticalReturnLossDb).toBe(32.333)
    });

    it('should build an events table from Core-47.sor', () => {
        const fixturePath = path.resolve(__dirname, 'fixtures/Core-47.sor');

        if (!fs.existsSync(fixturePath)) {
            console.warn('Skipping test: Core-47.sor not found in tests/fixtures/');
            return;
        }

        const result = new SorParser(getArrayBuffer(fixturePath)).parse();
        const table = result.getEventsTable();

        // launch + 5 events, each preceded by a fiber section
        expect(table).toHaveLength(11);
        expect(table[0]).toMatchObject({ eventNumber: 0, type: 'launch', distanceMeters: 0 });
        expect(table[1]).toMatchObject({ type: 'fiber-section', sectionLengthMeters: 16066 });
        expect(table[2]).toMatchObject({ eventNumber: 1, type: 'splice', distanceMeters: 16066, lossDb: 0.193 });
        expect(table[3]).toMatchObject({ type: 'fiber-section', sectionLengthMeters: 4895 });
        expect(table[4]).toMatchObject({ eventNumber: 2, distanceMeters: 20961, lossDb: 1.967 });
        expect(table[5]).toMatchObject({ type: 'fiber-section', sectionLengthMeters: 8542 });
        expect(table[6]).toMatchObject({ eventNumber: 3, distanceMeters: 29503, lossDb: 4.915 });
        expect(table[10]).toMatchObject({ type: 'end-of-fiber', reflectanceDb: -49.298 });
    });

    it('should parse real fixture file Core-1.SOR if present', () => {
        const fixturePath = path.resolve(__dirname, 'fixtures/Core-1.SOR');

        if (!fs.existsSync(fixturePath)) {
            console.warn('Skipping test: Core-1.SOR not found in tests/fixtures/');
            return;
        }

        const arrayBuffer = getArrayBuffer(fixturePath);
        const parser = new SorParser(arrayBuffer);
        const result = parser.parse();

        expect(result).toBeDefined();
        expect(result.wavelengthNm).toBeGreaterThan(0);
        expect(Array.isArray(result.events)).toBe(true);
    });

    it('should convert parsed data to JSON using toJson()', () => {
        const header = new TextEncoder().encode('Map\0');
        const parser = new SorParser(header.buffer);

        // Direct parser.toJson() call
        const jsonString = parser.toJson(true);
        expect(typeof jsonString).toBe('string');

        const parsedObject = JSON.parse(jsonString);
        expect(parsedObject.cableId).toBe('DEFAULT_CABLE');
        expect(parsedObject.wavelengthNm).toBe(1550);

        // SorData domain model toJson() call
        const sorData = parser.parse();
        expect(sorData.toJson()).toBe(JSON.stringify(parsedObject));
    });
});