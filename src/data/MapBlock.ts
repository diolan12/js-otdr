import { Block } from "../util/class/Block";
import { SorBaseBlock } from "../util/class/SorBaseBlock";
import { ParseError } from "../util/error";


export class MapBlock extends SorBaseBlock<Map<string, Block>> {
    private blocks: Map<string, Block>;

    constructor(buffer: ArrayBuffer) {
        // Map block always starts at byte offset 0
        const mapBlockMeta: Block = {
            name: "Map",
            version: 1,
            size: 0,
            positionStart: 0,
            positionEnd: 0,
            order: 0,
        };
        super(buffer, mapBlockMeta);

        this.blocks = new Map();

        // 1. Read Map Header
        const mapName = this.reader.readNullTerminatedString(); // Usually "Map"
        if (mapName !== 'Map') {
            throw new ParseError('Invalid SOR file: Missing Map block');
        }
        const rawMapVersion = this.reader.readUint16();
        const mapBlockSize = this.reader.readInt32();
        const totalBlocks = this.reader.readUint16(); // Total includes 'Map' itself!

        // Pointer tracking the byte offsets of consecutive blocks in sequence
        let currentOffset = mapBlockSize;

        // 2. Read remaining block directory entries (totalBlocks - 1)
        // Order starts at 2 because Map itself is block #1 in the Bellcore spec count
        for (let order = 2; order <= totalBlocks; order++) {
            const blockName = this.reader.readNullTerminatedString();
            const rawVersion = this.reader.readUint16();
            const size = this.reader.readInt32();

            // Guard rail against corrupt/invalid block entries
            if (!blockName || size <= 0 || size > this.reader.byteLength) {
                console.warn(
                    `[MapBlock] Stopping parse early at block order ${order} due to invalid block: "${blockName}" (size: ${size})`
                );
                break;
            }

            const version = rawVersion / 100; // e.g. 200 -> 2.0, 100 -> 1.0
            const positionStart = currentOffset;
            const positionEnd = currentOffset + size;

            this.blocks.set(blockName, {
                name: blockName,
                version,
                size,
                positionStart,
                positionEnd,
                order: order - 1, // Normalized 1-based index for non-map data blocks
            });

            // Advance pointer to the start of the next block
            currentOffset = positionEnd;
        }
    }

    public toObject(): Map<string, Block> {
        return this.blocks;
    }

    // --- Accessor Helpers ---

    public get(blockName: string): Block | undefined {
        return this.blocks.get(blockName);
    }

    public has(blockName: string): boolean {
        return this.blocks.has(blockName);
    }

    public values(): IterableIterator<Block> {
        return this.blocks.values();
    }
}