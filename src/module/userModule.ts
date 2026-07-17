import { ApiTable, DatabaseCoreQuery, QuerySearch } from '~/types/coreApiTypes';
import Ses from '~/core/ses';
import { TokenPayload, User, UserPayload, UserPreference, UserToken } from '~/models/users';
import Table from './table';
import { OutputQueryRequest, UserAccessLevel } from '~/types/typeCore';
import { DatabaseCore } from '~/core/dataBaseCore';
import bcrypt from 'bcrypt';
import { GrammarModel, TableDisplay, TableType } from '~/types/tableType';
import { FormMaker, FormMakerStructEnum, InputTypeEnum, Struct, Element, Panel, SelectOption, Tab } from '~/types/formMaker';
import App from '~/core/appCore';

export default class UserModule extends Table<User, UserPayload> {
    constructor() {
        super(null, User);
    }
    protected override Table(): ApiTable {
        return ApiTable.USERS;
    }
    protected override Level(): UserAccessLevel {
        return UserAccessLevel.ADMIN;
    }
    protected override AllowDelete(): boolean {
        return true;
    }
    protected override AllowUpdate(): boolean {
        return true;
    }
    protected override AllowNew(): boolean {
        return true;
    }
    protected override AllowExport(): boolean {
        return false;
    }
    protected override SearchContent(): QuerySearch<User>[] {
        return [
            { field: 'addedAt', dbField: 'addedAt', typeWhere: 'EQUALS', typeClause: 'EQUALS' },
            { field: 'email', dbField: 'email', typeWhere: 'LIKE', typeClause: 'EQUALS' },
            { field: 'levelAccess', dbField: 'levelAccess', typeWhere: 'EQUALS', typeClause: 'EQUALS' },
            { field: 'name', dbField: 'name', typeWhere: 'LIKE', typeClause: 'EQUALS' },
            { field: 'id', dbField: 'id', typeWhere: 'EQUALS', typeClause: 'IN' },
            { field: 'lastConDate', dbField: 'lastConDate', typeWhere: 'EQUALS', typeClause: 'EQUALS' },
        ];
    }
    protected override DefaultSort(): keyof User {
        return 'id';
    }
    protected override DefaultAsc(): boolean {
        return false;
    }
    protected override Grammar(): GrammarModel {
        return {
            plural: '$users.plural',
            singular: '$users.singular',
            singularArticle: '$common.specifiers.singularApos',
            pluralArticle: '$common.specifiers.plural',
            isFem: false,
        };
    }

    protected override TableIcon(): string {
        return 'PersonRounded';
    }

    protected override TableTemplate(): TableDisplay<User> {
        return {
            actions: ['update', 'delete'],
            defaultSort: { field: 'id', sort: 'asc' },
            colStruct: [
                {
                    headerField: 'id',
                    headerLabel: 'ID',
                    sortable: true,
                    type: TableType.NUM,
                },
                {
                    headerField: 'name',
                    headerLabel: '$users.username',
                    sortable: true,
                    type: TableType.TEXT,
                },
                {
                    headerField: 'email',
                    headerLabel: '$users.email',
                    sortable: true,
                    type: TableType.TEXT,
                },
                {
                    headerField: 'levelAccess',
                    headerLabel: '$users.levelAccess',
                    sortable: true,
                    type: TableType.NUM,
                },
                {
                    headerField: 'lastConDate',
                    headerLabel: 'Dernière connexion',
                    sortable: true,
                    type: TableType.DATETIME,
                },
            ],
        };
    }

    protected override async SearchFormTemplate(): Promise<FormMaker> {
        const searchPanel: Struct<Element, FormMakerStructEnum.SEARCH> = {
            title: '',
            icon: 'search',
            type: FormMakerStructEnum.SEARCH,
            content: [
                {
                    id: 'id',
                    label: '$users.userId',
                    type: InputTypeEnum.NUMBER,
                    index: 1,
                    size: 12,
                },
                {
                    id: 'name',
                    label: '$users.name',
                    type: InputTypeEnum.TEXT,
                    index: 1,
                    size: 12,
                },
                {
                    id: 'levelAccess',
                    label: '$users.levelAccess',
                    type: InputTypeEnum.SELECT,
                    selectOptions: [
                        { label: '$user.singular', value: UserAccessLevel.USER },
                        { label: '$user.admin', value: UserAccessLevel.ADMIN },
                    ],
                    index: 1,
                    size: 12,
                },
                {
                    id: 'lastConDate',
                    label: '$users.lastCon',
                    type: InputTypeEnum.DATE,
                    index: 1,
                    size: 12,
                },
            ],
        };

        const form: FormMaker = {
            search: [searchPanel],
        };

        return form;
    }

    protected override async FormTemplate(): Promise<FormMaker> {
        const levelOptions: SelectOption[] = [
            { label: '$users.singular', value: UserAccessLevel.USER },
            { label: '$users.admin', value: UserAccessLevel.ADMIN },
        ];

        const panel: Panel = {
            title: 'Informations Générales',
            icon: 'Person',
            type: FormMakerStructEnum.PANEL,
            content: [
                {
                    id: 'name',
                    logLabel: "Nom d'Utilisateur",
                    label: '$users.name',
                    type: InputTypeEnum.TEXT,
                    index: 2,
                    size: 3,
                    icon: 'Person',
                    required: true,
                },
                {
                    id: 'firstName',
                    logLabel: 'Prénom',
                    label: '$users.firstName',
                    type: InputTypeEnum.TEXT,
                    index: 3,
                    size: 3,
                    icon: 'Person',
                    required: true,
                },
                {
                    id: 'lastName',
                    logLabel: 'Nom de famille',
                    label: '$users.lastName',
                    type: InputTypeEnum.TEXT,
                    index: 4,
                    size: 3,
                    icon: 'Person',
                    required: true,
                },
                {
                    id: 'email',
                    logLabel: 'Email',
                    label: '$users.email',
                    type: InputTypeEnum.EMAIL,
                    index: 1,
                    size: 3,
                    icon: 'EmailRounded',
                    required: true,
                    unique: true,
                },
                {
                    id: 'password',
                    logLabel: 'Password',
                    label: '$users.password',
                    type: InputTypeEnum.PASSWORD,
                    index: 2,
                    size: 3,
                    icon: 'Lock',
                },
                {
                    id: 'levelAccess',
                    logLabel: "Niveau d'accès",
                    label: '$users.levelAccess',
                    type: InputTypeEnum.SELECT,
                    selectOptions: levelOptions,
                    index: 3,
                    size: 3,
                    icon: 'Shield',
                    required: true,
                },
            ],
        };

        const tabs: Tab[] = [
            {
                title: 'Informations',
                type: FormMakerStructEnum.TAB,
                icon: 'Info',
                content: [panel],
            },
            {
                title: 'Sessions',
                type: FormMakerStructEnum.TAB,
                content: [
                    {
                        title: 'Sessions',
                        type: FormMakerStructEnum.PANEL,
                        content: [
                            {
                                id: 'sessions',
                                showLabel: false,
                                type: InputTypeEnum.HTML_CONTENT,
                                index: 1,
                                size: 12,
                            },
                        ],
                    },
                ],
            },
            {
                title: 'Historique',
                type: FormMakerStructEnum.TAB,
                content: [
                    {
                        title: 'Historique',
                        type: FormMakerStructEnum.PANEL,
                        content: [
                            {
                                id: 'users/playSessions',
                                label: 'Historique',
                                showLabel: false,
                                type: InputTypeEnum.CENTER_TABLE,
                                index: 1,
                                size: 12,
                                parentField: 'userId',
                            },
                        ],
                    },
                ],
            },
        ];

        return {
            tabs,
        };
    }

    // public --> start region /////////////////////////////////////////////
    public static async getOneByEmail(email: string): Promise<User> {
        const query: DatabaseCoreQuery<User> = {
            where: {
                equals: { email },
            },
        };
        const db = new DatabaseCore(ApiTable.USERS, Object.keys(new User()));

        const response = await db.getByQuery(query);
        if (response.totalRecords !== 1) {
            return null;
        } else {
            return response.records[0];
        }
    }
    public static async getOneById(id: number): Promise<User> {
        const db = new DatabaseCore(ApiTable.USERS, Object.keys(new User()));
        const user = await db.getById<User>(id);
        if (user.totalRecords !== 1) return null;
        return user.records[0];
    }
    public static async getProfile(): Promise<User> {
        if (Ses.UID) {
            const db = new DatabaseCore(ApiTable.USERS, Object.keys(new User()));
            const usr = await db.getById<User>(Ses.UID);
            const pref = await UserPreference.getByQuery({ where: { equals: { userId: Ses.UID } } });
            if (pref.totalRecords > 0) usr.records[0].preferences = pref.records[0];
            return usr.records[0];
        }
        return null;
    }
    public static async insertToken(payload: TokenPayload): Promise<void> {
        const db = new DatabaseCore(ApiTable.TOKENS, UserToken.getColumns());
        await db.insert<TokenPayload, UserToken>(payload);
    }

    public static async updateUserPreferences(body: { subsLang?: string; audioLang?: string; subsStyles?: string }): Promise<void> {
        await App.queryDo("UPDATE usersPreferences SET audioLang = COALESCE($2, 'vo'), subsLang = NULLIF($3, ''), subsStyles = COALESCE($4, subsStyles) WHERE userId = $1", Ses.UID, body.audioLang, body.subsLang, body?.subsStyles);
    }
    // public --> end region ///////////////////////////////////////////////

    // private --> start region ////////////////////////////////////////////
    protected override async performNew(): Promise<OutputQueryRequest<User>> {
        if ((this.Payload.password ?? '') !== '') {
            this.Payload.password = await bcrypt.hash(this.Payload.password, 5);
        }
        const inserted = await this.db.insert<UserPayload, User>(this.Payload, ['name', 'email']);
        await App.queryDo('INSERT INTO usersPreferences (UserId) VALUES ($1)', inserted.records[0].id);
        return inserted;
    }

    protected override async performUpdate(): Promise<void> {
        if ((this.Payload.password ?? '') !== '') {
            this.Payload.password = await bcrypt.hash(this.Payload.password, 5);
        }
        const dbQ: DatabaseCoreQuery<User, UserPayload> = {
            where: {
                equals: {
                    id: this.Request.params.id,
                },
            },
            update: this.Payload,
        };
        await this.db.updateRecord<User>(dbQ);
    }
    // private --> end region //////////////////////////////////////////////
}