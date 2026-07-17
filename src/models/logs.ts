import { BaseModel } from '~/types/typeCore';
import { Model } from './base';
import { ApiTable } from '~/types/coreApiTypes';
export class Log extends Model implements BaseModel {
    protected static override table = ApiTable.LOGS;
    public id: number;
    public action: string;
    public description: string;
    public target: string;
    public call: string;
    public userId: number;
    public username: string;
    public userFullName: string;
    public ipAddress: string;
    public additionalData: string;
    public addedAt: string;
    public updatedAt: string;
}

export type LogPayload = {
    action: string;
    description: string;
    target: string;
    call: string;
    userId: number;
    ipAddress: string;
};
