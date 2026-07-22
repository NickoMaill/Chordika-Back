import { ItunesSearchTrackResponse, ItunesTrackType } from './contracts/itunesType';
import ApiManager from '~/managers/apiManager';
import configManager from '~/managers/configManager';

class Itunes extends ApiManager {
    constructor() {
        super(configManager.getConfig.ITUNES_BASEURL);
    }

    // public --> start region /////////////////////////////////////////////
    public async searchTrack(query: string): Promise<ItunesSearchTrackResponse> {
        const formattedQuery = encodeURIComponent(query);
        const response = await this.get<ItunesSearchTrackResponse>(`/search?term=${formattedQuery}&media=music&entity=song&country=fr&limit=20`);
        return response;
    }

    public async searchByTrackId(id: number): Promise<ItunesTrackType> {
        const response = await this.get<ItunesSearchTrackResponse>(`/lookup?id=${id}`);
        if (response.resultCount === 1) return response.results[0];
        return null;
    }
    // public --> end region ///////////////////////////////////////////////

    // private --> start region ////////////////////////////////////////////
    // private --> end region //////////////////////////////////////////////
}
export default new Itunes();
