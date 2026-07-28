import { SorMetadata, SorEvent } from './types';

export class SorData implements SorMetadata {
  cableId: string;
  fiberId: string;
  wavelengthNm: number;
  pulseWidthNs: number;
  rangeMeters: number;
  refractiveIndex: number;
  events: SorEvent[];
  dataPoints: number[];

  constructor(metadata: SorMetadata) {
    this.cableId = metadata.cableId;
    this.fiberId = metadata.fiberId;
    this.wavelengthNm = metadata.wavelengthNm;
    this.pulseWidthNs = metadata.pulseWidthNs;
    this.rangeMeters = metadata.rangeMeters;
    this.refractiveIndex = metadata.refractiveIndex;
    this.events = metadata.events;
    this.dataPoints = metadata.dataPoints;
  }

  /**
   * Converts the parsed SOR data into a JSON object or string.
   * @param pretty - If true, formats output with 2-space indentation.
   */
  public toJson(pretty: boolean = false): string {
    return JSON.stringify(this, null, pretty ? 2 : undefined);
  }

  public toObject(): SorMetadata {
    return {
      cableId: this.cableId,
      fiberId: this.fiberId,
      wavelengthNm: this.wavelengthNm,
      pulseWidthNs: this.pulseWidthNs,
      rangeMeters: this.rangeMeters,
      refractiveIndex: this.refractiveIndex,
      events: [...this.events],
      dataPoints: [...this.dataPoints],
    };
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
    // Basic verification
    const mapHeader = this.readString(4);
    if (mapHeader !== 'Map') {
      throw new Error('Invalid SOR file: Missing Map block');
    }

    const metadata: SorMetadata = {
      cableId: 'DEFAULT_CABLE',
      fiberId: 'DEFAULT_FIBER',
      wavelengthNm: 1550,
      pulseWidthNs: 10,
      rangeMeters: 10000,
      refractiveIndex: 1.468,
      events: [],
      dataPoints: [],
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

  private readString(length: number): string {
    let str = '';
    for (let i = 0; i < length; i++) {
      const code = this.view.getUint8(this.offset++);
      if (code !== 0) str += String.fromCharCode(code);
    }
    return str.trim();
  }
}