import { Log } from '~/models/logs';
import TableController from './tableController';
import LogsModule from '~/module/logsModule';
import { AppParams, AppRequest, AppResponse, ControllerConfig } from '~/core/controllerBase';
import { StandardError } from '~/core/class/standardError';
import { UserAccessLevel } from '~/types/typeCore';

@ControllerConfig({ baseRoute: 'logs', accessLevel: UserAccessLevel.ADMIN })
class LogsController extends TableController<Log, null> {
    constructor() {
        super(LogsModule);
    }
    protected override update(_req: AppRequest<null, any>, _res: AppResponse<any>): Promise<void> {
        throw new StandardError('logController.create', 'UNAUTHORIZED', 'unauthorized', 'unauthorized route', 'unauthorized route');
    }
    protected override create(_req: AppRequest<null, any>, _res: AppResponse<any>): Promise<void> {
        throw new StandardError('logController.create', 'UNAUTHORIZED', 'unauthorized', 'unauthorized route', 'unauthorized route');
    }
    protected override delete(_req: AppParams<{ id: number }, any>, _res: AppResponse<any>): Promise<void> {
        throw new StandardError('logController.create', 'UNAUTHORIZED', 'unauthorized', 'unauthorized route', 'unauthorized route');
    }
}

export default new LogsController();
