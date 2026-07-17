import './core/initCustomsExtensions';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import pgSession from 'connect-pg-simple';
import { sanitizeXss } from './middlewares/xss';
import initBase from './core/initBase';
import { StandardError } from './core/class/standardError';
import session from 'express-session';
import configManager from './managers/configManager';
import { AppTools } from './helpers/appTools';
import { DatabaseCore } from './core/dataBaseCore';
import Ses from './core/ses';

const app = express();
const PORT = process.env.PORT || 8000 || 8001;
// #region MIDDLEWARE -> //////////////////////////////////////////
app.set('trust proxy', true);
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

app.use(
    cors({
        origin: [configManager.getConfig.FRONT_BASEURL, 'http://192.168.1.56'],
        credentials: true,
    })
);

app.use(cookieParser());
app.use(morgan('dev'));
app.use(sanitizeXss);
const PgSession = pgSession(session);
app.use(
    session({
        store: new PgSession({
            pool: DatabaseCore.getPool(),
            tableName: 'user_sessions',
            createTableIfMissing: true,
        }),
        secret: configManager.getConfig.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        name: configManager.getConfig.APP_NAME,
        cookie: AppTools.getCookieOptions(new Date(Date.now() + 1000 * 60 * 60 * 24)),
    })
);
app.use(Ses.middleware);
// app.use(initSes);
// #endregion -> /////////////////////////////////////////////////

// #region WATCHDOG -> ///////////////////////////////////////////
// #endregion -> /////////////////////////////////////////////////

// #region ROUTES -> /////////////////////////////////////////////
initBase.initRoutes(app).then(() => {
    // #region COMMONS ROUTES -> /////////////////////////////////////
    app.get('/{*path}', () => {
        throw new StandardError('app.*', 'NOT_FOUND', 'not_found', 'resources not found', `Not found`, false);
    });
    // #endregion -> /////////////////////////////////////////////////

    // #region SERVER INIT -> ////////////////////////////////////////
    const server = initBase.startServer(app, PORT);
    let isShuttingDown = false;
    // #endregion -> /////////////////////////////////////////////////

    const gracefulShutdown = async (signal: string): Promise<void> => {
        if (isShuttingDown) return;
        isShuttingDown = true;

        console.log(`${signal} received, shutting down gracefully...`);
        server.close(async () => {
            try {
                await DatabaseCore.disconnectAll(); // pool principal DB
                console.log('All database pools closed');
                process.exit(0);
            } catch (error) {
                console.error('Error while shutting down:', error);
                process.exit(1);
            }
        });
    };

    process.on('SIGINT', () => {
        void gracefulShutdown('SIGINT');
    });

    process.on('SIGTERM', () => {
        void gracefulShutdown('SIGTERM');
    });
    process.on('uncaughtException', (error) => {
        console.error('Uncaught exception:', error);
        void gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason) => {
        console.error('Unhandled rejection:', reason);
        void gracefulShutdown('unhandledRejection');
    });
});
// #endregion -> /////////////////////////////////////////////////
