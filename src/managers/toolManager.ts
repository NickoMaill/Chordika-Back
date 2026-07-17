import os from 'os';
import dns from 'dns/promises';
import fs from 'fs';
import path from 'path';
import checkDiskSpace from "check-disk-space";
import { AppRequest } from '~/core/controllerBase';
import { DiskUsageType, MonitorType, SQLTestOutputResult } from '~/types/typeCore';
import App from '~/core/appCore';
import { StandardError } from '~/core/class/standardError';
import configManager from './configManager';

class ToolManager {
    public async GetMonitorInfo(req: AppRequest): Promise<MonitorType> {
        try {
            const now = new Date();
            const hostname = os.hostname();
            const hostInfo = await dns.lookup(hostname);
            const fqdnInfo = await dns.lookupService(hostInfo.address, 0).catch((e) => ({ hostname: 'Unknown', error: e }));

            const uptime = (): string => {
                const s = process.uptime();
                const h = Math.floor(s / 3600);
                const m = Math.floor((s % 3600) / 60);
                const sec = Math.floor(s % 60);
                return `${h}h ${m}m ${sec}s`;
            };
            const dbVersionRes = await App.queryGet<{ version: string }>('SELECT version()');
            const dbVersion = dbVersionRes.rows[0].version;

            // const dbName = process.env.DB_NAME || 'nickflix';
            const dbSizeRes = await App.queryGet<{ size: string }>(`SELECT pg_size_pretty(pg_database_size('${process.env.PGDATABASE}')) AS size `);
            const dbSize = dbSizeRes.rows[0].size;

            const userCountRes = await App.queryGet<{ c: number }>('SELECT COUNT(*) AS c FROM users');
            const userCount = userCountRes.rows[0].c;

            const filesFolderExists = fs.existsSync(path.join(process.cwd(), 'Files'));
            const disks = await this.getDiskUsage();
            const info: MonitorType = {
                date: now.toISOString(),
                datasource: configManager.isProduction() ? "" : process.env.DATABASE_URL || 'Non spécifiée',
                smtpServer: process.env.SMTP_SERVER || 'Non spécifié',
                rootURL: process.env.ROOT_URL || req.protocol + '://' + req.get('host'),
                rootPath: process.cwd(),
                sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 1800,
                encryptedConfig: false,
                machineName: hostname,
                hostName: hostname,
                dnsName: fqdnInfo.hostname,
                ipAddress: hostInfo.address,
                fqdn: fqdnInfo.hostname + ' [' + hostInfo.address + ']',
                osVersion: os.version?.() || os.release(),
                uptime: uptime(),
                processors: os.cpus().length,
                processMemory: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}Mb`,
                user: os.userInfo().username,
                nodeVersion: process.version,
                forwardedFor: (req.headers['x-forwarded-for'] || '') as string,
                dbVersion,
                dbSize,
                userAccounts: userCount,
                isFilesFolderExists: filesFolderExists,
                currentServerTaskRunning: [], // À implémenter selon tes jobs en cours
                diskUsage: disks,
            };
            return info;
        } catch (error) {
            throw new StandardError('', 'BAD_REQUEST', 'error_happened', 'an error happened while fetching the monitor', error.message, false, error);
        }
    }

    private formatGB(bytes): number {
        return Math.roundTo(bytes / 1024 / 1024 / 1024, 2);
    }

    private async getDiskUsage(): Promise<DiskUsageType[]> {
        let paths: { name: string; path: string }[] = [];
        if (configManager.isProduction()) {
            paths = [
                { name: 'hls', path: '/home/nico/Web/hls' },
                { name: 'db_backups', path: '/home/nico/Web/db_backups' },
            ];
        } else {
            // check-disk-space accepte "/" sur macOS/Linux, "C:" ou "C:\\" sur Windows
            paths = [{ name: 'main', path: path.parse('/').root }]; // => "/"
        }

        const checks = paths.map(async (p) => {
            // Optionnel: vérifier que le chemin existe ; sinon, remonter à la racine de volume
            // try { await fs.access(p.path); } catch { /* ignore */ }

            const { size, free } = await checkDiskSpace(p.path);
            const totalBytes = size ?? 0;
            const freeBytes = free ?? 0;

            // check-disk-space ne fournit pas "available" => on l'aligne sur "free"
            const availableBytes = freeBytes;

            const usedPercent = totalBytes > 0 ? Math.round(((totalBytes - freeBytes) / totalBytes) * 100 * 100) / 100 : 0;

            return {
                name: p.name,
                total: this.formatGB(totalBytes),
                free: this.formatGB(freeBytes),
                available: this.formatGB(availableBytes),
                usedPercent,
            } satisfies DiskUsageType;
        });

        const settled = await Promise.allSettled(checks);
        return settled.filter((r): r is PromiseFulfilledResult<DiskUsageType> => r.status === 'fulfilled').map((r) => r.value);
    }

    public async execSQLTest({ sqlStr, columns }: { sqlStr: string; columns: string }): Promise<SQLTestOutputResult[]> {
        const output: SQLTestOutputResult[] = [];
        let str = (sqlStr ?? '').trim();
        if (str.endsWith(';')) str = str.substring(0, -1);

        const splitted = str.split(';');
        for await (const s of splitted) {
            const result: SQLTestOutputResult = {
                datas: null,
                columns: [],
                timeExec: null,
                SQL: s,
            };
            try {
                const start = Date.now();
                const datas = await App.queryGet<any>(s);
                const end = Date.now();
                const cols = (columns ?? '').toLowerCase().trim().split(',');
                const foundedCols = cols.filter((c) => datas.fields.findIndex((f) => f.name === c.trim()) > -1);
                if (cols.length > 0 && cols[0] !== '' && cols.length === foundedCols.length && splitted.length < 2) {
                    datas.rows = datas.rows.map((o) => {
                        const newObj = {};
                        foundedCols.forEach((c) => {
                            if (c.trim() in o) {
                                newObj[c.trim()] = o[c.trim()];
                            }
                        });
                        return newObj;
                    });
                    datas.fields = datas.fields.filter((f) => cols.findIndex((c) => c.trim() === f.name) > -1);
                }
                result.datas = datas.rows;
                result.columns = datas.fields.map((f) => f.name);
                result.timeExec = end - start;
                result.SQL = s;
                output.push(result);
            } catch (error) {
                if (error instanceof StandardError) {
                    if (error.key === 'DatabaseCore.DatabaseEngine') {
                        result.error = error.detailedMessage;
                        output.push(result);
                        continue;
                    } else {
                        throw new StandardError(error.key, error.status, error.code, error.message, error.detailedMessage, error.log, error.data);
                    }
                }
                throw new StandardError('tools.sqlTest', 'BAD_REQUEST', 'error_happened', 'an arreor happened while try sql', error.message, false, error);
            }
        }
        return output;
    }
}

export default new ToolManager();
