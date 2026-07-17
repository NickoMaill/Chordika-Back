import controllers from '~/controllers';
import { Express } from 'express';
import listEndpoints from 'express-list-endpoints';
import configManager from '../managers/configManager';
import logColors from '../helpers/logColors';
import { DatabaseCore } from './dataBaseCore';
import ControllerBase, { CONTROLLER_CONFIG_KEY, ControllerConfigOptions } from './controllerBase';
import handlers from '~/middlewares/handlers';
import DateTime from './class/DateTime';
import { Server } from 'http';

class InitBase {
    public async initLogs(app: Express, PORT: number | string): Promise<void> {
        // if (configManager.getConfig.NODE_ENV === 'development') {
        console.log(logColors.BgGreen, logColors.FgBlack, `[${configManager.getConfig.APP_NAME}'s Backend configuration loaded] ⚠️ local only ⚠️`, logColors.Reload);
        console.log('/////////////////////////////////////////////////////////', '\n');
        console.log('\n______________________________________________________________\n');
        for (let variable in configManager.getConfig) {
            console.log(logColors.FgRed, `${variable.padEnd(30, ' ')}`, logColors.Reload, `= ${configManager.getConfig[variable]}`);
        }
        listEndpoints(app).forEach((info) => {
            if (info.path === '/') {
                info.path = 'init';
            }

            if (info.path === '*') {
                info.path = 'error';
            }
            info.methods.forEach((r) => {
                const nameRoute: string = `[${(info.path.split('/')[0] ?? '') !== 'init' && info.path.split('/')[0] !== 'error' ? info.path.split('/')[2] : info.path}]`;
                console.info(`${nameRoute.padEnd(50, ' ')}`, logColors.FgYellow, `${r.padEnd(10)}`, logColors.Reload, `${'⇨'.padEnd(10, ' ')} "${info.path}"`);
            });
        });
        // }

        const dateStr = DateTime.now;
        console.warn('');
        console.warn(logColors.FgMagenta, `[${dateStr}] ||===========================================||`, logColors.Reload);
        console.warn(logColors.FgMagenta, `[${dateStr}] `, logColors.Reload, logColors.BgGreen, `${configManager.getConfig.APP_NAME} Backend startup...`, logColors.Reload);
        console.warn(logColors.FgMagenta, `[${dateStr}] ||===========================================||`, logColors.Reload);
        console.warn('');

        await DatabaseCore.ping();

        if (configManager.getConfig.NODE_ENV === 'production') {
            console.log(`production server listening on Port : ${PORT} ✅`);
        } else {
            console.log(`listening on http://localhost:${PORT} ✅`);
        }
    }

    public async initRoutes(app: Express): Promise<void> {
        for (const controller of controllers) {
            if (controller instanceof ControllerBase) {
                const ctor = controller.constructor;
                const controllerConfig: ControllerConfigOptions = Reflect.getMetadata(CONTROLLER_CONFIG_KEY, ctor) || {};
                const routeBase = controllerConfig.baseRoute ?? ctor.name.replace(/Controller$/, '').toLowerCase();
                app.use(`/api/${routeBase}`, controller.router);
            }
        }
    }

    public startServer(app: Express, PORT: number | string): Server {
        try {
            app.use(handlers.errorHandler);
            return app.listen(PORT, () => this.initLogs(app, PORT));
        } catch (error) {
            console.error('Erreur lors du lancement du serveur :', error);
            process.exit(1);
        }
    }
}

export default new InitBase();
