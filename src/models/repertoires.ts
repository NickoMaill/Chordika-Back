import { ApiTable } from '~/types/coreApiTypes';
import { BaseModel } from '~/types/typeCore';
import { Model } from '~/models/base';

export class Repertoire extends Model implements BaseModel {
    protected static override table = ApiTable.REPERTOIRES;
    public id: number;
    public userId: number;
    public userName: string;
    public title: string;
    public addedAt: string;
    public updatedAt: string;
}

export type RepertoirePayload = {
    title: string;
    userId: number;
}