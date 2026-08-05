import { Block } from "../util/class/Block";
import { SorBaseBlock } from "../util/class/SorBaseBlock";

export type DataPtsData = {
    blockName: string;
    numDataPoints: number;
    scalingFactor: number;
    rawPoints: Uint16Array;
    dbPoints: Float32Array;
};

export class DataPts extends SorBaseBlock<DataPtsData> {
    private data: DataPtsData;

    constructor(block: Block) {
        super(block);
        this.data = this.parse();
    }

    public parse(): DataPtsData {
        // 1. Block Header ("DataPts\0")
        const blockName = this.reader.readNullTerminatedString();

        // 2. Total points count & scaling factor configuration
        const numDataPoints = this.reader.readUint32();
        const numDataPoints2 = this.reader.readUint32(); // Duplicate/reserved count in spec
        const rawScaleFactor = this.reader.readUint16(); // Usually 1000 (0.001 dB resolution)

        const scalingFactor = rawScaleFactor > 0 ? 1 / rawScaleFactor : 0.001;

        // 3. Read raw Uint16 trace points array efficiently
        const rawPoints = new Uint16Array(numDataPoints);
        const dbPoints = new Float32Array(numDataPoints);

        for (let i = 0; i < numDataPoints; i++) {
            const rawVal = this.reader.readUint16(true); // Little-endian
            rawPoints[i] = rawVal;
            dbPoints[i] = rawVal * scalingFactor;
        }

        this.syncToBlockEnd();

        return {
            blockName,
            numDataPoints,
            scalingFactor,
            rawPoints,
            dbPoints,
        };
    }

    public toObject(): DataPtsData {
        return this.data;
    }
}