import ControllerBase, { AppRequest, AppResponse, ControllerConfig, Get, Post } from '~/core/controllerBase';
import toolManager from '~/managers/toolManager';
import { MonitorType, UserAccessLevel } from '~/types/typeCore';

@ControllerConfig({ accessLevel: UserAccessLevel.USER, baseRoute: 'tools' })
class ToolsController extends ControllerBase {
    @Get('/monitor', UserAccessLevel.VISITOR)
    public async GetMonitor(req: AppRequest, res: AppResponse<MonitorType>): Promise<void> {
        const mon = await toolManager.GetMonitorInfo(req);
        res.json(mon);
    }

    @Post('/sqltest', UserAccessLevel.ADMIN)
    public async SQLTest(req: AppRequest<{ sqlStr: string; columns: string }>, res: AppResponse): Promise<void> {
        const result = await toolManager.execSQLTest(req.body);
        res.json(result);
    }
}

export default new ToolsController();
