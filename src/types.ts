export interface SorEvent {
    eventNumber: number;
    distanceMeters: number;
    slopeDbPerKm: number;
    spliceLossDb: number;
    reflectionLossDb: number;
    eventType: string;
}

export interface SorMetadata {
    cableId: string;
    fiberId: string;
    wavelengthNm: number;
    pulseWidthNs: number;
    rangeMeters: number;
    refractiveIndex: number;
    events: SorEvent[];
    dataPoints: number[];
}