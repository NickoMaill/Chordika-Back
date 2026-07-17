import App from '~/core/appCore';
import { DatabaseCore } from '~/core/dataBaseCore';
import Ses from '~/core/ses';
import { DataText } from '~/models/dataText';
import { Score, ScoreOrientation, ScorePage, ScorePayload } from '~/models/score';
import { ApiTable, Like, QuerySearch } from '~/types/coreApiTypes';
import { FormMaker, FormMakerStructEnum, InputTypeEnum } from '~/types/formMaker';
import { OutputQueryRequest, UserAccessLevel } from '~/types/typeCore';
import Table from './table';
import { GrammarModel } from '~/types/tableType';

class ScoreModule extends Table<Score, ScorePayload> {
    constructor() {
            super(null, Score);
    }
    protected override Table(): ApiTable {
        return ApiTable.SCORES;
    }
    protected override Level(): UserAccessLevel {
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

    protected override SearchContent(): QuerySearch<Score>[] {
        return [
            { field: 'title', dbField: 'title', typeWhere: 'LIKE', typeClause: 'EQUALS' },
            { field: 'composer', dbField: 'composer', typeWhere: 'LIKE', typeClause: 'EQUALS' },
            { field: 'key', dbField: '', typeWhere: 'EQUALS', typeClause: 'EQUALS' },
            { field: 'tempo', dbField: 'tempo', typeWhere: 'EQUALS', typeClause: 'EQUALS' },
            { field: 'timeSign', dbField: '', typeWhere: 'EQUALS', typeClause: 'EQUALS' },
        ];
    }
    protected override ExtraWhere(): { like?: Like<Score>; equals?: Partial<Score> } {
        const extra: { like?: Like<Score>; equals?: Partial<Score> } = { like: null, equals: null };
        if (this.Request.query.timeSign) {
            const splitted = (this.Request.query.timeSign as string).split('/');
            if (splitted.length > 1) {
                extra.equals.nume = Number(splitted[0]);
                extra.equals.denom = Number(splitted[1]);
            }
        }

        if (this.Request.query.key) {
            const key = this.Request.query.key as string;
            extra.like.key = [key + '%'];
        }
        return extra;
    }
    protected override DefaultSort(): keyof Score {
        return 'id';
    }
    protected override DefaultAsc(): boolean {
        return false;
    }

    protected override Grammar(): GrammarModel {
        return {
            plural: '$user.plural',
            singular: '$user.singular',
            singularArticle: '$common.specifiers.singularApos',
            pluralArticle: '$common.specifiers.plural',
            isFem: false,
        };
    }

    protected override TableIcon(): string {
        return 'PersonRounded';
    }

    protected override async performNew(): Promise<OutputQueryRequest<Score>> {
        const inserted = await this.db.insert<ScorePayload, Score>({
            userId: Ses.UID,
            title: this.Payload.title,
            composer: this.Payload.composer,
            nume: this.Payload.nume,
            denom: this.Payload.denom,
            comment: this.Payload.comment ?? '',
            orientation: this.Payload.orientation,
            key: this.Payload.key,
            tempo: this.Payload.tempo,
        });
        const start: ScorePage[] = [{ index: 0, content: [], texts: [] }];
        this.Request.params.id = inserted.records[0].id;
        await App.queryDo('UPDATE Scores SET Content = $2 WHERE ID = $1', inserted.records[0].id, JSON.stringify(start));
        return inserted;
    }

    protected override async performDelete(): Promise<void> {
        await this.db.deleteRecord(this.Request.params.id);
    }

    public static async saveScoreContent(scoreId: number, content: ScorePage[]): Promise<void> {
        await App.queryDo('UPDATE Scores SET Content = $2 WHERE ID = $1', scoreId, JSON.stringify(content));
    }

    // public --> start region /////////////////////////////////////////////
    public static async getAddFormStruct(): Promise<FormMaker> {
        const dataTexts = await App.queryGet<DataText>("SELECT * FROM DataText WHERE type IN ('key', 'timeSig') ORDER BY type, SortOrder ASC");
        return {
            search: [
                {
                    title: 'Propriété de la grille',
                    type: FormMakerStructEnum.SEARCH,
                    content: [
                        {
                            id: 'title',
                            label: 'Titre',
                            index: 1,
                            size: 12,
                            required: true,
                            type: InputTypeEnum.TEXT,
                        },
                        {
                            id: 'composer',
                            label: 'Artiste',
                            index: 1,
                            size: 12,
                            type: InputTypeEnum.TEXT,
                        },
                        {
                            id: 'tempo',
                            label: 'Tempo (BPM)',
                            index: 1,
                            size: 6,
                            type: InputTypeEnum.NUMBER,
                            min: 1,
                            required: true,
                            value: '120',
                            max: 400,
                        },
                        {
                            id: 'key',
                            label: 'Tonalité',
                            index: 2,
                            size: 3,
                            type: InputTypeEnum.SELECT,
                            value: 'C',
                            required: true,
                            selectOptions: dataTexts.rows
                                .filter((r) => r.type === 'key')
                                .sort((a, b) => a.sortOrder - b.sortOrder)
                                .map((r) => ({ value: r.description, label: r.description })),
                        },
                        {
                            id: 'keyType',
                            label: 'Mode',
                            index: 3,
                            size: 3,
                            type: InputTypeEnum.SELECT,
                            value: 'Maj',
                            required: true,
                            selectOptions: [
                                { value: 'Maj', label: 'Maj' },
                                { value: 'Min', label: 'Min' },
                            ],
                        },
                        {
                            id: 'timeSig',
                            label: 'Métrique',
                            index: 1,
                            size: 6,
                            type: InputTypeEnum.SELECT,
                            required: true,
                            value: '4-4',
                            selectOptions: dataTexts.rows
                                .filter((r) => r.type === 'timeSig')
                                .sort((a, b) => a.sortOrder - b.sortOrder)
                                .map((r) => ({ value: r.code, label: r.description })),
                        },
                        {
                            id: 'orientation',
                            label: 'Orientation',
                            index: 2,
                            size: 6,
                            type: InputTypeEnum.RADIO,
                            required: true,
                            value: 0,
                            row: true,
                            radioOptions: [
                                { value: ScoreOrientation.PORTRAIT, label: 'Portrait' },
                                { value: ScoreOrientation.LANDSCAPE, label: 'Paysage' },
                            ],
                        },
                        {
                            id: 'comment',
                            label: 'Commentaire',
                            index: 1,
                            size: 12,
                            type: InputTypeEnum.TEXTAREA,
                        },
                    ],
                },
            ],
        };
    }

    public static async getBarsFormStruct(): Promise<FormMaker> {
        return {
            search: [
                {
                    title: 'Ajouter un groupe des mesures',
                    type: FormMakerStructEnum.SEARCH,
                    content: [
                        {
                            id: "title",
                            label: "titre de la section",
                            index: 1,
                            size: 12,
                            type: InputTypeEnum.TEXT
                        },
                        {
                            id: 'nb',
                            label: 'Nombre de mesures',
                            index: 1,
                            size: 12,
                            required: true,
                            type: InputTypeEnum.NUMBER,
                        },
                        {
                            id: 'perLines',
                            label: 'Mesures par ligne',
                            index: 1,
                            size: 12,
                            type: InputTypeEnum.NUMBER,
                        },
                    ],
                },
            ],
        };
    }

    public static async getSearchForm(): Promise<FormMaker> {
        const dataTexts = await App.queryGet<DataText>("SELECT * FROM DataText WHERE type IN ('key', 'timeSig') ORDER BY type, SortOrder ASC");
        return {
            search: [
                {
                    type: FormMakerStructEnum.SEARCH,
                    icon: 'SearchRounded',
                    title: 'Rechercher des grilles',
                    content: [
                        {
                            id: 'title',
                            label: 'Titre',
                            size: 12,
                            index: 1,
                            type: InputTypeEnum.TEXT,
                        },
                        {
                            id: 'composer',
                            label: 'Artiste',
                            size: 12,
                            index: 1,
                            type: InputTypeEnum.TEXT,
                        },
                        {
                            id: 'key',
                            label: 'Tonalité',
                            size: 12,
                            index: 1,
                            type: InputTypeEnum.SELECT,
                            required: false,
                            selectOptions: dataTexts.rows
                                .filter((r) => r.type === 'key')
                                .sort((a, b) => a.sortOrder - b.sortOrder)
                                .map((r) => ({ value: r.description, label: r.description })),
                        },
                        {
                            id: 'keyType',
                            label: 'Mode',
                            size: 12,
                            index: 1,
                            type: InputTypeEnum.SELECT,
                            required: false,
                            selectOptions: [
                                { value: 'Maj', label: 'Maj' },
                                { value: 'Min', label: 'Min' },
                            ],
                        },
                        {
                            id: 'timeSig',
                            label: 'Métrique',
                            size: 12,
                            index: 1,
                            type: InputTypeEnum.SELECT,
                            required: false,
                            selectOptions: dataTexts.rows
                                .filter((r) => r.type === 'timeSig')
                                .sort((a, b) => a.sortOrder - b.sortOrder)
                                .map((r) => ({ value: r.code, label: r.description })),
                        },
                    ],
                },
            ],
        };
    }

    public static async getUserScoresList(): Promise<OutputQueryRequest<Score>> {
        const db = new DatabaseCore(ApiTable.SCORES, Object.keys(new Score()));
        const scores = await db.getByQuery<Score>({
            where: {
                equals: {
                    userId: Ses.UID,
                },
            },
        });
        return scores;
    }
    // public --> end region ///////////////////////////////////////////////

    // private --> start region ////////////////////////////////////////////
    // private --> end region //////////////////////////////////////////////
}
export default ScoreModule;
