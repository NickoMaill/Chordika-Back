import { AppRequest, AppResponse, ControllerConfig, Get } from '~/core/controllerBase';
import TableController from './tableController';
import { User, UserPayload } from '~/models/users';
import AdminManager from '~/managers/adminManager';
import { UserAccessLevel } from '~/types/typeCore';
import UserModule from '~/module/userModule';

@ControllerConfig({ accessLevel: UserAccessLevel.ADMIN, baseRoute: 'users' })
class UsersController extends TableController<User, UserPayload> {
    constructor() {
        super(UserModule);
    }

    @Get('/me', UserAccessLevel.USER)
    private async getMe(_req: AppRequest, res: AppResponse<User>): Promise<void> {
        const usr = await AdminManager.getMe();
        res.json(usr);
    }
}

export default new UsersController();
