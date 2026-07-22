import logManager from '~/managers/logManager';
import ControllerBase, { AppRequest, AppResponse, ControllerConfig, Get } from '../core/controllerBase';
import { UserAccessLevel } from '~/types/typeCore';

@ControllerConfig({ baseRoute: '', accessLevel: UserAccessLevel.VISITOR })
class DefaultController extends ControllerBase {
    @Get('/')
    private init(_req: AppRequest, res: AppResponse): void {
        logManager.setLog('Init Route', 'default init route requested');
        res.json({ message: 'Default init route' });
    }
}

export default new DefaultController();
