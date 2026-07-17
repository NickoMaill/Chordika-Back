import path from 'path';
import fs from 'fs';
import { TokenPayload, User, UserPayloadLogin, UserToken } from '~/models/users';
import userModule from '~/module/userModule';
import { StandardError } from '~/core/class/standardError';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import configManager from './configManager';
import { AppRequest } from '~/core/controllerBase';
import Ses from '~/core/ses';
import App from '~/core/appCore';
import { OutputQueryRequest, ProxyTokenData, TokenTypeEnum, UserAccessLevel } from '~/types/typeCore';
import dayjs from 'dayjs';
import GUID from '~/core/class/GUID';
import { DatabaseCoreQuery } from '~/types/coreApiTypes';
import Validator from '~/core/class/Validator';

class AdminManager {
    // public --> start region /////////////////////////////////////////////
    public static setInvalidLoginForm(message: string, email: string): string {
        let htmlContent = fs.readFileSync(path.join(__dirname, '../views/login.html'), { encoding: 'utf-8' });
        htmlContent = htmlContent.replaceAll('{0}', 'is-invalid').replace('&nbsp;', message).replace('data-value', `value="${email}"`);
        return htmlContent;
    }

    public static setInvalidOtpForm(message: string): string {
        let htmlContent = fs.readFileSync(path.join(__dirname, '../views/mfa.html'), { encoding: 'utf-8' });
        htmlContent = htmlContent.replaceAll('{0-1}', 'is-invalid');
        htmlContent = htmlContent.replace('&nbsp;', message);
        return htmlContent;
    }

    public static async checkLogin(req: AppRequest<UserPayloadLogin>): Promise<{ token: string; deviceId: string }> {
        if (req.body.Username === '' || !req.body.Username) throw new StandardError('AdminManager.checkLogin', 'BAD_REQUEST', 'email_required', 'email is required', 'email is required to login');
        if (req.body.Password === '' || !req.body.Password) throw new StandardError('AdminManager.checkLogin', 'BAD_REQUEST', 'password_required', 'password is required', 'password is required to login');
        // get user admin info
        const founded = await userModule.getOneByEmail(req.body.Username);
        // if not founded refuse access
        if (!founded) throw new StandardError('AdminManager.checkLogin', 'BAD_REQUEST', 'wrong_credentials', 'email or password invalid', 'email or password invalid');
        // check password hash
        const pwd = await App.queryGet('SELECT password FROM Users WHERE ID = $1', founded.id);
        const isPasswordValid = configManager.isProduction() ? await bcrypt.compare(req.body.Password, pwd.rows[0].password) : true;
        // if not same, then refuse access
        if (!isPasswordValid && configManager.isProduction()) throw new StandardError('AdminManager.checkLogin', 'BAD_REQUEST', 'wrong_credentials', 'email or password invalid', 'email or password invalid');

        // if login granted, sign a jwt with => user id, isAuthorizedDevice key and needMfa (two if multifactor auth must be throwed)
        let deviceId = req.cookies.deviceId;
        if (!deviceId) {
            deviceId = GUID.new();
        }

        //const isDeviceAuthorized = await userModule.isDeviceAuthorized(deviceId, founded.id);
        const token = jwt.sign({ id: founded.id, deviceId: deviceId }, configManager.getConfig.SECRET_REFRESH, { expiresIn: req.body.RememberMe ? '1y' : '1d' });
        // update ses values
        Ses.UserEmail = founded.email;
        Ses.UserName = founded.name;
        Ses.UserFirstName = founded.firstName;
        Ses.UserLastName = founded.lastName;
        Ses.NeedMfa = true;
        Ses.UID = founded.id;
        Ses.AccessLevel = founded.levelAccess;
        Ses.DeviceId = deviceId;

        //init token payload
        const hashedToken = await bcrypt.hash(token, 5);
        const tokenPayload: TokenPayload = {
            userId: Ses.UID,
            userAgent: req.headers['user-agent'],
            deviceId: Ses.DeviceId,
            userIp: req.socket.remoteAddress,
            token: hashedToken,
            type: 'SES',
            expires: req.body.RememberMe ? dayjs().add(1, 'years').toDate() : dayjs().add(1, 'day').toDate(),
        };

        // save refresh token in db
        await userModule.insertToken(tokenPayload);
        await App.queryDo('UPDATE Users SET LastConDate = NOW() WHERE ID = $1', Ses.UID);
        // await this.sendOtp(req);
        return { token, deviceId };
    }

    // public static async sendOtp(req: AppRequest) {
    //     const ses = Ses.getInstance();
    //     const otp = AppToolgenerateOtp();
    //     // save hashed otp in db for compare
    //     const hashedOtp = await bcrypt.hash(otp, 5);

    //     const tokenPayload: TokenPayload = {
    //         userId: Ses.UID,
    //         userAgent: req.headers['user-agent'],
    //         deviceId: Ses.DeviceId,
    //         userIp: req.socket.remoteAddress,
    //         token: hashedOtp,
    //         type: 'otp',
    //         expires: moment().add(10, 'minutes').toDate(),
    //     };
    //     userModule.InsertToken(tokenPayload);

    //     // return token and deviceId, to put it in some cookies
    //     // await communicationManager.sendMfa(Ses.UserEmail, otp);
    // }

    // public static async checkOtp(otp: string, token: string): Promise<boolean> {
    //     const otpData = await userModule.getLastOtp();
    //     const tokenData = await userModule.getToken(token);
    //     if (!otpData) throw new StandardError('adminManager.checkOtp', 'BAD_REQUEST', 'invalid_otp', 'otp est invalide');
    //     const compare = await bcrypt.compare(otp, otpData.token);
    //     if (!compare) throw new StandardError('adminManager.checkOtp', 'BAD_REQUEST', 'invalid_otp', 'otp invalide');
    //     if (otpData.expires < new Date()) throw new StandardError('adminManager.checkOtp', 'BAD_REQUEST', 'otp_expired', 'otp expiré');
    //     await userModule.refreshOtp(tokenData.id);
    //     return true;
    // }
    public static async checkRevoke(refreshToken: string): Promise<boolean> {
        if (!refreshToken || refreshToken === '') throw new StandardError('adminManager.checkRefresh', 'UNAUTHORIZED', 'no_session', `no token`, 'token not provided');

        const tokens = await UserToken.getByQuery({ where: { equals: { isRevoked: false, userId: Ses.UID, deviceId: Ses.DeviceId } /*rawQuery: ["expires > NOW()"]*/ } });
        if (tokens.totalRecords === 0) throw new StandardError('adminManager.checkRefresh', 'UNAUTHORIZED', 'no_session', `no token`, 'token not provided');
        const isOK = await bcrypt.compare(refreshToken, tokens.records[0].token);
        return isOK;
    }
    public static async checkAccess(token: string): Promise<void> {
        if (token === '' || !token) throw new StandardError('adminManager.checkAccess', 'UNAUTHORIZED', 'no_session', `token not active`, 'token provided is not active');
        let decoded: { id: number; isDeviceAuthorized: boolean; deviceId: string } = null;
        jwt.verify(token, configManager.getConfig.ACCESS_SECRET, (err: jwt.JsonWebTokenError, dec: typeof decoded) => {
            if (err) {
                switch (err.name.toLowerCase()) {
                    case 'tokenexpirederror':
                        throw new StandardError('adminManager.checkAccess', 'UNAUTHORIZED', 'session_expired', `token expired`, 'token provided is invalid');
                    case 'notbeforeerror':
                        throw new StandardError('adminManager.checkAccess', 'UNAUTHORIZED', 'session_not_active', `token not active`, 'token provided is not active');
                    default:
                        throw new StandardError('adminManager.checkAccess', 'FATAL', 'error_happened', `token => ${token} invalid`, 'token invalid, message => ' + err.message);
                }
            }
            if (dec) {
                decoded = dec;
            }
        });
        if (!decoded) {
            throw new StandardError('adminManager.checkAccess', 'BAD_REQUEST', 'no_content', 'no content', 'no token data');
        }
        if (decoded.id) {
            const founded = await userModule.getOneById(decoded.id);
            // const foundedToken = await userModule.getToken(token);
            if (!founded) {
                throw new StandardError('adminManager.checkAccess', 'UNAUTHORIZED', 'no_session', 'no session found', 'no session fond with id : ' + decoded.id);
            }
            // const needMfa = moment(foundedToken.lastOtp).add(1, "day").toDate() < new Date();
            Ses.setUserInfo(founded.id, founded.email, false, founded.levelAccess, '');
            // if (Ses.NeedMfa) {
            //     throw new StandardError("adminManager.checkRefresh", "UNAUTHORIZED", "need_mfa", "user need 2 MFA", "User need 2MFA to access protected resources");
            // }
        }
    }

    public static async getAccess(req: AppRequest): Promise<string> {
        const token = req.cookies['refresh'];
        if (token === '' || !token) throw new StandardError('adminManager.getAccess', 'UNAUTHORIZED', 'no_session', `no token`, 'token not provided');

        let decoded: { id: number; isDeviceAuthorized: boolean; deviceId: string } = null;
        jwt.verify(token, configManager.getConfig.SECRET_REFRESH, (err: jwt.JsonWebTokenError, dec: typeof decoded) => {
            if (err) {
                switch (err.name.toLowerCase()) {
                    case 'tokenexpirederror':
                        throw new StandardError('adminManager.checkRefresh', 'UNAUTHORIZED', 'session_expired', `token expired`, 'token provided is invalid');
                    case 'notbeforeerror':
                        throw new StandardError('adminManager.checkRefresh', 'UNAUTHORIZED', 'session_not_active', `token not active`, 'token provided is not active');
                    default:
                        throw new StandardError('adminManager.checkRefresh', 'FATAL', 'error_happened', `token => ${token} invalid`, 'token invalid, message => ' + err.message);
                }
            }
            if (dec) {
                decoded = dec;
            }
        });
        if (!decoded) {
            throw new StandardError('adminManager.checkRefresh', 'BAD_REQUEST', 'no_content', 'no content', 'no token data');
        }
        if (decoded.id) {
            const founded = await userModule.getOneById(decoded.id);
            // const foundedToken = await userModule.getToken(token);
            if (!founded) {
                throw new StandardError('adminManager.checkRefresh', 'UNAUTHORIZED', 'no_session', 'no session found', 'no session fond with id : ' + decoded.id);
            }
            // const needMfa = moment(foundedToken.lastOtp).add(1, "day").toDate() < new Date();
            Ses.setUserInfo(founded.id, founded.email, false, founded.levelAccess, '');

            const foundedToken = await UserToken.getByQuery({ where: { equals: { userId: Ses.UID, deviceId: req.cookies.deviceId, isRevoked: false } } });
            if (foundedToken.totalRecords === 0) {
                throw new StandardError('adminManager.getAccess', 'UNAUTHORIZED', 'no_session', `token invalid`, 'token provided is not validee');
            }
            const isTokenGood = await bcrypt.compare(token, foundedToken.records[0].token);

            if (!isTokenGood) throw new StandardError('adminManager.getAccess', 'UNAUTHORIZED', 'no_session', `token invalid`, 'token provided is not valid');
            const access = jwt.sign({ id: Ses.UID }, configManager.getConfig.ACCESS_SECRET, { expiresIn: '30m' });
            return access;
        }
    }

    public static async getMe(): Promise<User> {
        const usr = await userModule.getProfile();
        if (Ses.ProxiesUIDList.length > 0) {
            const prxs = await App.queryGet<{ id: number; name: string }>(`SELECT id, name FROM Users WHERE ID IN (${Ses.ProxiesUIDList.join(' ,')})`);
            usr.proxies = prxs.rows;
        }
        return usr;
    }

    public static async clearSession(): Promise<boolean> {
        await App.queryDo('UPDATE Tokens SET isRevoked = true WHERE UserId = $1 AND DeviceId = $2 AND IsRevoked = FALSE', Ses.UID, Ses.DeviceId);
        Ses.clear();
        return true;
    }

    public static async searchProxy(search: string): Promise<User[]> {
        const proxies = await User.getByQuery<User>({ where: { like: { name: [search] }, notEquals: { id: Ses.UID } } });
        return proxies.records;
    }

    public static async setProxy(userId: number, previousToken: string = null): Promise<string> {
        const user = await User.getById(userId);
        if (!user) throw new StandardError('auth.setProxy', 'BAD_REQUEST', 'proxy_not_exist', `proxy with id ${userId}, not exist in db`);
        const isPreviousTokenOK = Validator.checkToken(previousToken, TokenTypeEnum.PROXY);
        let payload: ProxyTokenData = null;
        if (isPreviousTokenOK) {
            payload = Validator.decodeToken<ProxyTokenData>(previousToken, TokenTypeEnum.PROXY);
            payload.proxies.push(userId);
            payload.active = userId;
        } else {
            payload = { proxies: [userId], active: userId };
        }

        const token = Validator.encodeToken(payload, TokenTypeEnum.PROXY, configManager.getConfig.PROXY_EXP);
        return token;
    }

    public static async checkProxy(token: string): Promise<void> {
        try {
            const decoded = jwt.verify(token, configManager.getConfig.SESSION_SECRET) as ProxyTokenData;
            if (decoded.active) {
                const user = await User.getById(decoded.active);
                if (user) {
                    Ses.ProxyUID = Ses.UID;
                    Ses.setUserInfo(user.id, user.email, false, user.levelAccess, '');
                }
            }
        } catch {
            return;
        }
    }

    public static logoutProxy(token: string): string {
        Ses.UID = Ses.ProxyUID;
        Ses.ProxyUID = null;
        const isTokenValid = Validator.checkToken(token, TokenTypeEnum.PROXY);
        if (isTokenValid) {
            const data = Validator.decodeToken<ProxyTokenData>(token, TokenTypeEnum.PROXY);
            console.log(data);
            data.active = null;
            const newToken = Validator.encodeToken({ active: data.active, proxies: data.proxies }, TokenTypeEnum.PROXY, configManager.getConfig.PROXY_EXP);
            return newToken;
        }
        return null;
    }

    private static async setPlaySession(movieId: number): Promise<number> {
        const ps = await App.queryGet<{ id: number; revoked: boolean }>("SELECT ID, Revoked FROM PlaySessions WHERE userId = $1 AND movieId = $2 AND AddedAt + INTERVAL '4 hours' > NOW()", Ses.UID, movieId);
        if (ps.rowCount > 0) {
            if (ps.rows[0].revoked) throw new StandardError('', 'FORBIDDEN', 'forbidden_access', 'You cannot have access', 'You cannot have access to this resources');
            return ps.rows[0].id;
        }

        const inserted = await App.queryGet<{ id: number }>('INSERT INTO PlaySessions (userId, MovieId) VALUES ($1, $2) RETURNING ID', Ses.UID, movieId);
        return inserted.rows[0].id;
    }

    public static async getUserSessions(userId: number, limit: number, offset: number, showAll: boolean): Promise<OutputQueryRequest<UserToken>> {
        if (Ses.UID !== userId && Ses.AccessLevel !== UserAccessLevel.ADMIN) throw new StandardError('adminManager.getUserSessions', 'FORBIDDEN', 'forbidden_access', 'You cannot have access', 'You cannot have access to this resources');
        const query: DatabaseCoreQuery<UserToken> = {
            where: {
                equals: {
                    userId,
                    isRevoked: false,
                },
            },
            limit,
            offset,
            order: 'id',
            asc: false,
        };

        if (showAll) delete query.where.equals.isRevoked;

        const tokens = await UserToken.getByQuery(query);
        tokens.records.forEach((r) => {
            delete r.token;
        });
        return tokens;
    }

    public static async revokeSession(sesId: number): Promise<boolean> {
        const token = await UserToken.getById(sesId);

        if (!token) throw new StandardError('revoke', 'BAD_REQUEST', 'no_token', 'no tokens to revoke', 'No tokens to revoke');

        await App.queryDo('UPDATE Tokens SET IsRevoked = TRUE WHERE ID = $1', sesId);
        return true;
    }
    // public --> end region ///////////////////////////////////////////////

    // private --> start region ////////////////////////////////////////////
    // private --> end region //////////////////////////////////////////////
}
export default AdminManager;
