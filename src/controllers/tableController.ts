import { NextFunction } from 'express';
import multer, { Multer } from 'multer';
import ControllerBase, { AppParams, AppQuery, AppRequest, AppResponse } from '~/core/controllerBase';
import { OutputQueryRequest } from '~/types/typeCore';
import { AppTools } from '~/helpers/appTools';
import { checkAuth } from '~/middlewares/auth';
import Table from '~/module/table';
import { ICenterConfig } from '~/types/tableType';
import { Model } from '~/models/base';
import { queryParser } from '~/middlewares/bodyParser';

class TableController<T extends Model, P extends any> extends ControllerBase {
    public module: Table<T, P>;
    private upload: ReturnType<Multer['single']>;

    constructor(module: new () => Table<T, P>) {
        super();
        this.module = new module();
        if (this.module.IsFileEnable) {
            const mul = multer();
            this.upload = mul.single('file');
        } else {
            this.upload = (req: AppRequest, res: AppResponse, next: NextFunction): void => next();
        }
        this.router.get('/', queryParser, (req, res, next) => checkAuth(req, res, next, this.module.publicLevel), this.getAll.bind(this));
        this.router.get('/config', queryParser, (req, res, next) => checkAuth(req, res, next, this.module.publicLevel), this.getConfig.bind(this));
        this.router.get('/:id', queryParser, (req, res, next) => checkAuth(req, res, next, this.module.publicLevel), this.getById.bind(this));
        this.router.post('/', (req, res, next) => checkAuth(req, res, next, this.module.publicLevelNew), this.upload, this.create.bind(this));
        this.router.put('/:id', (req, res, next) => checkAuth(req, res, next, this.module.publicLevelUpdate), this.upload, this.update.bind(this));
        this.router.delete('/:id', (req, res, next) => checkAuth(req, res, next, this.module.publicLevelDelete), this.delete.bind(this));
        this.router.post('/bulk/:id', (req, res, next) => checkAuth(req, res, next, this.module.publicLevelBulkAdd), this.bulkAdd.bind(this));
        this.router.patch('/bulk/:id', (req, res, next) => checkAuth(req, res, next, this.module.publicLevelBulkUpdate), this.bulkUpdate.bind(this));
        this.router.delete('/bulk/:id', (req, res, next) => checkAuth(req, res, next, this.module.publicLevelBulkDelete), this.bulkDelete.bind(this));
        this.router.post('/bulkFile/:id', (req, res, next) => checkAuth(req, res, next, this.module.publicLevelBulkAdd), this.bulkAdd.bind(this));
        this.router.put('/bulkFile/:id', (req, res, next) => checkAuth(req, res, next, this.module.publicLevelBulkUpdate), this.bulkUpdate.bind(this));
    }

    private async getConfig(req: AppQuery, res: AppResponse<ICenterConfig<T> | any>): Promise<void> {
        this.module.setRequest(req);
        const config = await this.module.getConfig();
        res.status(200).json(config);
    }

    private async getAll(req: AppQuery, res: AppResponse<OutputQueryRequest<T> | any>): Promise<void> {
        this.module.setRequest(req);
        await this.module.queryAllPublic();
        res.status(200).json(this.module.Data);
    }

    protected async getById(req: AppRequest, res: AppResponse<T | any>): Promise<void> {
        this.module.setRequest(req);
        await this.module.queryOnePublic();
        res.status(200).json(this.module.Data.records);
    }

    protected async create(req: AppRequest<P>, res: AppResponse<{ success: boolean; inserted: T } | any>): Promise<void> {
        this.module.setRequest(req);
        this.module.setPayload(AppTools.parseQuery(req.body as Record<string, string>) as P);
        const inserted = await this.module.performNewPublic();
        res.status(201).json({ success: true, inserted: inserted.records[0] });
    }

    protected async update(req: AppRequest<P>, res: AppResponse<{ success: boolean } | any>): Promise<void> {
        this.module.setRequest(req);
        this.module.setPayload(AppTools.parseQuery(req.body as Record<string, string>) as P);
        await this.module.performUpdatePublic();
        res.status(200).json({ success: true });
    }

    protected async delete(req: AppParams<{ id: number }>, res: AppResponse<{ success: boolean } | any>): Promise<void> {
        this.module.setRequest(req);
        await this.module.performDeletePublic();
        res.status(200).json({ success: true });
    }

    protected async bulkAdd(req: AppRequest, res: AppResponse<{ success: true }>): Promise<void> {
        this.module.setRequest(req);
        await this.module.performBulkAddPublic();
        res.status(200).json({ success: true });
    }

    protected async bulkUpdate(req: AppRequest, res: AppResponse<{ success: true }>): Promise<void> {
        this.module.setRequest(req);
        await this.module.performBulkUpdatePublic();
        res.status(200).json({ success: true });
    }

    protected async bulkDelete(req: AppRequest, res: AppResponse<{ success: true }>): Promise<void> {
        this.module.setRequest(req);
        await this.module.performBulkDeletePublic();
        res.status(200).json({ success: true });
    }

    protected async bulkAddByFile(req: AppRequest, res: AppResponse<{ success: true }>): Promise<void> {
        this.module.setRequest(req);
        await this.module.performBulkAddFilePublic();
        res.status(200).json({ success: true });
    }

    protected async bulkUpdateByFile(req: AppRequest, res: AppResponse<{ success: true }>): Promise<void> {
        this.module.setRequest(req);
        await this.module.performBulkUpdateFilePublic();
        res.status(200).json({ success: true });
    }
}

export default TableController;
