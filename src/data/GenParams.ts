import { ParseError } from "../util/error";
import { SorFiberType } from "../util/types";
import { Block } from "../util/class/Block";
import { SorBaseBlock } from "../util/class/SorBaseBlock";


export interface GenParamsDataV1 {
    blockName: string;
    version: number;
    lang: string;
    cableId: string;
    fiberId?: string | null;
    wavelengthNm: number;
    locationA: string;
    locationB: string;
    cableCode: string;
    buildCondition: string;
    userOffset: number;
    operator: string;
    comment: string;
}

export interface GenParamsDataV2 {
    blockName: string;
    version: number;
    lang: string;
    cableId: string;
    fiberId?: string | null;
    fiberType: SorFiberType;
    wavelengthNm: number;
    locationA: string;
    locationB: string;
    cableCode: string;
    buildCondition: string;
    userOffset: number;
    operator: string;
    comment: string;
}

export type GenParamsData = GenParamsDataV1 | GenParamsDataV2;

function classifyFiberType(fiberCode: number): SorFiberType {
    switch (fiberCode) {
        case 651: return SorFiberType.G651;
        case 652: return SorFiberType.G652;
        case 653: return SorFiberType.G653;
        case 654: return SorFiberType.G654;
        case 655: return SorFiberType.G655;
        default: return SorFiberType.UNKNOWN;
    }
}

export class GenParams extends SorBaseBlock<GenParamsData> {
    private data: GenParamsData;

    constructor(buffer: ArrayBuffer, block: Block) {
        super(buffer, block);

        switch (this.block.version) {
            case 1:
                this.data = this.parseV1();
                break;
            case 2:
                this.data = this.parseV2();
                break;
            default:
                throw new ParseError(`Unsupported GenParams version: ${this.block.version}`);
        }
    }

    public toObject(): GenParamsData {
        return this.data;
    }

    private parseV1(): GenParamsDataV1 {
        const blockName = this.reader.readNullTerminatedString();
        const lang = this.reader.readNullTerminatedString();
        const cableId = this.reader.readNullTerminatedString();

        const fiberId = this.parseFiberId();
        const wavelengthNm = this.reader.readInt16();
        const locationA = this.reader.readNullTerminatedString();
        const locationB = this.reader.readNullTerminatedString();
        const cableCode = this.reader.readNullTerminatedString();
        const buildCondition = this.reader.readFixedString(2);
        const userOffset = this.reader.readInt32();

        const operator = this.readBoundedString();
        const comment = this.readBoundedString();

        this.syncToBlockEnd();

        return {
            blockName,
            version: 1,
            lang,
            cableId,
            fiberId,
            wavelengthNm,
            locationA,
            locationB,
            cableCode,
            buildCondition,
            userOffset,
            operator,
            comment,
        };
    }

    private parseV2(): GenParamsDataV2 {
        const blockName = this.reader.readNullTerminatedString();
        const lang = this.reader.readNullTerminatedString();
        const cableId = this.reader.readNullTerminatedString();

        const fiberId = this.parseFiberId();
        const fiberType = this.reader.readUint16();
        const wavelengthNm = this.reader.readInt16();
        const locationA = this.reader.readNullTerminatedString();
        const locationB = this.reader.readNullTerminatedString();
        const cableCode = this.reader.readNullTerminatedString();
        const buildCondition = this.reader.readFixedString(2);
        const userOffset = this.reader.readInt32();

        const operator = this.readBoundedString();
        const comment = this.readBoundedString();

        this.syncToBlockEnd();

        return {
            blockName,
            version: 2,
            lang,
            cableId,
            fiberId,
            fiberType: classifyFiberType(fiberType),
            wavelengthNm,
            locationA,
            locationB,
            cableCode,
            buildCondition,
            userOffset,
            operator,
            comment,
        };
    }

    private parseFiberId(): string | undefined {
        const nextWord = this.reader.peekUint16();
        const isFiberType = [651, 652, 653, 654, 655, 656, 657].includes(nextWord);

        if (isFiberType) {
            return undefined;
        }
        return this.reader.readNullTerminatedString();
    }
}