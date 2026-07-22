import { ApiTable, QuerySearch } from '~/types/coreApiTypes';
import { UserAccessLevel, OutputQueryRequest } from '~/types/typeCore';
import { Log } from '~/models/logs';
import Table from './table';
import { GrammarModel, TableDisplay, TableType } from '~/types/tableType';
import { Element, FormMaker, FormMakerStructEnum, InputTypeEnum, Struct } from '~/types/formMaker';
import App from '~/core/appCore';

class LogsModule extends Table<Log, null> {
    constructor() {
        super(null, Log);
    }
    protected override Table(): ApiTable {
        return ApiTable.LOGS;
    }
    protected override TableIcon(): string {
        return 'ManageSearchRounded';
    }
    protected override Level(): UserAccessLevel {
        return UserAccessLevel.ADMIN;
    }
    protected override LevelNew(): UserAccessLevel {
        return UserAccessLevel.NOBODY;
    }
    protected override LevelUpdate(): UserAccessLevel {
        return UserAccessLevel.NOBODY;
    }
    protected override LevelDelete(): UserAccessLevel {
        return UserAccessLevel.NOBODY;
    }
    protected override LevelExport(): UserAccessLevel {
        return UserAccessLevel.NOBODY;
    }
    protected override AllowDelete(): boolean {
        return false;
    }
    protected override AllowUpdate(): boolean {
        return false;
    }
    protected override AllowNew(): boolean {
        return false;
    }
    protected override AllowExport(): boolean {
        return false;
    }
    protected override SearchContent(): QuerySearch<Log>[] {
        return [
            { field: 'addedAt', dbField: 'addedAt', typeWhere: 'EQUALS', typeClause: 'EQUALS' },
            { field: 'description', dbField: 'description', typeWhere: 'LIKE', typeClause: 'EQUALS' },
            { field: 'action', dbField: 'action', typeWhere: 'LIKE', typeClause: 'EQUALS' },
            { field: 'userName', dbField: 'name', typeWhere: 'LIKE', typeClause: 'EQUALS' },
        ];
    }
    protected override DefaultSort(): keyof Log {
        return 'addedAt';
    }
    protected override DefaultAsc(): boolean {
        return false;
    }
    protected override ExtraFrom(): { reference: string; target: string; join: ApiTable; type: 'INNER' | 'LEFT' | ''; joinTarget?: ApiTable }[] {
        return [{ reference: 'id', target: 'userId', join: ApiTable.USERS, type: 'LEFT' }];
    }
    protected override ExtraSelect(): string[] {
        return ['Users.Name AS username'];
    }

    protected override Grammar(): GrammarModel {
        return {
            plural: '$logs.plural',
            singular: '$logs.singular',
            singularArticle: '$common.specifiers.singularApos',
            pluralArticle: '$common.specifiers.plural',
            isFem: false,
        };
    }

    protected override TableTemplate(): TableDisplay<Log> {
        return {
            actions: ['view'],
            defaultSort: { field: 'addedAt', sort: 'desc' },
            colStruct: [
                { headerField: 'id', headerLabel: 'ID', type: TableType.NUM, sortable: true },
                { headerField: 'username', headerLabel: '$user.singular', type: TableType.TEXT, sortable: true },
                { headerField: 'addedAt', headerLabel: '$logs.entryDate', type: TableType.DATE, sortable: true },
                { headerField: 'description', headerLabel: '$logs.info', type: TableType.TEXT, sortable: true },
                { headerField: 'action', headerLabel: '$logs.action', type: TableType.TEXT, sortable: true },
            ],
        };
    }

    protected override async SearchFormTemplate(): Promise<FormMaker> {
        const actions = await App.queryGet('SELECT DISTINCT Action FROM LOGS');

        const searchPanel: Struct<Element, FormMakerStructEnum.SEARCH> = {
            title: '$logs.search',
            icon: 'search',
            content: [],
            type: FormMakerStructEnum.SEARCH,
        };
        searchPanel.content.push(
            { id: 'userName', label: '$user.singular', type: InputTypeEnum.TEXT },
            { id: 'proxy', label: '$logs.proxy', type: InputTypeEnum.TEXT },
            { id: 'action', label: '$logs.action', type: InputTypeEnum.SELECT, selectOptions: actions.rows.map((opt) => ({ label: opt['action'], value: opt['action'] })) },
            { id: 'entryDate', label: '$common.date', type: InputTypeEnum.DATE_SEARCH },
            {
                id: 'error',
                label: '$common.error',
                type: InputTypeEnum.SELECT,
                selectOptions: [
                    { label: '$common.yes', value: true },
                    { label: '$common.no', value: false },
                ],
            },
            { id: 'info', label: '$logs.info', type: InputTypeEnum.TEXT }
        );
        const form: FormMaker = {
            search: Array.of(searchPanel),
        };
        return form;
    }
    protected override async handleQuery(): Promise<void> {
        this.getData.records.forEach(r => {
            r.description = r.description.replaceAll("\n", "<br/>");
        })
    }
    protected override async FormTemplate(): Promise<FormMaker> {
        const form: FormMaker = {
            panels: [
                {
                    title: 'Informations',
                    icon: 'CircleInfoRounded',
                    content: [
                        {
                            id: 'id',
                            label: 'ID',
                            index: 1,
                            size: 3,
                            type: InputTypeEnum.TEXT,
                        },
                        {
                            id: 'action',
                            label: 'Action',
                            index: 2,
                            size: 3,
                            type: InputTypeEnum.TEXT,
                        },
                        {
                            id: 'userName',
                            label: 'Utilisateur',
                            index: 3,
                            size: 3,
                            type: InputTypeEnum.TEXT,
                        },
                        {
                            id: 'ipAddress',
                            label: 'Adresse IP',
                            index: 4,
                            size: 3,
                            type: InputTypeEnum.TEXT,
                        },
                        {
                            id: 'addedAt',
                            label: 'Date & heure',
                            index: 1,
                            size: 3,
                            type: InputTypeEnum.DATETIME,
                        },
                        {
                            id: 'description',
                            label: 'Contenu',
                            index: 1,
                            size: 12,
                            type: InputTypeEnum.HTML_PARSER,
                        },
                        {
                            id: 'additionalData',
                            label: "Complement d'information",
                            index: 1,
                            size: 12,
                            type: InputTypeEnum.JSON,
                        },
                    ],
                    type: FormMakerStructEnum.PANEL,
                },
            ],
        };

        return form;
    }
}

export default LogsModule;
