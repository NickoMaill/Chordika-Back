import { BaseModel } from "~/types/typeCore";
import { Model } from "./base";
import { ApiTable } from "~/types/coreApiTypes";

export class DataText extends Model implements BaseModel {
    protected static override table = ApiTable.DATATEXT;
    public id: number;
    public type: string;
    public description: string;
    public code: string;
    public sortOrder: number;
    public addedAt: string;
    public updatedAt: string;
}
