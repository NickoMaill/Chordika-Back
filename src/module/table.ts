import { request } from 'express';
import { AppRequest } from '~/core/controllerBase';
import { ApiTable, DatabaseCoreQuery, Like, QuerySearch } from '~/types/coreApiTypes';
import { DatabaseCore } from '~/core/dataBaseCore';
import { StandardError } from '~/core/class/standardError';
import { OutputQueryRequest, UserAccessLevel } from '~/types/typeCore';
import { AppTools } from '~/helpers/appTools';
import { FormMaker } from '~/types/formMaker';
import { FormField, GrammarModel, ICenterConfig, TableDisplay } from '~/types/tableType';
import { Model } from '~/models/base';
import logManager from '~/managers/logManager';

export type ValidateFormFieldType<T> = { field: keyof T; name: string };
type ModelCtor<T extends Model> = {
    new (): T;
    getColumns(): string[];
};

class Table<T extends Model, P> {
    // ------------- default PARAMS -----------------
    protected Table(): ApiTable {
        return ApiTable.LOGS;
    }
    protected TableIcon(): string {
        return '';
    }
    protected Level(): UserAccessLevel {
        return UserAccessLevel.ADMIN;
    }
    protected LevelNew(): UserAccessLevel {
        return this.Level();
    }
    protected LevelUpdate(): UserAccessLevel {
        return this.Level();
    }
    protected LevelDelete(): UserAccessLevel {
        return this.Level();
    }
    protected LevelExport(): UserAccessLevel {
        return UserAccessLevel.NOBODY;
    }
    protected LevelBulkUpdate(): UserAccessLevel {
        return UserAccessLevel.NOBODY;
    }
    protected LevelBulkAdd(): UserAccessLevel {
        return this.LevelBulkUpdate();
    }
    protected LevelBulkDelete(): UserAccessLevel {
        return this.LevelBulkUpdate();
    }
    protected AllowNew(): boolean {
        return true;
    }
    protected AllowDelete(): boolean {
        return true;
    }
    protected AllowUpdate(): boolean {
        return true;
    }
    protected AllowExport(): boolean {
        return true;
    }
    protected ExtraSelect(): string[] {
        return null;
    }
    protected DefaultSort(): keyof T {
        return null;
    }
    protected DefaultAsc(): boolean {
        return true;
    }
    protected DefaultLimit(): number {
        return 10;
    }
    protected LogAction(): string {
        return this.Table();
    }
    protected EnableActionLogs(): boolean {
        return false;
    }
    protected ExtraFrom(): { reference: string; target: string; join: ApiTable; type: 'INNER' | 'LEFT' | ''; joinTarget?: ApiTable }[] {
        return null;
    }
    protected ExtraWhere(): { like?: Like<T>; equals?: Partial<T> } {
        return null;
    }
    protected SearchContent(): QuerySearch<T>[] {
        return [];
    }
    protected SearchDefault(): QuerySearch<T> {
        return null;
    }
    private SqlFields(): string[] {
        return this.model.getColumns();
    }
    protected FormFields(): FormField[] {
        return [];
    }
    protected SortCriteria(): string {
        return null;
    }
    protected EnableFile(): boolean {
        return false;
    }
    protected RequiredField(): ValidateFormFieldType<P>[] {
        return [];
    }
    protected UniqField(): ValidateFormFieldType<P>[] {
        return [];
    }
    protected TableTemplate(): TableDisplay<T> {
        return {
            colStruct: [],
            actions: [],
            defaultSort: null,
        };
    }
    protected Grammar(): GrammarModel {
        return {
            singular: '',
            plural: '',
            singularArticle: '',
            pluralArticle: '',
            isFem: false,
        };
    }
    protected async SearchFormTemplate(): Promise<FormMaker> {
        return {
            search: [],
        };
    }
    protected async FormTemplate(): Promise<FormMaker> {
        return {
            tabs: [],
            panels: [],
            search: [],
        };
    }
    private _request: AppRequest;
    private model: ModelCtor<T>;
    // ---------------------------------------
    protected getData: OutputQueryRequest<T>;
    protected get Request(): AppRequest<P> {
        if (!this._request) {
            this._request = request;
        }
        return this._request;
    }
    protected set Request(value: AppRequest<P>) {
        this._request = value;
    }
    protected db: DatabaseCore;
    // ------------- PRIVATE -----------------
    public Payload: P = null;

    constructor(req?: AppRequest, model?: ModelCtor<T>) {
        if (req) {
            this.Request = req;
        }
        if (model) {
            this.model = model;
        }
    }

    private async validateForm(): Promise<void> {
        delete (this.Payload as any).GenericAction;
        delete (this.Payload as any).ID;

        if (this.RequiredField().length > 0) {
            this.RequiredField().forEach((f) => {
                if (!this.Payload[f.field] || this.Payload[f.field] === null || this.Payload[f.field] === '' || this.Payload[f.field] === undefined) {
                    throw new StandardError('validate', 'BAD_REQUEST', `required_field`, `Le champ ${f.name} est requis`, `La champs ${f.name} est requis, veuillez réessayer avec les bonnes valeurs`, false, { field: f.field, name: f.name });
                }
            });
        }
        if (this.UniqField().length > 0) {
            for await (const u of this.UniqField()) {
                const query: DatabaseCoreQuery<any> = {
                    where: {
                        equals: {
                            [u.field]: this.Payload[u.field],
                        },
                        ...(this.Request.method !== 'POST'
                            ? {
                                  notEquals: {
                                      id: this.Request.params.id,
                                  },
                              }
                            : null),
                    },
                };
                const row = await this.db.getByQuery(query);
                if (row.totalRecords > 0) {
                    throw new StandardError('validate', 'BAD_REQUEST', `uniq_field`, `La valeur de ${u.name} doit être unique`, `La valeur de ${u.name} doit être unique, veuillez réessayer avec une autre valeur`, false, { field: u.field, name: u.name });
                }
            }
        }
        await this.validate();
    }
    protected async validate(): Promise<void> {}

    protected async performUpdate(): Promise<void> {
        throw new StandardError('table.performUpdate', 'BAD_REQUEST', 'unknown_method', 'unknown method requested');
    }
    protected async performNew(): Promise<OutputQueryRequest<T>> {
        throw new StandardError('table.performNew', 'BAD_REQUEST', 'unknown_method', 'unknown method requested');
    }
    protected async performDelete(): Promise<void> {
        throw new StandardError('table.performDelete', 'BAD_REQUEST', 'unknown_method', 'unknown method requested');
    }

    protected async queryOne(id?: number): Promise<void> {
        await this.beforeQuery();
        this.db = new DatabaseCore(this.Table(), this.SqlFields());
        const baseQuery: DatabaseCoreQuery = {
            select: this.ExtraSelect(),
            join: this.ExtraFrom(),
            where: this.ExtraWhere(),
        };
        if (!baseQuery.where?.equals) {
            baseQuery.where = { ...baseQuery.where, rawQuery: [] };
        }
        baseQuery.where.rawQuery.push(`${this.Table()}.id = ${id ? id : this.Request.params.id}`);
        this.getData = await this.db.getByQuery<T>(baseQuery);
        this.getData = await this.handleQuery(this.getData);
    }

    protected async queryAll(): Promise<void> {
        await this.beforeQuery();
        await this.tableQuery();
        this.getData = await this.handleQuery(this.getData);
    }

    protected async searchByQuery(query: DatabaseCoreQuery<T>): Promise<OutputQueryRequest<T>> {
        await this.beforeQuery();
        await this.tableQuery(query);
        return await this.handleQuery(this.getData);
    }

    private async tableQuery(query: DatabaseCoreQuery<T> = null): Promise<void> {
        if (!query) {
            if (this.ExtraSelect() && this.ExtraSelect().length > 0) {
                this.ExtraSelect().unshift(this.Table + '.*');
            }
            const baseQuery: DatabaseCoreQuery = {
                select: this.ExtraSelect(),
                join: this.ExtraFrom(),
                where: this.ExtraWhere(),
            };
            query = AppTools.buildDbQuery(this.Request.query, this.SearchContent(), baseQuery);
        }
        if (!query.order && !query.multiOrder) {
            query.order = this.DefaultSort();
            query.asc = this.DefaultAsc();
        }
        if (!query.limit) {
            query.limit = this.DefaultLimit();
        }
        if (!query.offset) {
            query.offset = 0;
        }

        this.db = new DatabaseCore(this.Table(), this.SqlFields());
        this.getData = await this.db.getByQuery(query);
    }

    protected async Log(deleteAction: boolean = false): Promise<string> {
        const oldGetData = !this.getData || this.getData.records.length < 1 ? null : this.getData.records[0];
        await this.queryOne();

        if (deleteAction) {
            return AppTools.SetGenericActionLog(this.SqlFields(), this.getData.records[0], null);
        } else {
            return AppTools.SetGenericActionLog(this.SqlFields(), this.getData.records[0], oldGetData);
        }
    }

    protected async performBulkAdd(): Promise<void> {
        throw new StandardError('table.performBulkAdd', 'BAD_REQUEST', 'unknown_method', 'unknown method requested');
    }

    protected async performBulkUpdate(): Promise<void> {
        throw new StandardError('table.performBulkUpdate', 'BAD_REQUEST', 'unknown_method', 'unknown method requested');
    }

    protected async performBulkDelete(): Promise<void> {
        throw new StandardError('table.performBulkDelete', 'BAD_REQUEST', 'unknown_method', 'unknown method requested');
    }

    protected async performBulkAddFile(): Promise<void> {
        throw new StandardError('table.performBulkAddFile', 'BAD_REQUEST', 'unknown_method', 'unknown method requested');
    }

    protected async performBulkUpdateFile(): Promise<void> {
        throw new StandardError('table.performBulkUpdateFile', 'BAD_REQUEST', 'unknown_method', 'unknown method requested');
    }

    protected async handleQuery(data: OutputQueryRequest<T>): Promise<OutputQueryRequest<T>> {
        return data;
    }
    protected async beforeQuery(): Promise<void> {}
    // -----------------------------------------------------

    // Méthodes publiques pour accéder aux méthodes protégées
    public get publicLevel(): UserAccessLevel {
        return this.Level();
    }
    public get publicLevelNew(): UserAccessLevel {
        return this.LevelNew();
    }
    public get publicLevelUpdate(): UserAccessLevel {
        return this.LevelUpdate();
    }
    public get publicLevelDelete(): UserAccessLevel {
        return this.LevelDelete();
    }
    public get publicLevelExport(): UserAccessLevel {
        return this.LevelExport();
    }

    public get publicLevelBulkAdd(): UserAccessLevel {
        return this.LevelBulkAdd();
    }

    public get publicLevelBulkUpdate(): UserAccessLevel {
        return this.LevelBulkUpdate();
    }

    public get publicLevelBulkDelete(): UserAccessLevel {
        return this.LevelBulkDelete();
    }

    public setRequest(req: AppRequest): void {
        this.Request = req;
    }
    public setPayload(p: P): void {
        this.Payload = p;
    }

    public async queryAllPublic(): Promise<void> {
        await this.queryAll();
    }

    public async queryOnePublic(id?: number): Promise<void> {
        await this.queryOne(id);
    }

    public async performNewPublic(): Promise<OutputQueryRequest<T>> {
        if (!this.AllowNew()) {
            return;
        }
        this.db = new DatabaseCore(this.Table(), this.SqlFields());
        await this.validateForm();
        const inserted = await this.performNew();
        if (this.EnableActionLogs()) {
            let logTxt = 'Action : New \n\n';
            const logContent = await this.Log();
            if (logContent !== '') {
                logTxt += logContent;
                await logManager.setLog(this.LogAction(), logTxt);
            }
        }
        return inserted;
    }

    public async performUpdatePublic(): Promise<void> {
        if (!this.AllowUpdate()) {
            return;
        }
        await this.queryOne();
        await this.validateForm();
        await this.performUpdate();
        if (this.EnableActionLogs()) {
            let logTxt = 'Action : Update \n\n';
            const logContent = await this.Log();
            if (logContent !== '') {
                logTxt += logContent;
                await logManager.setLog(this.LogAction(), logTxt);
            }
        }
    }

    public async performDeletePublic(): Promise<void> {
        if (!this.AllowDelete()) {
            return;
        }
        await this.queryOne();
        await this.performDelete();
        if (this.EnableActionLogs()) {
            let logTxt = 'Action : Delete \n\n';
            const logContent = await this.Log(true);
            if (logContent !== '') {
                logTxt += logContent;
                await logManager.setLog(this.LogAction(), logTxt);
            }
        }
    }

    public async performBulkAddPublic(): Promise<void> {
        await this.performBulkAdd();
    }

    public async performBulkUpdatePublic(): Promise<void> {
        await this.performBulkUpdate();
    }

    public async performBulkDeletePublic(): Promise<void> {
        await this.performBulkDelete();
    }

    public async performBulkAddFilePublic(): Promise<void> {
        await this.performBulkAddFile();
    }

    public async performBulkUpdateFilePublic(): Promise<void> {
        await this.performBulkUpdateFile();
    }

    public async searchByQueryPublic(query: DatabaseCoreQuery<T>): Promise<OutputQueryRequest<T>> {
        return await this.searchByQuery(query);
    }

    public get Data(): OutputQueryRequest<T> {
        return this.getData;
    }
    public get IsFileEnable(): boolean {
        return this.EnableFile();
    }
    public async getConfig(): Promise<ICenterConfig<T>> {
        const form = await this.FormTemplate();
        const searchForm = await this.SearchFormTemplate();
        if (searchForm.search?.length > 0) {
            searchForm.search.forEach((s) => s.content.forEach((inp) => (inp.size = 12)));
        }
        return {
            grammar: this.Grammar(),
            formTemplate: form.tabs?.length > 0 ? form.tabs : form.panels?.length > 0 ? form.panels : form.search.length > 0 ? form.search : [],
            searchFormTemplate: searchForm.search?.length > 0 ? searchForm?.search : [],
            tableStructure: this.TableTemplate(),
            icon: this.TableIcon(),
            searchFieldDefault: this.SearchDefault()?.field,
            allowAdd: false,
            allowUpdate: false,
            allowDelete: false,
            allowExport: false,
            level: this.Level(),
            levelNew: this.LevelNew(),
            levelUpdate: this.LevelUpdate(),
            levelDelete: this.LevelDelete(),
            levelExport: this.LevelExport(),
            levelBulkNew: this.LevelBulkAdd(),
            levelBulkUpdate: this.LevelBulkUpdate(),
            levelBulkDelete: this.LevelBulkDelete(),
            bulkNew: false,
            bulkUpdate: false,
        };
    }
}

export default Table;
