import ControllerBase, { AppParams, AppRequest, AppResponse, ControllerConfig, Get, Post } from '~/core/controllerBase';
import adminManager from '~/managers/adminManager';
import { UserApiModel, UserPayloadLogin } from '~/models/users';
import Ses from '~/core/ses';
import { AppTools } from '~/helpers/appTools';
import { UserAccessLevel } from '~/types/typeCore';
import DateTime from '~/core/class/DateTime';
import { StandardError } from '~/core/class/standardError';
import configManager from '~/managers/configManager';
import dayjs from 'dayjs';

@ControllerConfig({ baseRoute: "auth", accessLevel: UserAccessLevel.USER })
class AuthController extends ControllerBase {
    @Post('/login', UserAccessLevel.VISITOR)
    private async login(req: AppRequest<UserPayloadLogin>, res: AppResponse): Promise<void> {
        const creds = await adminManager.checkLogin(req);
        const expires = req.body.RememberMe ? dayjs().add(1, 'year').toDate() : dayjs().add(1, 'day').toDate();
        const userInfo: UserApiModel = {
            id: Ses.UID,
            firstName: Ses.UserFirstName,
            lastName: Ses.UserLastName,
            name: Ses.UserName,
            email: Ses.UserEmail,
            levelAccess: Ses.AccessLevel as UserAccessLevel,
            token: null,
        };
        res.cookie('refresh', creds.token, AppTools.getCookieOptions(expires));
        res.cookie('deviceId', creds.deviceId, AppTools.getCookieOptions(dayjs().add(10, 'years').toDate()));
        res.json(userInfo);
    }

    @Get('/refresh', UserAccessLevel.VISITOR)
    public async refresh(req: AppRequest, res: AppResponse): Promise<void> {
        const access = await adminManager.getAccess(req);
        if (!access) {
            res.clearCookie('refresh');
            throw new StandardError('adminManager.checkRefresh', 'UNAUTHORIZED', 'no_session', `token not active`, 'token provided is not active');
        } else {
            const expires = new DateTime().addMinutes(2).getTime();
            res.json({ token: access, expires: expires });
        }
    }

    @Post('/logout', UserAccessLevel.USER)
    public async logout(_req: AppRequest, res: AppResponse): Promise<void> {
        await adminManager.clearSession();
        res.clearCookie('refresh');
        res.clearCookie(configManager.getConfig.APP_NAME);
        res.json({ success: true });
    }
    @Post('/proxy/get', UserAccessLevel.ADMIN)
    public async getProxy(req: AppRequest<{ search: string }>, res: AppResponse): Promise<void> {
        const proxies = await adminManager.searchProxy(req.body.search);
        res.json(proxies);
    }
    @Get('/proxy/set/:id', UserAccessLevel.ADMIN)
    public async setProxy(req: AppParams<{ id: number }>, res: AppResponse): Promise<void> {
        const token = await adminManager.setProxy(req.params.id);
        res.cookie('proxy', token, AppTools.getCookieOptions(dayjs().add(configManager.getConfig.PROXY_EXP, 'minutes').toDate()));
        res.json({ success: true });
    }
    @Get('/proxy/logout', UserAccessLevel.USER)
    public async logoutProxy(req: AppParams<{ id: number }>, res: AppResponse): Promise<void> {
        const token = adminManager.logoutProxy(req.cookies.proxy);
        res.cookie('proxy', token, AppTools.getCookieOptions(dayjs().add(configManager.getConfig.PROXY_EXP, 'minutes').toDate()));
        res.json({ success: true });
    }
}
export default new AuthController();
