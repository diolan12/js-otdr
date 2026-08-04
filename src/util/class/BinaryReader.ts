export class BinaryReader {
    protected view: DataView;
    private offset: number = 0;

    constructor(buffer: ArrayBuffer, initialOffset: number = 0) {
        this.view = new DataView(buffer);
        this.offset = initialOffset;
    }

    public get currentOffset(): number {
        return this.offset;
    }

    public seek(position: number): void {
        this.offset = position;
    }

    public get byteLength(): number {
        return this.view.byteLength;
    }

    // --- Integers ---

    public readInt16(littleEndian: boolean = true): number {
        const val = this.view.getInt16(this.offset, littleEndian);
        this.offset += 2;
        return val;
    }

    public readUint16(littleEndian: boolean = true): number {
        const val = this.view.getUint16(this.offset, littleEndian);
        this.offset += 2;
        return val;
    }

    public readInt32(littleEndian: boolean = true): number {
        const val = this.view.getInt32(this.offset, littleEndian);
        this.offset += 4;
        return val;
    }

    public readUint32(littleEndian: boolean = true): number {
        const val = this.view.getUint32(this.offset, littleEndian);
        this.offset += 4;
        return val;
    }

    public peekUint16(littleEndian: boolean = true): number {
        return this.view.getUint16(this.offset, littleEndian);
    }

    // --- Strings ---

    public readNullTerminatedString(maxOffset?: number): string {
        let str = "";
        const limit = maxOffset ?? this.view.byteLength;

        while (this.offset < limit) {
            const charCode = this.view.getUint8(this.offset++);
            if (charCode === 0) break;
            str += String.fromCharCode(charCode);
        }
        return str;
    }

    public readFixedString(length: number): string {
        let str = "";
        for (let i = 0; i < length; i++) {
            const charCode = this.view.getUint8(this.offset + i);
            if (charCode !== 0) {
                str += String.fromCharCode(charCode);
            }
        }
        this.offset += length;
        return str;
    }
}