import { Block } from "../util/class/Block";
import { SorBaseBlock } from "../util/class/SorBaseBlock";
import { ChecksumError } from "../util/error";

export type CksumData = {
    blockName: string;
    storedChecksum: number;
    calculatedChecksum: number;
    isValid: boolean;
    algorithmUsed?: string;
};

export class Cksum extends SorBaseBlock<CksumData> {
    private data: CksumData;

    constructor(block: Block) {
        super(block);
        try {
            this.data = this.parse();
        }
        catch (e) {
            throw new ChecksumError('Invalid SOR file: ' + e);
        }
    }

    public parse(): CksumData {
        // 1. Read block name ("Cksum\0")
        const blockName = this.reader.readNullTerminatedString();

        const checksumOffset = this.reader.currentOffset;

        // 2. Read stored 16-bit checksum
        const storedChecksum = this.reader.readUint16(true); // little-endian

        // 3. Test Algorithm Variants
        // Variant A: CRC-16 (0x1021, Seed 0xFFFF) up to checksum offset
        const crcCcitt1 = this.computeCrc16Ccitt(checksumOffset, 0xffff);
        if (storedChecksum === crcCcitt1) {
            return { blockName, storedChecksum, calculatedChecksum: crcCcitt1, isValid: true, algorithmUsed: "CRC-16-CCITT (0xFFFF)" };
        }

        // Variant B: CRC-16 (0x1021, Seed 0x0000)
        const crcCcitt0 = this.computeCrc16Ccitt(checksumOffset, 0x0000);
        if (storedChecksum === crcCcitt0) {
            return { blockName, storedChecksum, calculatedChecksum: crcCcitt0, isValid: true, algorithmUsed: "CRC-16-CCITT (0x0000)" };
        }

        // Variant C: Simple 16-bit Additive Sum (GR-196 Issue 1 legacy)
        const sum16 = this.computeSum16(checksumOffset);
        if (storedChecksum === sum16) {
            return { blockName, storedChecksum, calculatedChecksum: sum16, isValid: true, algorithmUsed: "16-Bit Additive Sum" };
        }

        // Variant D: Full File CRC (including Cksum block padding, checksum zeroed)
        const fullFileCrc = this.computeFullFileCrc(0xffff);
        if (storedChecksum === fullFileCrc) {
            return { blockName, storedChecksum, calculatedChecksum: fullFileCrc, isValid: true, algorithmUsed: "Full-File CRC-16" };
        }

        // Fallback return if file is modified / corrupted
        this.syncToBlockEnd();

        return {
            blockName,
            storedChecksum,
            calculatedChecksum: crcCcitt1,
            isValid: false,
        };
    }

    /** CRC-16-CCITT (Polynomial 0x1021) */
    private computeCrc16Ccitt(endOffset: number, seed: number): number {
        const bytes = new Uint8Array((this.reader as any).view.buffer, 0, endOffset);
        let crc = seed;

        for (let i = 0; i < bytes.length; i++) {
            crc ^= bytes[i] << 8;
            for (let j = 0; j < 8; j++) {
                if ((crc & 0x8000) !== 0) {
                    crc = ((crc << 1) ^ 0x1021) & 0xffff;
                } else {
                    crc = (crc << 1) & 0xffff;
                }
            }
        }
        return crc;
    }

    /** Simple 16-bit Unsigned Sum */
    private computeSum16(endOffset: number): number {
        const bytes = new Uint8Array((this.reader as any).view.buffer, 0, endOffset);
        let sum = 0;
        for (let i = 0; i < bytes.length; i++) {
            sum = (sum + bytes[i]) & 0xffff;
        }
        return sum;
    }

    /** Full file CRC with zeroed checksum field */
    private computeFullFileCrc(seed: number): number {
        const rawBuffer = (this.reader as any).view.buffer;
        const bytes = new Uint8Array(rawBuffer.slice(0)); // clone buffer

        // Zero out stored checksum bytes inside clone
        const checksumPos = this.block.positionStart + "Cksum\0".length;
        if (checksumPos + 1 < bytes.length) {
            bytes[checksumPos] = 0;
            bytes[checksumPos + 1] = 0;
        }

        let crc = seed;
        for (let i = 0; i < bytes.length; i++) {
            crc ^= bytes[i] << 8;
            for (let j = 0; j < 8; j++) {
                if ((crc & 0x8000) !== 0) {
                    crc = ((crc << 1) ^ 0x1021) & 0xffff;
                } else {
                    crc = (crc << 1) & 0xffff;
                }
            }
        }
        return crc;
    }

    public toObject(): CksumData {
        return this.data;
    }
}