import { Block } from "../util/class/Block";
import { SorBaseBlock } from "../util/class/SorBaseBlock";

export interface FxdParamsData {
    blockName: string;
    timestamp: number;
    dateTime: Date;
    unit: string;
    wavelengthNm: number;
    acquisitionOffset: number; // User offset distance (meters)
    acquisitionOffsetPulseWidth: number; // Pulse width offset
    numPulseWidthEntries: number;
    pulseWidthNs: number;
    sampleSpacingUnits: number; // Spacing scaling factor
    numDataPoints: number;
    ior: number; // Group Index of Refraction (e.g., 1.468)
    backscatterCoeffDb: number; // Backscattering coefficient (e.g., -79.5 dB)
    averagesCount: number;
    lossThreshold: number;
    reflectionThreshold: number;
    traceLengthMeters: number; // Total physical distance scanned
}

export class FxdParams extends SorBaseBlock<FxdParamsData> {
    private data: FxdParamsData;

    constructor(block: Block) {
        super(block);
        this.data = this.parse();
    }

    public parse(): FxdParamsData {
        // 1. Block Header ("FxdParams\0")
        const blockName = this.reader.readNullTerminatedString();

        // 2. Timestamp (Unix timestamp in seconds)
        const timestamp = this.reader.readUint32();
        const dateTime = new Date(timestamp * 1000);

        // 3. Units (2-byte ASCII fixed string, e.g., "km", "mt", "ft")
        const unit = this.reader.readFixedString(2);

        // 4. Optical Acquisition Settings
        const wavelengthNm = this.reader.readUint16() / 10; // Wavelength in 0.1 nm units
        const acqOffset = this.reader.readInt32() / 100; // Offset in centimeters -> meters
        const acqOffsetPulseWidth = this.reader.readInt32(); // Pulse width offset

        const numPulseWidthEntries = this.reader.readUint16();
        const pulseWidthNs = this.reader.readUint16(); // Pulse width in nanoseconds

        // 5. Sampling Parameters
        const sampleSpacingUnits = this.reader.readUint32() / 1e8; // Spacing scaling factor
        const numDataPoints = this.reader.readUint32();

        // 6. Refraction Index & Backscatter
        const rawIor = this.reader.readUint32();
        const ior = rawIor / 100000; // Group Index of Refraction (e.g., 146810 -> 1.4681)

        const rawBc = this.reader.readUint16();
        const backscatterCoeffDb = -(rawBc / 10); // dB value stored as positive integer * 10 (e.g. 795 -> -79.5 dB)

        // 7. Averaging count
        const averagesCount = this.reader.readUint32();
        const lossThreshold = this.reader.readUint16() / 1000;
        const reflectionThreshold = this.reader.readUint16() / 1000;

        // Calculate total distance covered by trace
        const traceLengthMeters = numDataPoints * sampleSpacingUnits;

        // Synchronize remaining vendor bytes
        this.syncToBlockEnd();

        return {
            blockName,
            timestamp,
            dateTime,
            unit,
            wavelengthNm,
            acquisitionOffset: acqOffset,
            acquisitionOffsetPulseWidth: acqOffsetPulseWidth,
            numPulseWidthEntries,
            pulseWidthNs,
            sampleSpacingUnits,
            numDataPoints,
            ior,
            backscatterCoeffDb,
            averagesCount,
            lossThreshold,
            reflectionThreshold,
            traceLengthMeters,
        };
    }

    public toObject(): FxdParamsData {
        return this.data;
    }
}