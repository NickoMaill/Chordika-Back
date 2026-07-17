import { NextFunction } from 'express';
import { ProxyTokenData, TokenTypeEnum, UserAccessLevel } from '../types/typeCore';
import { AppRequest, AppResponse } from './controllerBase';
import { AsyncLocalStorage } from 'node:async_hooks';
import { SessionShape } from '~/types/common';
import Validator from './class/Validator';
import Performance from './class/Performance';

export default class Ses {
    private static storage = new AsyncLocalStorage<AppRequest>();

    public static async middleware(req: AppRequest, _res: AppResponse, next: NextFunction): Promise<void> {
        if (!req.session.ses) {
            req.session.ses = {
                UID: null,
                proxyUID: null,
                userAccess: UserAccessLevel.NOBODY,
                userEmail: null,
                userMobile: null,
                userFirstName: null,
                userLastName: null,
                userName: null,
                needMfa: true,
                deviceId: null,
                hlsToken: null,
                perf: null,
                perfActive: false,
            };
        }
        req.session.ses.deviceId = req.cookies?.deviceId ?? null;

        if (!req.session.ipAddress) {
            req.session.ipAddress = req.ip;
        }

        if (!req.perfUID) {
            req.perfUID = null;
        }

        if (req.headers['x-perf-active'] === '1' && !req.session.ses.perf) {
            req.session.ses.perf = new Performance().toState();
        }

        Ses.storage.run(req, next);
    }

    private static get req(): AppRequest {
        const req = Ses.storage.getStore();
        if (!req) throw new Error('Ses used outside of request context');
        return req;
    }
    public static get IsSessionWritable(): boolean {
        const req = Ses.storage.getStore();
        return !!req;
    }
    private static get ses(): SessionShape {
        return Ses.req.session.ses;
    }

    public static get UID(): number | null {
        return Ses.ses.UID;
    }

    public static set UID(value: number | null) {
        Ses.ses.UID = value;
    }

    public static get UserEmail(): string | null {
        return Ses.ses.userEmail;
    }

    public static set UserEmail(value: string | null) {
        Ses.ses.userEmail = value;
    }

    public static get NeedMfa(): boolean {
        return Ses.ses.needMfa;
    }

    public static set NeedMfa(value: boolean) {
        Ses.ses.needMfa = value;
    }

    public static get UserName(): string | null {
        return Ses.ses.userName;
    }

    public static set UserName(value: string | null) {
        Ses.ses.userName = value;
    }

    public static set UserFirstName(value: string | null) {
        Ses.ses.userFirstName = value;
    }

    public static get UserFirstName(): string | null {
        return Ses.ses.userFirstName;
    }

    public static get UserLastName(): string | null {
        return Ses.ses.userLastName;
    }

    public static set UserLastName(value: string | null) {
        Ses.ses.userLastName = value;
    }

    public static get DeviceId(): string | null {
        return Ses.ses.deviceId;
    }

    public static set DeviceId(value: string | null) {
        Ses.ses.deviceId = value;
    }

    public static get ProxyUID(): number | null {
        return Ses.ses.proxyUID;
    }

    public static set ProxyUID(value: number) {
        Ses.ses.proxyUID = value;
    }

    public static get CurrentReqUrl(): string {
        return Ses.req.url;
    }

    public static get ProxiesUIDList(): number[] {
        const isTokenValid = Validator.checkToken(this.req.cookies?.proxy, TokenTypeEnum.PROXY);

        if (!isTokenValid) return [];
        const data = Validator.decodeToken<ProxyTokenData>(this.req.cookies.proxy, TokenTypeEnum.PROXY);
        return data.proxies;
    }

    public static get AccessLevel(): UserAccessLevel {
        return Ses.ses.userAccess;
    }

    public static set AccessLevel(value: UserAccessLevel) {
        Ses.ses.userAccess = value;
    }

    public static get UserMobile(): string | null {
        return Ses.ses.userMobile;
    }

    public static set UserMobile(value: string | null) {
        Ses.ses.userMobile = value;
    }

    public static get IpAddress(): string | null {
        return Ses.req.session.ipAddress ?? null;
    }

    public static set IpAddress(value: string | null) {
        Ses.req.session.ipAddress = value;
    }

    public static get PerfUID(): string | null {
        return Ses.req.perfUID ?? null;
    }

    public static set PerfUID(value: string | null) {
        Ses.req.perfUID = value;
    }

    public static get HLSToken(): string | null {
        return Ses.ses.hlsToken;
    }

    public static set HLSToken(value: string | null) {
        Ses.ses.hlsToken = value;
    }

    public static get Perf(): Performance {
        return new Performance(Ses.ses.perf);
    }

    private static set Perf(value: Performance) {
        Ses.ses.perf = value?.toState();
    }

    public static get IsPerfActive(): boolean {
        return !!Ses.ses.perf;
    }

    public static initPerformance(): void {
        Ses.Perf = new Performance();
    }

    public static clearPerf(): void {
        Ses.Perf = null;
    }

    public static updatePerf(action: (perf: Performance) => void): void {
        const perf = Ses.Perf;
        if (!perf) return;

        action(perf);

        Ses.Perf = perf;
    }

    public static setUserInfo(id: number, email: string, needMfa: boolean, level: UserAccessLevel, mobile: string | null): void {
        Ses.UID = id;
        Ses.UserEmail = email;
        Ses.NeedMfa = needMfa;
        Ses.AccessLevel = level;
        Ses.UserMobile = mobile;
    }

    public static clear(): void {
        Ses.UID = null;
        Ses.UserEmail = null;
        Ses.AccessLevel = UserAccessLevel.NOBODY;
        Ses.UserMobile = null;
        Ses.NeedMfa = false;
        Ses.HLSToken = null;
        Ses.Perf = null;
        Ses.req.session.destroy(() => {});
    }

    public static exists(key: string): boolean {
        return key in Ses.req.session;
    }

    public static set<T>(key: string, value: T): void {
        (Ses.req.session as Record<string, unknown>)[key] = value;
    }

    public static get<T>(key: string): T | undefined {
        return (Ses.req.session as Record<string, unknown>)[key] as T | undefined;
    }
}

// const SesProxy = new Proxy(Ses, {
//     construct(t, _a: any[]): Ses {
//         return t.getInstance();
//     },
//     get(t, p): any {
//         if (p === 'getInstance') return t.getInstance;
//         return t.getInstance()[p];
//     },
// });

// export default SesProxy;
