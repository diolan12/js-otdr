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
    timestamp: number;
    wavelengthNm: number;
    pulseWidthNs: number;
    duration: number;
    rangeMeters: number;
    refractiveIndex: number;
    events: SorEvent[];
    dataPoints: number[];
}