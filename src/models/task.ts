import App from '~/core/appCore';
import { ApiTable, DatabaseCoreQuery } from '~/types/coreApiTypes';
import { DatabaseCore } from '~/core/dataBaseCore';
import { StandardError } from '~/core/class/standardError';
import { Model } from './base';
import { BaseModel } from '~/types/typeCore';

export class Task extends Model implements BaseModel {
    protected static override table = ApiTable.SCHEDULES;
    public id: number;
    public name: string;
    public description: string;
    public frequence: string;
    public method: string;
    public statut: TaskStatutEnum;
    public lastExecution: Date;
    public nextExecution: Date;
    public isActive: boolean;
    public total: number;
    public current: number;
    public addedAt: string;
    public updatedAt: string;
}

export type TaskPayload = {
    id: string;
    name: string;
    description: string;
    method: string;
    frequence: string;
    isActive: boolean;
};

export class ScheduleTask {
    public data: Task;
    private method: string;
    private db: DatabaseCore;
    constructor(m: string) {
        this.method = m;
    }

    public async init(): Promise<void> {
        this.db = new DatabaseCore(ApiTable.SCHEDULES, Object.keys(new Task()));
        const query: DatabaseCoreQuery<Task> = {
            where: {
                equals: {
                    method: this.method,
                },
            },
        };
        const rec = await this.db.getByQuery(query);
        if (rec.totalRecords < 1) {
            throw new StandardError('task.init', 'BAD_REQUEST', 'task_not_found', "la tache demandé n'existe pas", "la tache demandé n'existe pas");
        }
        this.data = rec.records[0];
    }

    public async updateCurrent(): Promise<void> {
        await this.init();
        if (this.data.current < this.data.total) {
            await App.query('UPDATE Schedules SET current = current + 1 WHERE ID = $1', this.data.id);
        }
    }
    public async updateTotal(total: number): Promise<void> {
        await this.init();
        await App.query('UPDATE Schedules SET total = $2 WHERE ID = $1', this.data.id, total);
    }
    public async setStatus(statut: TaskStatutEnum): Promise<void> {
        await this.init();
        await App.query('UPDATE Schedules SET statut = $2 WHERE ID = $1', this.data.id, statut);
    }
    public async endTask(): Promise<void> {
        await this.init();
        await App.query('UPDATE Schedules SET lastExecution = CURRENT_TIMESTAMP, statut = 2 WHERE ID = $1', this.data.id);
    }
}

export enum TaskStatutEnum {
    INIT = 0,
    ONGOING = 1,
    ENDED = 2,
}
