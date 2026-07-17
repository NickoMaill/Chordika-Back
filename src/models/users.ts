import { BaseModel, UserAccessLevel } from '~/types/typeCore';
import { Model } from './base';
import { ApiTable } from '~/types/coreApiTypes';

export class User extends Model implements BaseModel {
    protected static override table = ApiTable.USERS;
    public id: number;
    public email: string;
    public password: string;
    public firstName: string;
    public lastName: string;
    public name: string;
    public isAdmin: boolean;
    public levelAccess: UserAccessLevel;
    public lastConDate: Date;
    public addedAt: string;
    public updatedAt: string;
    public preferences: UserPreference;
    public proxies: { id: number; name: string }[];
}

export type UserPayload = {
    email: string;
    firstName: string;
    lastName: string;
    name: string;
    levelAccess: UserAccessLevel;
    password: string;
};

export type UserApiModel = {
    id: number;
    name: string;
    firstName: string;
    lastName: string;
    levelAccess: UserAccessLevel;
    email: string;
    token: string;
};

export type UserPayloadLogin = {
    Username: string;
    Password: string;
    RememberMe: boolean;
};

export class UserToken extends Model implements BaseModel {
    protected static override table = ApiTable.TOKENS;
    public id: number;
    public token: string;
    public type: 'SES' | 'RES';
    public userId: number;
    public userIp: string;
    public userAgent: string;
    public deviceId: string;
    public expires: Date;
    public isRevoked: boolean;
    public revokedAt: Date;
    public addedAt: string;
    public updatedAt: string;
}

export type TokenPayload = {
    token: string;
    userIp: string;
    deviceId: string;
    userAgent: string;
    userId: number;
    type: 'SES';
    expires: Date;
};

export type SubtitlesStyles = {
    background: string;
    borderRadius: string;
    boxDecorationBreak: string;
    color: string;
    fontFamily: string;
    fontSize: string;
    fontVariant: string;
    lineHeight: string;
    padding: string;
    textShadow: string;
    whiteSpace: string;
};

export class UserPreference extends Model {
    protected static override table: ApiTable = ApiTable.USERS_PREFERENCES;
    public id: number;
    public userId: number;
    public addedAt: Date;
    public updatedAt: Date;
}
export type UserPreferencePayload = {
    audioLang: string;
};

export type PlaySessionPayload = {
    expires: number;
    sessionPlayId: number;
    userId: number;
    movieId: number;
};
