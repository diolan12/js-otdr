export type SorEventType = 'splice' | 'connector' | 'saturated' | 'unknown';

export type SorEventsTableRowType = SorEventType | 'launch' | 'fiber-section' | 'end-of-fiber';

export interface SorEvent {
    eventNumber: number;
    distanceMeters: number;
    slopeDbPerKm: number;
    spliceLossDb: number;
    reflectionLossDb: number;
    /** Raw SR-4731 event code, e.g. "0F9999LS". */
    typeCode: string;
    /** Classified from the first character of typeCode: 0 = splice, 1 = connector, 2 = saturated. */
    eventType: SorEventType;
}

export interface SorEventsTableRow {
    /** Event number from the file; 0 for a synthesized launch row, null for fiber-section rows. */
    eventNumber: number | null;
    type: SorEventsTableRowType;
    /** Absolute position of the event; null for fiber-section rows. */
    distanceMeters: number | null;
    /** Length of a fiber-section row; null for event rows. */
    sectionLengthMeters: number | null;
    lossDb: number | null;
    reflectanceDb: number | null;
}

export interface SorMetadata {
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
}
