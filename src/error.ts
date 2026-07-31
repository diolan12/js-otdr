
export class ChecksumError extends Error {
    constructor(msg: string) {
        super(msg);
    }
}

export class ParseError extends Error {
    constructor(msg: string) {
        super(msg);
    }
}