import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, parse as parsePath } from 'node:path';
import { parseArgs } from 'node:util';
import { SorParser } from './parser';

function main() {
    try {
        const { values, positionals } = parseArgs({
            options: {
                input: {
                    type: 'string',
                    short: 'i',
                },
                output: {
                    type: 'string',
                    short: 'o',
                },
            },
            strict: false,
            allowPositionals: true,
        });

        // Safely extract input path
        const rawInput = values.input;
        const inputPath = typeof rawInput === 'string' ? rawInput : positionals[0];

        if (!inputPath) {
            console.error('Error: Please provide a valid .sor file path.');
            process.exit(1);
        }

        const absoluteInputPath = resolve(process.cwd(), inputPath);
        const fileBuffer = readFileSync(absoluteInputPath);

        const arrayBuffer = fileBuffer.buffer.slice(
            fileBuffer.byteOffset,
            fileBuffer.byteOffset + fileBuffer.byteLength
        );

        // Parse trace
        const parser = new SorParser(arrayBuffer);
        const result = parser.parse();

        // Determine output file path (-o / --output flag or default to <input-filename>.json)
        const rawOutput = values.output;
        let outputPath: string;

        if (typeof rawOutput === 'string') {
            outputPath = resolve(process.cwd(), rawOutput);
        } else {
            const parsed = parsePath(absoluteInputPath);
            outputPath = resolve(parsed.dir, `${parsed.name}.json`);
        }

        // Convert BigInt / TypedArrays to standard arrays for JSON serialization
        const jsonOutput = JSON.stringify(
            result,
            (_, value) => {
                if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
                    return Array.from(value as any);
                }
                return value;
            },
            2
        );

        // Write directly to file
        writeFileSync(outputPath, jsonOutput, 'utf-8');
        console.log(`Saved JSON output to: ${outputPath}`);

    } catch (error) {
        console.error('Failed to parse SOR file:', (error as Error).message);
        process.exit(1);
    }
}

main();