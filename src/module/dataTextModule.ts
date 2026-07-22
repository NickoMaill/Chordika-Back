import { MusicTrack } from './../models/musicTrack';
import resourcesManager from '~/managers/resourcesManager';
import { DataText } from '~/models/dataText';
import Table from './table';
import { ApiTable, QuerySearch } from '~/types/coreApiTypes';
import { OutputQueryRequest, UserAccessLevel } from '~/types/typeCore';
import Countries from '~/data/countries.json';
import { AppTools } from '~/helpers/appTools';

export class DataTextModule extends Table<DataText, null> {
    constructor() {
        super(null, DataText);
    }
    protected override Table(): ApiTable {
        return ApiTable.DATATEXT;
    }
    protected override Level(): UserAccessLevel {
        return UserAccessLevel.USER;
    }
    protected override LevelNew(): UserAccessLevel {
        return UserAccessLevel.ADMIN;
    }
    protected override LevelUpdate(): UserAccessLevel {
        return UserAccessLevel.ADMIN;
    }
    protected override LevelDelete(): UserAccessLevel {
        return UserAccessLevel.ADMIN;
    }
    protected override LevelExport(): UserAccessLevel {
        return UserAccessLevel.ADMIN;
    }
    protected override DefaultSort(): keyof DataText {
        return 'id';
    }
    protected override SearchContent(): QuerySearch<DataText>[] {
        return [
            { field: 'code', dbField: 'code', typeClause: 'EQUALS', typeWhere: 'EQUALS' },
            { field: 'q', dbField: 'description', typeClause: 'EQUALS', typeWhere: 'START', caseSensitive: this.Request.query?.type === 'chord' },
            { field: 'type', dbField: 'type', typeClause: 'EQUALS', typeWhere: 'EQUALS' },
        ];
    }

    // public --> start region /////////////////////////////////////////////
    public static searchCountry(q: string, code?: string): OutputQueryRequest<DataText> {
        const countries = Countries.filter((c) => (code ? c.code.toUpperCase() === code.toUpperCase() : AppTools.removeDiacritics(c.name).toLowerCase().includes(AppTools.removeDiacritics(q.toLowerCase().trim())) || c.code.toLowerCase() === AppTools.removeDiacritics(q.toLowerCase())))
            .map<DataText>((c, i) => ({
                id: i,
                code: c.code,
                description: c.name,
                sortOrder: i,
                type: 'country',
                addedAt: null,
                updatedAt: null,
                data: {
                    flag: c.flag,
                },
            }))
            .sort((a, b) => a.description.localeCompare(b.description, 'fr', { sensitivity: 'base' }));

        const out: OutputQueryRequest<DataText> = {
            records: countries,
            totalRecords: countries.length,
            limit: countries.length,
            offset: 0,
        };
        return out;
    }

    public static async searchTracks(q: string, code?: string): Promise<OutputQueryRequest<DataText>> {
        let tracks: MusicTrack[] = [];
        if (code) {
            tracks = await resourcesManager.getMusicTrack(Number(code));
        } else {
            tracks = await resourcesManager.searchMusicTrack(q);
        }
        const datas = tracks.map<DataText>((d, i) => ({
            id: d.id,
            code: d.id.toString(),
            description: [d.title, d.artist, d.album].join(' - '),
            sortOrder: i,
            type: 'tracks',
            addedAt: null,
            updatedAt: null,
        }));

        const out: OutputQueryRequest<DataText> = {
            records: datas,
            totalRecords: datas.length,
            limit: datas.length,
            offset: 0,
        };
        return out;
    }
    // public --> end region ///////////////////////////////////////////////

    // private --> start region ////////////////////////////////////////////
    // private --> end region //////////////////////////////////////////////
}
