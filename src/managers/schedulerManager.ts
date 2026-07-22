import { AppRequest } from '~/core/controllerBase';
import { StandardError } from '~/core/class/standardError';
import { ScheduleTask, Task, TaskStatutEnum } from '~/models/task';
import { DatabaseCore } from '~/core/dataBaseCore';
import { ApiTable, DatabaseCoreQuery } from '~/types/coreApiTypes';
import cronParser from 'cron-parser';
import DateTime from '~/core/class/DateTime';

export class SchedulerManager {
    private Request: AppRequest;
    private task: ScheduleTask;
    constructor(req: AppRequest) {
        this.Request = req;
    }

    // public --> start region /////////////////////////////////////////////
    public async execAll(): Promise<void> {
        const db = new DatabaseCore(ApiTable.SCHEDULES, Object.keys(new Task()));
        const query: DatabaseCoreQuery<Task> = {
            where: {
                equals: {
                    isActive: true,
                    statut: [TaskStatutEnum.ENDED, TaskStatutEnum.INIT],
                },
            },
        };
        const tasks = await db.getByQuery(query);
        for await (const t of tasks.records) {
            const interval = cronParser.parse(t.frequence);
            const next = interval.next().toDate().getTime();
            const prev = interval.prev().toDate().getTime();
            const now = DateTime.now.getTime();
            if (now >= prev && now < next && (!t.lastExecution || new DateTime(t.lastExecution).getTime() < prev)) {
                console.log(t.method + ' ' + 'launched');
                await this.exec(t.method);
            } else {
                continue;
            }
        }
    }
    public async exec(exec: string = this.Request.params.do): Promise<void> {
        this.task = new ScheduleTask(exec);
        await this.task.init();

        if (this.task.data.statut !== TaskStatutEnum.ONGOING) {
            await this.task.setStatus(TaskStatutEnum.ONGOING);
            try {
                switch (exec.toLowerCase()) {
                    default:
                        throw new StandardError('schedule.exec', 'BAD_REQUEST', 'unknown_schedule', 'tâche inconnu', "La tâche a exécuter n'existe pas");
                }
            } catch (error) {
                await this.task.endTask();
                if (error instanceof StandardError) {
                    throw new StandardError('schedule.exec', error.status, error.code, error.message, error.detailedMessage, true, error.data);
                } else {
                    throw new StandardError('schedule.exec', 'BAD_REQUEST', 'error_happened', error.message, error.message, true);
                }
            }
        }
    }
    // public --> end region ///////////////////////////////////////////////

    // private --> start region ////////////////////////////////////////////
    // private --> end region //////////////////////////////////////////////
}
