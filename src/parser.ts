import { SorMetadata, SorEvent, SorEventType, SorEventsTableRow } from './types';

export class SorData implements SorMetadata {
	cableId: string;
	fiberId: string;
	timestamp: number;
	wavelengthNm: number;
	pulseWidthNs: number;
	duration: number;
	rangeMeters: number;
	refractiveIndex: number;
	endToEndLossDb: number;
	opticalReturnLossDb: number;
	events: SorEvent[];
	dataPoints: number[];

	constructor(metadata: SorMetadata) {
		this.cableId = metadata.cableId;
		this.fiberId = metadata.fiberId;
		this.timestamp = metadata.timestamp;
		this.wavelengthNm = metadata.wavelengthNm;
		this.pulseWidthNs = metadata.pulseWidthNs;
		this.duration = metadata.duration;
		this.rangeMeters = metadata.rangeMeters;
		this.refractiveIndex = metadata.refractiveIndex;
		this.endToEndLossDb = metadata.endToEndLossDb;
		this.opticalReturnLossDb = metadata.opticalReturnLossDb;
		this.events = metadata.events;
		this.dataPoints = metadata.dataPoints;
	}

	public toJson(pretty: boolean = false): string {
		return JSON.stringify(this, null, pretty ? 2 : undefined);
	}

	public toObject(): SorMetadata {
		return {
			cableId: this.cableId,
			fiberId: this.fiberId,
			timestamp: this.timestamp,
			wavelengthNm: this.wavelengthNm,
			pulseWidthNs: this.pulseWidthNs,
			duration: this.duration,
			rangeMeters: this.rangeMeters,
			refractiveIndex: this.refractiveIndex,
			endToEndLossDb: this.endToEndLossDb,
			opticalReturnLossDb: this.opticalReturnLossDb,
			events: [...this.events],
			dataPoints: [...this.dataPoints],
		};
	}

	/**
	 * Builds an OTDR-style events table: a launch row at 0 m, a fiber-section
	 * row between consecutive events, and the last event rendered as end-of-fiber.
	 */
	public getEventsTable(): SorEventsTableRow[] {
		const rows: SorEventsTableRow[] = [];
		const events = [...this.events].sort((a, b) => a.distanceMeters - b.distanceMeters);
		if (events.length === 0) return rows;

		let prevDistance = 0;
		if (events[0].distanceMeters > 0) {
			rows.push({
				eventNumber: 0,
				type: 'launch',
				distanceMeters: 0,
				sectionLengthMeters: null,
				lossDb: null,
				reflectanceDb: null,
			});
		}

		for (let i = 0; i < events.length; i++) {
			const event = events[i];
			if (event.distanceMeters > prevDistance) {
				rows.push({
					eventNumber: null,
					type: 'fiber-section',
					distanceMeters: null,
					sectionLengthMeters: event.distanceMeters - prevDistance,
					lossDb: null,
					reflectanceDb: null,
				});
			}

			const isFirst = i === 0 && event.distanceMeters === 0;
			const isLast = i === events.length - 1;
			rows.push({
				eventNumber: event.eventNumber,
				type: isFirst ? 'launch' : isLast ? 'end-of-fiber' : event.eventType,
				distanceMeters: event.distanceMeters,
				sectionLengthMeters: null,
				lossDb: event.spliceLossDb !== 0 ? event.spliceLossDb : null,
				reflectanceDb: event.reflectionLossDb !== 0 ? event.reflectionLossDb : null,
			});
			prevDistance = event.distanceMeters;
		}

		return rows;
	}
}

function classifyEventType(typeCode: string): SorEventType {
	switch (typeCode.charAt(0)) {
		case '0': return 'splice';
		case '1': return 'connector';
		case '2': return 'saturated';
		default: return 'unknown';
	}
}

export class SorParser {
	private view: DataView;
	private offset: number = 0;
	private parsedData: SorData | null = null;

	constructor(buffer: ArrayBuffer) {
		this.view = new DataView(buffer);
	}

	public parse(): SorData {
		this.offset = 0;
		const mapHeader = this.readStringLength(0, 4);
		if (mapHeader !== 'Map') {
			throw new Error('Invalid SOR file: Missing Map block');
		}

		const metadata: SorMetadata = {
			cableId: 'DEFAULT_CABLE',
			fiberId: 'DEFAULT_FIBER',
			timestamp: 0,
			wavelengthNm: 1550,
			pulseWidthNs: 10,
			duration: 0,
			rangeMeters: 10000,
			refractiveIndex: 1.468,
			endToEndLossDb: 0,
			opticalReturnLossDb: 0,
			events: [],
			dataPoints: [],
		};

		if (this.view.byteLength >= 12) {
			const numBlocks = this.view.getInt16(10, true);
			let mapPos = 12;
			let blockOffset = this.view.getInt32(6, true);

			for (let i = 0; i < numBlocks; i++) {
				const blockName = this.readNullTerminatedString(mapPos);
				mapPos = blockName.nextOffset;
				const blockRev = this.view.getUint16(mapPos, true);
				mapPos += 2;
				const blockSize = this.view.getInt32(mapPos, true);
				mapPos += 4;

				if (blockName.str === 'GenParams') {
					let pos = blockOffset;
					const header = this.readNullTerminatedString(pos);
					if (header.str === 'GenParams') {
						pos = header.nextOffset;
						const lang = this.readNullTerminatedString(pos); pos = lang.nextOffset;
						const cableId = this.readNullTerminatedString(pos); pos = cableId.nextOffset;
						const fiberId = this.readNullTerminatedString(pos); pos = fiberId.nextOffset;

						metadata.cableId = cableId.str;
						metadata.fiberId = fiberId.str;
					}
				} else if (blockName.str === 'FxdParams') {
					let pos = blockOffset;
					const header = this.readNullTerminatedString(pos);
					if (header.str === 'FxdParams') {
						pos = header.nextOffset;

						const timestampUnix = this.view.getUint32(pos, true); pos += 4;
						metadata.timestamp = timestampUnix;



						const units = this.readStringLength(pos, 2); pos += 2;
						const wavelength = this.view.getUint16(pos, true) / 10; pos += 2;
						pos += 4; // acquisition offset (int32)
						pos += 4; // acquisition offset distance (int32)

						// --- PULSE WIDTH ARRAY START ---
						// Each entry is 10 bytes: pulseWidth (2B) + sampleSpacing (4B) + numDataPts (4B)
						const numPulse = this.view.getUint16(pos, true); pos += 2;

						let pulseWidth = 0;
						let sampleSpacing = 0;
						let numDataPts = 0;

						for (let p = 0; p < numPulse; p++) {
							pulseWidth = this.view.getUint16(pos, true); pos += 2;
							sampleSpacing = this.view.getUint32(pos, true); pos += 4;
							numDataPts = this.view.getUint32(pos, true); pos += 4; // <--- MUST be read inside loop
						}
						// --- PULSE WIDTH ARRAY END ---

						// Now offsets strictly match SR-4731 spec:
						const refractiveIndex = this.view.getUint32(pos, true) / 100000; pos += 4;
						pos += 2; // backscatter coefficient (int16)
						pos += 4; // number of averages (uint32)

						// --- DURATION / AVERAGING TIME ---
						// 2-byte unsigned integer stored in units of 0.1 seconds (SR-4731 spec)
						const avgTimeRaw = this.view.getUint16(pos, true); pos += 2; // averaging time (uint16)
						metadata.duration = avgTimeRaw / 10;

						const rawRange = this.view.getInt32(pos, true); pos += 4;

						metadata.wavelengthNm = wavelength;
						metadata.pulseWidthNs = pulseWidth;
						metadata.refractiveIndex = refractiveIndex;

						// --- CALCULATE EXACT TRACE DISTANCE IN METERS ---
						// sampleSpacing is in 0.01 picoseconds (1e-14 seconds)
						const sampleSpacingSec = sampleSpacing * 1e-14;
						const totalTimeSec = numDataPts * sampleSpacingSec;

						// Speed of light c = 2.99792458e8 m/s
						// No division by 2 needed as SR-4731 sampleSpacing represents one-way time interval
						const c = 2.99792458e8;
						const calculatedRangeMeters = (totalTimeSec * c) / metadata.refractiveIndex;

						metadata.rangeMeters = Math.round(calculatedRangeMeters); // Outputs 102669
					}
				} else if (blockName.str === 'KeyEvents') {
					let pos = blockOffset;
					const header = this.readNullTerminatedString(pos);
					if (header.str === 'KeyEvents') {
						pos = header.nextOffset;
						const numEvents = this.view.getInt16(pos, true); pos += 2;
						const refractiveIndex = metadata.refractiveIndex || 1.468;

						for (let e = 0; e < numEvents; e++) {
							const eventNum = this.view.getInt16(pos, true); pos += 2;
							const eventLoc = this.view.getInt32(pos, true); pos += 4;
							const slope = this.view.getInt16(pos, true) / 1000; pos += 2;
							const spliceLoss = this.view.getInt16(pos, true) / 1000; pos += 2;
							const rawReflLoss = this.view.getInt32(pos, true); pos += 4;
							const reflLoss = rawReflLoss === -2147483648 ? 0 : rawReflLoss / 1000;
							const typeCode = this.readStringLength(pos, 8); pos += 8;
							if (blockRev >= 200) {
								// SR-4731 rev >= 2.00 adds five 4-byte marker positions
								// (end of previous, start/end of current, start of next, peak)
								pos += 20;
							}
							const comment = this.readNullTerminatedString(pos); pos = comment.nextOffset;

							// eventLoc is in 100 ps units of one-way travel time
							// (same convention as sampleSpacing above, so no division by 2)
							const timeSec = eventLoc * 1e-10;
							const distanceMeters = timeSec * 2.99792458e8 / refractiveIndex;

							metadata.events.push({
								eventNumber: eventNum,
								distanceMeters: Math.round(distanceMeters),
								slopeDbPerKm: slope,
								spliceLossDb: spliceLoss,
								reflectionLossDb: reflLoss,
								typeCode,
								eventType: classifyEventType(typeCode),
							});
						}

						// Block trailer: end-to-end loss (int32, 0.001 dB), two end-to-end
						// marker positions (int32 each), optical return loss (uint16, 0.001 dB)
						if (pos + 14 <= this.view.byteLength) {
							metadata.endToEndLossDb = this.view.getInt32(pos, true) / 1000; pos += 4;
							pos += 8;
							metadata.opticalReturnLossDb = this.view.getUint16(pos, true) / 1000;
						}
					}
				} else if (blockName.str === 'DataPts') {
					let pos = blockOffset;
					const header = this.readNullTerminatedString(pos);
					if (header.str === 'DataPts') {
						pos = header.nextOffset;
						const totalPts = this.view.getUint32(pos, true); pos += 4;
						const numTraces = this.view.getUint16(pos, true); pos += 2;
						const tracePts = this.view.getUint32(pos, true); pos += 4;
						const scaleFactor = this.view.getUint16(pos, true); pos += 2;

						for (let p = 0; p < tracePts; p++) {
							const rawVal = this.view.getUint16(pos, true); pos += 2;
							const valDb = (rawVal * scaleFactor) / 1000 / 1000;
							metadata.dataPoints.push(Math.round(valDb * 1000) / 1000);
						}
					}
				}

				blockOffset += blockSize;
			}
		}

		this.parsedData = new SorData(metadata);
		return this.parsedData;
	}

	public toJson(pretty: boolean = false): string {
		if (!this.parsedData) {
			this.parse();
		}
		return this.parsedData!.toJson(pretty);
	}

	private readNullTerminatedString(offset: number): { str: string; nextOffset: number } {
		let str = '';
		let cur = offset;
		while (cur < this.view.byteLength) {
			const code = this.view.getUint8(cur++);
			if (code === 0) break;
			str += String.fromCharCode(code);
		}
		return { str: str.trim(), nextOffset: cur };
	}

	private readStringLength(offset: number, length: number): string {
		let str = '';
		for (let i = 0; i < length; i++) {
			if (offset + i >= this.view.byteLength) break;
			const code = this.view.getUint8(offset + i);
			if (code !== 0) str += String.fromCharCode(code);
		}
		return str.trim();
	}
}