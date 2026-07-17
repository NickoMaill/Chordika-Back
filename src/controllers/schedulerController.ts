import { AppRequest, AppResponse, ControllerConfig, Get } from '~/core/controllerBase';
import logManager from '~/managers/logManager';
import { SchedulerManager } from '~/managers/schedulerManager';
import TableController from './tableController';
import ScheduleModule from '~/module/scheduleModule';
import { Task, TaskPayload } from '~/models/task';
import { UserAccessLevel } from '~/types/typeCore';

@ControllerConfig({ baseRoute: "schedules", accessLevel: UserAccessLevel.ADMIN })
class SchedulesController extends TableController<Task, TaskPayload> {
    constructor() {
        super(ScheduleModule);
    }

    @Get('/execAll', UserAccessLevel.SCHEDULE)
    private async execAll(req: AppRequest, res: AppResponse): Promise<void> {
        const sched = new SchedulerManager(req);
        await sched.execAll();
        res.json({ success: true });
    }

    @Get('/ping', UserAccessLevel.SCHEDULE)
    private async ping(_req: AppRequest, res: AppResponse): Promise<void> {
        logManager.setLog('schedule.ping', 'le scheduler à pingé le scheduler');
        res.json({ success: true });
    }

    @Get('/exec', UserAccessLevel.ADMIN)
    private async exec(_req: AppRequest, _res: AppResponse): Promise<void> {}

    @Get('/list', UserAccessLevel.ADMIN)
    private async getList(_req: AppRequest, _res: AppResponse): Promise<void> {}
}

export default new SchedulesController();
