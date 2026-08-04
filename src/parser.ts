import { ChecksumError, ParseError } from './util/error';
import { SorMetadata } from './util/types';
import { GenParams } from './data/GenParams';
import { MapBlock } from './data/MapBlock';
import { SupParams } from './data/SupParams';
import { FxdParams } from './data/FxdParams';
import { Cksum } from './data/Cksum';
import { DataPts } from './data/DataPts';
import { KeyEvents } from './data/KeyEvents';
import { SorData } from './data';

export class SorParser {
	private buffer: ArrayBuffer;
	private parsedData: SorData | null = null;

	private GenParams: GenParams;
	private SupParams: SupParams;
	private FxdParams: FxdParams;
	private KeyEvents: KeyEvents;
	private DataPts: DataPts;
	private Cksum: Cksum;

	constructor(buffer: ArrayBuffer) {
		this.buffer = buffer;

		const mapBlock = new MapBlock(this.buffer).toObject();

		const genParams = mapBlock.get('GenParams');
		if (!genParams)
			throw new ParseError('Invalid SOR file: Missing GenParams block');

		this.GenParams = new GenParams(this.buffer, genParams);

		const supParams = mapBlock.get('SupParams');
		if (!supParams)
			throw new ParseError('Invalid SOR file: Missing SupParams block');
		this.SupParams = new SupParams(this.buffer, supParams);

		const fxdParams = mapBlock.get('FxdParams');
		if (!fxdParams)
			throw new ParseError('Invalid SOR file: Missing FxdParams block');
		this.FxdParams = new FxdParams(this.buffer, fxdParams);

		const dataPts = mapBlock.get('DataPts');
		if (!dataPts)
			throw new ParseError('Invalid SOR file: Missing DataPts block');
		this.DataPts = new DataPts(this.buffer, dataPts);

		const keyEvents = mapBlock.get('KeyEvents');
		if (!keyEvents)
			throw new ParseError('Invalid SOR file: Missing KeyEvents block');
		this.KeyEvents = new KeyEvents(this.buffer, keyEvents, this.FxdParams.toObject());

		const cksum = mapBlock.get('Cksum');
		if (!cksum)
			throw new ChecksumError('Invalid SOR file: Missing Cksum block');
		this.Cksum = new Cksum(this.buffer, cksum);
	}

	public parse(): SorData {
		const metadata: SorMetadata = {
			GenParams: this.GenParams.toObject(),
			SupParams: this.SupParams.toObject(),
			FxdParams: this.FxdParams.toObject(),
			KeyEvents: this.KeyEvents.toObject(),
			DataPts: this.DataPts.toObject(),
			Cksum: this.Cksum.toObject(),
		};

		this.parsedData = new SorData(metadata);
		return this.parsedData;
	}

	public toJson(pretty: boolean = false): string {
		if (!this.parsedData) {
			this.parse();
		}
		return this.parsedData!.toJson(pretty);
	}
}
