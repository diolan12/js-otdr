import { CksumData } from "./data/Cksum";
import { DataPtsData } from "./data/DataPts";
import { FxdParamsData } from "./data/FxdParams";
import { GenParamsData } from "./data/GenParams";
import { KeyEventsData } from "./data/KeyEvents";
import { SupParamsData } from "./data/SupParams";
import { SorMetadata } from "./util/types";

export class SorData implements SorMetadata {
    GenParams: GenParamsData
    SupParams: SupParamsData
    FxdParams: FxdParamsData
    KeyEvents: KeyEventsData
    DataPts: DataPtsData
    Cksum: CksumData

    constructor(metadata: SorMetadata) {
        this.GenParams = metadata.GenParams
        this.SupParams = metadata.SupParams
        this.FxdParams = metadata.FxdParams
        this.KeyEvents = metadata.KeyEvents
        this.DataPts = metadata.DataPts
        this.Cksum = metadata.Cksum
    }

    public toJson(pretty: boolean = false): string {
        return JSON.stringify(this, null, pretty ? 2 : undefined)
    }

    public toObject(): SorMetadata {
        return {
            GenParams: this.GenParams,
            SupParams: this.SupParams,
            FxdParams: this.FxdParams,
            KeyEvents: this.KeyEvents,
            DataPts: this.DataPts,
            Cksum: this.Cksum,
        };
    }
}