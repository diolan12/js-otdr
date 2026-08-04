import { Block } from "../util/class/Block";
import { SorBaseBlock } from "../util/class/SorBaseBlock";

export type SupParamsData = {
    blockName: string;
    supplier: string
    otdr: string;
    otdrSn: string;
    module: string;
    moduleSn: string;
    software: string;
    other: string;
}

export class SupParams extends SorBaseBlock<SupParamsData> {
    private data: SupParamsData;
    constructor(buffer: ArrayBuffer, block: Block) {
        super(buffer, block);
        // 1. Skip / verify block name ("SupParams\0")
        const blockName = this.reader.readNullTerminatedString();

        // 2. Read hardware and software metadata strings
        const supplier = this.reader.readNullTerminatedString();
        const otdr = this.reader.readNullTerminatedString();
        const otdrSn = this.reader.readNullTerminatedString();
        const module = this.reader.readNullTerminatedString();
        const moduleSn = this.reader.readNullTerminatedString();
        const software = this.reader.readNullTerminatedString();

        // 3. Read remaining optional vendor text within block bounds
        const other = this.readBoundedString();

        // 4. Ensure stream cursor hits exact block boundary
        this.syncToBlockEnd();

        this.data = {
            blockName,
            supplier,
            otdr,
            otdrSn,
            module,
            moduleSn,
            software,
            other,
        };
    }
    public toObject(): SupParamsData {
        return this.data
    }
}