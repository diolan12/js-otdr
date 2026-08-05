import { Block } from "../util/class/Block";
import { SorBaseBlock } from "../util/class/SorBaseBlock";
import { SPEED_OF_LIGHT } from "../util/const";
import { FxdParamsData } from "./FxdParams";
import { SorEventType } from "../util/types";

export type KeyEventsFormatVersion = 1 | 2;

interface KeyEventBase {
    eventNumber: number;
    distanceKm: number;
    slopeDbPerKm: number;
    spliceLossDb: number;
    reflectionLossDb: number;
    isReflective: boolean;
    rawType: string;
    eventType: SorEventType;
    isManual: boolean;
    comment: string;
}

/** Issue 1: no optical marker offsets, 6-char event code, Int16 reflectance. */
export interface KeyEventV1 extends KeyEventBase { }

/** Issue 2: adds optical marker offsets, 8-char event code, Int32 reflectance. */
export interface KeyEventV2 extends KeyEventBase {
    endPrevKm: number;
    startCurrKm: number;
    endCurrKm: number;
    startNextKm: number;
    peakKm: number;
}

export type KeyEvent = KeyEventV1 | KeyEventV2;

export interface KeyEventsSummaryV1 {
    totalLossDb: number;
    lossStartKm: number;
    lossFinishKm: number;
    orlDb: number;
    totalScanRangeKm: number;
}

export interface KeyEventsSummaryV2 extends KeyEventsSummaryV1 {
    orlStartKm: number;
    orlFinishKm: number;
}

export type KeyEventsSummary = KeyEventsSummaryV1 | KeyEventsSummaryV2;

export interface KeyEventsDataV1 {
    blockName: string;
    numEvents: number;
    events: KeyEventV1[];
    summary: KeyEventsSummaryV1;
}

export interface KeyEventsDataV2 {
    blockName: string;
    numEvents: number;
    events: KeyEventV2[];
    summary: KeyEventsSummaryV2;
}

export type KeyEventsData = KeyEventsDataV1 | KeyEventsDataV2;

/** No-reflection sentinel used by Issue 1 files (Int16 field). */
const ISSUE1_NO_REFLECTANCE = -32768;
/** No-reflection sentinel used by Issue 2 files (Int32 field). */
const ISSUE2_NO_REFLECTANCE = -2147483648;

const round3 = (n: number): number => parseFloat(n.toFixed(3));

export class KeyEvents extends SorBaseBlock<KeyEventsData> {
    private data: KeyEventsData;
    private formatVersion: KeyEventsFormatVersion;

    constructor(
        block: Block,
        private fxdParams: FxdParamsData,
    ) {
        super(block);

        // Version lives on the block directory entry itself, not something this
        // block infers from its own bytes.
        const rawVersion = block.version;
        if (rawVersion !== 1 && rawVersion !== 2) {
            throw new Error(
                `Unsupported KeyEvents format version: ${rawVersion}. Only versions 1 and 2 are supported.`
            );
        }
        this.formatVersion = rawVersion;

        this.data = this.parse();
    }

    public parse(): KeyEventsData {
        // Present at the start of every version but not otherwise used downstream.
        this.reader.readNullTerminatedString();
        const numEvents = this.reader.readUint16();

        // Exact distance conversion factor to Kilometers.
        // Raw distance counts are already one-way (round-trip halving is baked
        // into the instrument's raw encoding) — do NOT divide by 2, and
        // SPEED_OF_LIGHT is already km/µs so no /1000 either. Verified against
        // a real .sor file: reproduces reference distances to the millimeter.
        const distanceFactor = (1e-4 * SPEED_OF_LIGHT) / this.fxdParams.ior;

        // Full acquisition range, independent of any detected KeyEvent — sourced
        // from FxdParams, which already computes it.
        const totalScanRangeKm = round3(this.fxdParams.traceLengthMeters / 1000);

        if (this.formatVersion === 1) {
            const events: KeyEventV1[] = [];
            for (let i = 0; i < numEvents; i++) {
                events.push(this.readEventV1(distanceFactor, i === 0, i === numEvents - 1));
            }
            const summary = this.readSummary(distanceFactor, false, totalScanRangeKm);
            this.syncToBlockEnd();
            return { blockName: this.block.name, numEvents, events, summary };
        }

        const events: KeyEventV2[] = [];
        for (let i = 0; i < numEvents; i++) {
            events.push(this.readEventV2(distanceFactor, i === 0, i === numEvents - 1));
        }
        const summary = this.readSummary(distanceFactor, true, totalScanRangeKm);
        this.syncToBlockEnd();
        return { blockName: this.block.name, numEvents, events, summary };
    }

    private readEventV1(distanceFactor: number, isFirst: boolean, isLast: boolean): KeyEventV1 {
        const eventNumber = this.reader.readUint16();
        const distanceKm = this.reader.readUint32() * distanceFactor;
        const slopeDbPerKm = this.reader.readInt16() * 0.001;
        const spliceLossDb = this.reader.readInt16() * 0.001;

        const rawRefl = this.reader.readInt16();
        const reflectionLossDb = rawRefl === ISSUE1_NO_REFLECTANCE ? 0 : rawRefl * 0.001;
        const rawType = this.reader.readFixedString(6);

        const comment = this.reader.readNullTerminatedString();
        const decoded = this.decodeBellcoreCode(rawType, isFirst, isLast);

        return {
            eventNumber,
            distanceKm: round3(distanceKm),
            slopeDbPerKm: round3(slopeDbPerKm),
            spliceLossDb: round3(spliceLossDb),
            reflectionLossDb: round3(reflectionLossDb),
            isReflective: rawRefl !== ISSUE1_NO_REFLECTANCE,
            rawType,
            eventType: decoded.eventType,
            isManual: decoded.isManual,
            comment,
        };
    }

    private readEventV2(distanceFactor: number, isFirst: boolean, isLast: boolean): KeyEventV2 {
        const eventNumber = this.reader.readUint16();
        const distanceKm = this.reader.readUint32() * distanceFactor;
        const slopeDbPerKm = this.reader.readInt16() * 0.001;
        const spliceLossDb = this.reader.readInt16() * 0.001;

        const rawRefl = this.reader.readInt32();
        // Only the documented sentinel means "not measured" — a genuine 0.000 dB
        // reflectance is valid data and must not be collapsed into the same case.
        const reflectionLossDb = rawRefl === ISSUE2_NO_REFLECTANCE ? 0 : rawRefl * 0.001;
        const rawType = this.reader.readFixedString(8);

        const endPrevKm = this.reader.readUint32() * distanceFactor;
        const startCurrKm = this.reader.readUint32() * distanceFactor;
        const endCurrKm = this.reader.readUint32() * distanceFactor;
        const startNextKm = this.reader.readUint32() * distanceFactor;
        const peakKm = this.reader.readUint32() * distanceFactor;

        const comment = this.reader.readNullTerminatedString();
        const decoded = this.decodeBellcoreCode(rawType, isFirst, isLast);

        return {
            eventNumber,
            distanceKm: round3(distanceKm),
            slopeDbPerKm: round3(slopeDbPerKm),
            spliceLossDb: round3(spliceLossDb),
            reflectionLossDb: round3(reflectionLossDb),
            isReflective: rawRefl !== ISSUE2_NO_REFLECTANCE,
            rawType,
            eventType: decoded.eventType,
            isManual: decoded.isManual,
            endPrevKm: round3(endPrevKm),
            startCurrKm: round3(startCurrKm),
            endCurrKm: round3(endCurrKm),
            startNextKm: round3(startNextKm),
            peakKm: round3(peakKm),
            comment,
        };
    }

    private readSummary(
        distanceFactor: number,
        isV2: true,
        totalScanRangeKm: number
    ): KeyEventsSummaryV2;
    private readSummary(
        distanceFactor: number,
        isV2: false,
        totalScanRangeKm: number
    ): KeyEventsSummaryV1;
    private readSummary(
        distanceFactor: number,
        isV2: boolean,
        totalScanRangeKm: number
    ): KeyEventsSummaryV1 | KeyEventsSummaryV2 {
        const totalLossDb = this.reader.readInt32() * 0.001;
        const lossStartKm = this.reader.readInt32() * distanceFactor;
        const lossFinishKm = this.reader.readUint32() * distanceFactor;
        const orlDb = this.reader.readUint16() * 0.001;

        const base: KeyEventsSummaryV1 = {
            totalLossDb: round3(totalLossDb),
            lossStartKm: round3(lossStartKm),
            lossFinishKm: round3(lossFinishKm),
            orlDb: round3(orlDb),
            totalScanRangeKm,
        };

        if (!isV2) return base;

        const orlStartKm = this.reader.readInt32() * distanceFactor;
        const orlFinishKm = this.reader.readUint32() * distanceFactor;

        return {
            ...base,
            orlStartKm: round3(orlStartKm),
            orlFinishKm: round3(orlFinishKm),
        };
    }

    /**
     * Decode standard 6-char or 8-char Bellcore / Telcordia event code matrix.
     */
    private decodeBellcoreCode(
        code: string,
        isFirst: boolean,
        isLast: boolean
    ): { eventType: SorEventType; isManual: boolean } {
        if (!code || code.length < 2) {
            return { eventType: SorEventType.UNKNOWN, isManual: false };
        }

        const subType = code.charAt(0);      // '0' = Normal, '1' = End of Transmission (EOT), '2' = Manual
        const reflectType = code.charAt(1);  // Event classification ('F', 'C', 'S', 'E', 'M', etc.)

        // Character '2' at pos 0 indicates manually added event in GR-196
        const isManual = subType === "2";

        // 1. End of Fiber (EOT flag '1', 'E' event type, or last event)
        if (subType === "1" || reflectType === "E" || isLast) {
            return { eventType: SorEventType.ENDOFFIBER, isManual };
        }

        // 2. Launch / Start of Fiber
        if (isFirst) {
            return { eventType: SorEventType.LAUNCH, isManual };
        }

        // 3. Macrobend
        if (reflectType === "M") {
            return { eventType: SorEventType.MACROBEND, isManual };
        }

        // 4. Reflective Events (Connector / Reflection Peak)
        if (reflectType === "C" || reflectType === "R") {
            return { eventType: SorEventType.CONNECTOR, isManual };
        }

        // 5. Non-Reflective / Flat Events (Fusion Splice / Step Loss)
        // 'F' = Flat / Non-Reflective, 'S' = Splice, 'N' = Non-reflective drop
        if (reflectType === "F" || reflectType === "S" || reflectType === "N") {
            return { eventType: SorEventType.SPLICE, isManual };
        }

        return { eventType: SorEventType.UNKNOWN, isManual };
    }

    public toObject(): KeyEventsData {
        return this.data;
    }
}