import path from 'path';
import winston from 'winston';
import configManager from './configManager';
import Ses from '~/core/ses';
import App from '~/core/appCore';

const logPath = path.join(path.resolve(__dirname, configManager.getConfig.NODE_ENV === 'development' ? '../../' : '.'), 'logs');
const logFormat = winston.format.printf(({ level, label, message, timestamp }) => {
    return `[${timestamp}] -- ${level} -- [${label}] : ${message}`;
});

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.timestamp(), logFormat),
    transports: [new winston.transports.File({ filename: `${logPath}/combined.log`, level: 'debug' }), new winston.transports.File({ filename: `${logPath}/verbose.log`, level: 'verbose' }), new winston.transports.File({ filename: `${logPath}/info.log`, level: 'info' }), new winston.transports.File({ filename: `${logPath}/warn.log`, level: 'warn' }), new winston.transports.File({ filename: `${logPath}/error.log`, level: 'error' })],
});

if (configManager.getConfig.NODE_ENV === 'development') {
    logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

class LogManager {
    public async setLog(action: string, description: string): Promise<void>;
    public async setLog(action: string, description: string, call?: string): Promise<void>;
    public async setLog(action: string, description: string, call?: string, target?: string): Promise<void>;
    public async setLog(action: string, description: string, call?: string, target?: string, additionalData?: any): Promise<void>;
    public async setLog(action: string, description: string, call?: string, target?: string, additionalData?: any): Promise<void> {
        await App.queryDo("INSERT INTO Logs (action, description, target, call, userId, ipAddress, additionalData) VALUES ($1, $2, NULLIF($3, ''), $4, $5, $6, NULLIF($7, ''))", action, description, target, call, Ses.UID ?? null, Ses.IpAddress ?? null, additionalData ? JSON.stringify(additionalData) : null);
    }
    public async setCronLog(action: string, description: string): Promise<void>;
    public async setCronLog(action: string, description: string, call?: string): Promise<void>;
    public async setCronLog(action: string, description: string, call?: string, target?: string): Promise<void>;
    public async setCronLog(action: string, description: string, call?: string, target?: string, additionalData?: any): Promise<void>;
    public async setCronLog(action: string, description: string, call?: string, target?: string, additionalData?: any): Promise<void> {
        await App.queryDo("INSERT INTO Logs (action, description, target, call, additionalData) VALUES ($1, $2, NULLIF($3, ''), $4, NULLIF($7, ''))", action, description, target, call, additionalData ? JSON.stringify(additionalData) : null);
    }
}

export default new LogManager();
