import { BinaryReader } from "./BinaryReader";
import { Block } from "./Block";

export abstract class SorBaseBlock<TData> {
    protected reader: BinaryReader;
    protected block: Block;

    constructor(buffer: ArrayBuffer, block: Block) {
        this.block = block;
        this.reader = new BinaryReader(buffer, block.positionStart);
    }

    /** Derived classes implement this to return structured data */
    public abstract toObject(): TData;

    /** Guarantees stream cursor never leaves unread padding behind */
    protected syncToBlockEnd(): void {
        if (this.reader.currentOffset < this.block.positionEnd) {
            this.reader.seek(this.block.positionEnd);
        }
    }

    /** Safely read trailing optional strings within block boundaries */
    protected readBoundedString(): string {
        if (this.reader.currentOffset >= this.block.positionEnd) {
            return "";
        }
        return this.reader.readNullTerminatedString(this.block.positionEnd);
    }
}