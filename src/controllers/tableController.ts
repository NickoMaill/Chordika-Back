import { BaseModel } from '~/types/typeCore';
// import { NextFunction } from 'express';
import multer, { Multer } from 'multer';
import ControllerBase, { AppParams, AppQuery, AppRequest, AppResponse, Get, Post, Put, Delete, Patch } from '~/core/controllerBase';
import { OutputQueryRequest } from '~/types/typeCore';
import { AppTools } from '~/helpers/appTools';
// import { checkAuth } from '~/middlewares/auth';
import Table from '~/module/table';
import { ICenterConfig } from '~/types/tableType';
import { Model } from '~/models/base';
import { queryParser } from '~/middlewares/bodyParser';

class TableController<T extends Model & BaseModel, P extends any> extends ControllerBase {
    public Module: new () => Table<T, P>;
    private upload: ReturnType<Multer['single']>;

    constructor(module: new () => Table<T, P>) {
        super();
        this.Module = module;
        // const configModule = new module();
        // if (configModule.IsFileEnable) {
        //     const mul = multer();
        //     this.upload = mul.single('file');
        // } else {
        //     this.upload = (req: AppRequest, res: AppResponse, next: NextFunction): void => next();
        // }
        // this.router.get('/', queryParser, (req, res, next) => checkAuth(req, res, next, configModule.publicLevel), this.getAll.bind(this));
        // // this.router.get('/config', queryParser, (req, res, next) => checkAuth(req, res, next, configModule.publicLevel), this.getConfig.bind(this));
        // this.router.get('/:id', queryParser, (req, res, next) => checkAuth(req, res, next, configModule.publicLevel), this.getById.bind(this));
        // this.router.post('/', (req, res, next) => checkAuth(req, res, next, configModule.publicLevelNew), this.upload, this.create.bind(this));
        // this.router.put('/:id', (req, res, next) => checkAuth(req, res, next, configModule.publicLevelUpdate), this.upload, this.update.bind(this));
        // this.router.delete('/:id', (req, res, next) => checkAuth(req, res, next, configModule.publicLevelDelete), this.delete.bind(this));
        // this.router.post('/bulk/:id', (req, res, next) => checkAuth(req, res, next, configModule.publicLevelBulkAdd), this.bulkAdd.bind(this));
        // this.router.patch('/bulk/:id', (req, res, next) => checkAuth(req, res, next, configModule.publicLevelBulkUpdate), this.bulkUpdate.bind(this));
        // this.router.delete('/bulk/:id', (req, res, next) => checkAuth(req, res, next, configModule.publicLevelBulkDelete), this.bulkDelete.bind(this));
        // this.router.post('/bulkFile/:id', (req, res, next) => checkAuth(req, res, next, configModule.publicLevelBulkAdd), this.bulkAddByFile.bind(this));
        // this.router.put('/bulkFile/:id', (req, res, next) => checkAuth(req, res, next, configModule.publicLevelBulkUpdate), this.bulkUpdateByFile.bind(this));
    }

    public createRequestModule(req: AppRequest): Table<T, P> {
        const module = new this.Module();
        module.setRequest(req);
        return module;
    }

    @Get<TableController<T, P>>("/config", (ctr, req) => ctr.createRequestModule(req).publicLevel, queryParser)
    private async getConfig(req: AppQuery, res: AppResponse<ICenterConfig<T> | any>): Promise<void> {
        const module = new this.Module();
        module.setRequest(req);
        const config = await module.getConfig();
        res.status(200).json(config);
    }

    @Get<TableController<T, P>>("/", (ctr, req) => ctr.createRequestModule(req).publicLevel, queryParser)
    private async getAll(req: AppQuery, res: AppResponse<OutputQueryRequest<T> | any>): Promise<void> {
        const module = new this.Module();
        module.setRequest(req);
        await module.queryAllPublic();
        res.status(200).json(module.Data);
    }

    @Get<TableController<T, P>>("/:id", (ctr, req) => ctr.createRequestModule(req).publicLevel, queryParser)
    protected async getById(req: AppRequest, res: AppResponse<T | any>): Promise<void> {
        const module = new this.Module();
        module.setRequest(req);
        await module.queryOnePublic();
        res.status(200).json(module.Data.records);
    }

    @Post<TableController<T, P>>("/", (ctr, req) => ctr.createRequestModule(req).publicLevelNew, queryParser, multer().single("file"))
    protected async create(req: AppRequest<P>, res: AppResponse<{ success: boolean; inserted: T } | any>): Promise<void> {
        const module = new this.Module();
        module.setRequest(req);
        module.setPayload(AppTools.parseQuery(req.body as Record<string, string>) as P);
        const inserted = await module.performNewPublic();
        res.status(201).json({ success: true, inserted: inserted.records[0] });
    }

    @Put<TableController<T, P>>("/:id", (ctr, req) => ctr.createRequestModule(req).publicLevelUpdate, queryParser, multer().single("file"))
    protected async update(req: AppRequest<P>, res: AppResponse<{ success: boolean } | any>): Promise<void> {
        const module = new this.Module();
        module.setRequest(req);
        module.setPayload(AppTools.parseQuery(req.body as Record<string, string>) as P);
        await module.performUpdatePublic();
        res.status(200).json({ success: true });
    }

    @Delete<TableController<T, P>>("/:id", (ctr, req) => ctr.createRequestModule(req).publicLevelDelete, queryParser)
    protected async delete(req: AppParams<{ id: number }>, res: AppResponse<{ success: boolean } | any>): Promise<void> {
        const module = new this.Module();
        module.setRequest(req);
        await module.performDeletePublic();
        res.status(200).json({ success: true });
    }

    @Post<TableController<T, P>>("/bulk", (ctr, req) => ctr.createRequestModule(req).publicLevelBulkAdd, queryParser)
    protected async bulkAdd(req: AppRequest, res: AppResponse<{ success: true }>): Promise<void> {
        const module = new this.Module();
        module.setRequest(req);
        await module.performBulkAddPublic();
        res.status(200).json({ success: true });
    }

    @Patch<TableController<T, P>>("/bulk", (ctr, req) => ctr.createRequestModule(req).publicLevelBulkUpdate, queryParser)
    protected async bulkUpdate(req: AppRequest, res: AppResponse<{ success: true }>): Promise<void> {
        const module = new this.Module();
        module.setRequest(req);
        await module.performBulkUpdatePublic();
        res.status(200).json({ success: true });
    }

    @Delete<TableController<T, P>>("/bulk", (ctr, req) => ctr.createRequestModule(req).publicLevelBulkDelete, queryParser)
    protected async bulkDelete(req: AppRequest, res: AppResponse<{ success: true }>): Promise<void> {
        const module = new this.Module();
        module.setRequest(req);
        await module.performBulkDeletePublic();
        res.status(200).json({ success: true });
    }

    @Post<TableController<T, P>>("/bulkFile", (ctr, req) => ctr.createRequestModule(req).publicLevelBulkDelete, queryParser)
    protected async bulkAddByFile(req: AppRequest, res: AppResponse<{ success: true }>): Promise<void> {
        const module = new this.Module();
        module.setRequest(req);
        await module.performBulkAddFilePublic();
        res.status(200).json({ success: true });
    }

    @Patch<TableController<T, P>>("/bulkFile", (ctr, req) => ctr.createRequestModule(req).publicLevelBulkDelete, queryParser, multer().single("file"))
    protected async bulkUpdateByFile(req: AppRequest, res: AppResponse<{ success: true }>): Promise<void> {
        const module = new this.Module();
        module.setRequest(req);
        await module.performBulkUpdateFilePublic();
        res.status(200).json({ success: true });
    }
}

export default TableController;
