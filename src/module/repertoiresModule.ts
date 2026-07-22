// #region IMPORTS -> /////////////////////////////////////
import Table, { ValidateFormFieldType } from './table';
import { UserAccessLevel, OutputQueryRequest } from '~/types/typeCore';
import { ApiTable, QuerySearch, DatabaseCoreQuery, TableExtraWhereType, TableExtraFromType } from '~/types/coreApiTypes';
import { GrammarModel } from '~/types/tableType';
import { Repertoire, RepertoirePayload } from '~/models/repertoires';
import { FormMaker, FormMakerStructEnum, InputTypeEnum } from '~/types/formMaker';
import { TableDisplay, TableType } from '~/types/tableType';
import Ses from '~/core/ses';
// #endregion IMPORTS -> /////////////////////////////////////

export default class RepertoiresModule extends Table<Repertoire, RepertoirePayload> {
    constructor() {
        super(null, Repertoire);
    }

    // protected --> start region /////////////////////////////////////////////
    protected override Table(): ApiTable {
        return ApiTable.REPERTOIRES;
    }
    protected override Grammar(): GrammarModel {
        return {
            singular: '$repertoire.singular',
            plural: '$repertoire.plural',
            singularArticle: '$common.specifiers.singularMasc',
            pluralArticle: '$common.specifiers.plural',
            isFem: false,
        };
    }
    protected override TableIcon(): string {
        return 'FolderOpenRounded';
    }
    protected override EnableActionLogs(): boolean {
        return true;
    }
    protected override Level(): UserAccessLevel {
        return UserAccessLevel.USER;
    }
    protected override LevelNew(): UserAccessLevel {
        return UserAccessLevel.USER;
    }
    protected override LevelUpdate(): UserAccessLevel {
        return UserAccessLevel.USER;
    }
    protected override LevelDelete(): UserAccessLevel {
        return UserAccessLevel.USER;
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
    protected override DefaultAsc(): boolean {
        return true;
    }
    protected override SearchContent(): QuerySearch<Repertoire>[] {
        return [
            { field: "id", dbField: "id", typeWhere: "EQUALS", typeClause: "EQUALS" },
            { field: "title", dbField: "title", typeWhere: "LIKE", typeClause: "EQUALS" },
        ];
    }

    protected override ExtraFrom(): TableExtraFromType[] {
        return [{ reference: 'id', target: 'userId', join: ApiTable.USERS, type: 'LEFT' }];
    }

    protected override ExtraSelect(): string[] {        
        return [`${ApiTable.USERS}.name as UserName`];
    }

    protected override ExtraWhere(): TableExtraWhereType<Repertoire> {
        const q: TableExtraWhereType<Repertoire> = { like: {}, equals: { userId: Ses.UID } };
        return q;
    }

    protected override TableTemplate(): TableDisplay<Repertoire> {
        const table: TableDisplay<Repertoire> = {
            actions: ["update", "delete"],
            defaultSort: { field: "id", sort: "desc" },
            colStruct: [
                {
                    headerField: "id",
                    headerLabel: "ID",
                    sortable: true,
                    type: TableType.NUM
                },
                {
                    headerField: "title",
                    headerLabel: "Nom",
                    sortable: true,
                    type: TableType.TEXT
                },
                {
                    headerField: "addedAt",
                    headerLabel: "Ajouté le",
                    sortable: true,
                    type: TableType.DATETIME
                },
                {
                    headerField: "updatedAt",
                    headerLabel: "Modifié le",
                    sortable: true,
                    type: TableType.DATETIME
                }
            ]
        }
        return table;
    }

    protected override async SearchFormTemplate(): Promise<FormMaker> {
        return {
            search: [
                {
                    title: '',
                    icon: 'search',
                    type: FormMakerStructEnum.SEARCH,
                    content: [
                        {
                            id: "id",
                            label: "ID",
                            type: InputTypeEnum.NUMBER,
                            index: 1,
                            size: 12
                        }, 
                        {
                            id: "title",
                            label: "Nom",
                            type: InputTypeEnum.TEXT,
                            index: 1,
                            size: 12
                        }
                    ]
                }
            ]
        }
    }

    protected override RequiredField(): ValidateFormFieldType<RepertoirePayload>[] {
        return [{ field: "title", name: "Nom" }];
    }

    protected override async FormTemplate(): Promise<FormMaker> {
        return {
            panels: [
                {
                    title: "Informations",
                    type: FormMakerStructEnum.PANEL,
                    icon: "InfoRounded",
                    content: [
                        {
                            id: "title",
                            label: "Nom",
                            type: InputTypeEnum.TEXT,
                            required: true,
                            index: 1,
                            size: 12,
                        }
                    ]
                }
            ]
        }
    }

    protected override async validate(): Promise<void> {
        if (Ses.AccessLevel !== UserAccessLevel.ADMIN) {
        }
    }

    protected override async performNew(): Promise<OutputQueryRequest<Repertoire>> {
        this.Payload.userId = Ses.UID;
        const inserted = await this.db.insert<RepertoirePayload, Repertoire>(this.Payload, ["title", "userId"]);
        return inserted;
    }

    protected override async performUpdate(): Promise<void> {
        const dbQ: DatabaseCoreQuery<Repertoire, RepertoirePayload> = {
            where: {
                equals: {
                    id: Number(this.Request.params.id)
                }
            },
            update: this.Payload
        }
        await this.db.updateRecord<Repertoire>(dbQ);
    }

    protected override async performDelete(): Promise<void> {
        await this.db.deleteRecord(Number(this.Request.params.id));
    }
    // protected --> end region ///////////////////////////////////////////////

    // private --> start region ////////////////////////////////////////////
    // private --> end region //////////////////////////////////////////////
}