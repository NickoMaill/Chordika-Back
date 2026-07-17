import fs from 'fs';
import dotenv from 'dotenv';
import { IConfigEnv } from '../data/contracts/config';
import path from 'path';

class ConfigManager {
    private readonly __env: IConfigEnv;

    constructor() {
        dotenv.config({
            path: this.configEnvFile,
        });
        this.__env = {
            NODE_ENV: process.env.NODE_ENV,
            APP_NAME: process.env.APP_NAME,
            SHOW_ERROR_DETAILS: process.env.SHOW_ERROR_DETAILS === 'true',
            SECRET_REFRESH: process.env.APP_REFRESH_SECRET,
            ACCESS_SECRET: process.env.APP_ACCESS_SECRET,
            SESSION_SECRET: process.env.APP_SESSION_SECRET,
            SCHEDULER_SECRET: process.env.APP_API_SCHEDULER_SECRET,
            FRONT_BASEURL: process.env.APP_FRONT_BASEURL,
            API_BASEURL: process.env.APP_API_BASEURL,
            HTTPS: process.env.HTTPS === 'true',
            PHOTON_BASEURL: process.env.APP_PHOTON_BASEURL,
            RECAPTCHA_BASEURL: process.env.APP_RECAPTCHA_BASEURL,
            RECAPTCHA_SECRET: process.env.APP_RECAPTCHA_SECRET,
            DEEZER_BASEURL: process.env.APP_DEEZER_BASEURL,
        };
    }

    public get configEnvFile(): string {
        const basePath = __dirname; // ou __dirname si tu préfères
        if (process.env.NODE_ENV === 'development') {
            if (fs.existsSync(path.join(basePath, '../..', '.env.development.local'))) {
                return path.join(basePath, '../..', '.env.development.local');
            } else {
                return path.join(basePath, '..', '.env.development');
            }
        } else {
            return path.join(basePath, '.env');
        }
    }

    public get getConfig(): IConfigEnv {
        return this.__env;
    }

    public get configAsNumber(): IConfigEnv {
        const res: IConfigEnv = {};
        for (const key in this.__env) {
            const parsed = parseInt(this.__env[key], 10);
            res[key] = isNaN(parsed) || key === 'PGPORT' ? this.__env[key] : parsed;
        }
        return res;
    }

    public sslConfig(): boolean | { rejectUnauthorized: boolean } {
        if (this.getConfig.NODE_ENV === 'development') {
            return false;
        } else {
            return { rejectUnauthorized: false };
        }
    }

    public isProduction(): boolean {
        if ((this.__env.NODE_ENV ?? '').toLowerCase() === 'production') {
            return true;
        } else {
            return false;
        }
    }
}

export default new ConfigManager();