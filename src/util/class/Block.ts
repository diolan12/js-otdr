export interface Block {
    readonly name: string;
    readonly version: number;
    readonly size: number;
    readonly positionStart: number;
    readonly positionEnd: number;
    readonly order: number;
}