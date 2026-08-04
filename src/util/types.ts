import { CksumData } from "../data/Cksum";
import { DataPtsData } from "../data/DataPts";
import { FxdParamsData } from "../data/FxdParams";
import { GenParamsData } from "../data/GenParams";
import { KeyEventsData } from "../data/KeyEvents";
import { SupParamsData } from "../data/SupParams";

export type SorEventType =
    | "Launch"
    | "Splice"
    | "Connector"
    | "End of Fiber"
    | "Macro-bend"
    | "Unknown";

export const SorEventType = {
    LAUNCH: 'Launch',
    SPLICE: 'Splice',
    CONNECTOR: 'Connector',
    ENDOFFIBER: 'End of Fiber',
    MACROBEND: 'Macro-bend',
    UNKNOWN: 'Unknown',
} as const;

export type SorFiberType = 'G.651 (50um core multimode)' | 'G.652 (standard SMF)' | 'G.653 (dispersion-shifted fiber)' | '"G.654 (1550nm loss-minimzed fiber)' | 'G.655 (nonzero dispersion-shifted fiber)' | 'unknown';

export const SorFiberType = {
    G651: 'G.651 (50um core multimode)',
    G652: 'G.652 (standard SMF)',
    G653: 'G.653 (dispersion-shifted fiber)',
    G654: '"G.654 (1550nm loss-minimzed fiber)',
    G655: 'G.655 (nonzero dispersion-shifted fiber)',
    UNKNOWN: 'unknown',
} as const;

export interface SorMetadata {
    GenParams: GenParamsData;
    SupParams: SupParamsData;
    FxdParams: FxdParamsData;
    Cksum: CksumData;
    DataPts: DataPtsData;
    KeyEvents: KeyEventsData;
}
