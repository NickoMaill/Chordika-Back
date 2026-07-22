import { LRCLIBResponseType } from './contracts/lrclibTypes';
import ApiManager from '~/managers/apiManager';
import configManager from '~/managers/configManager';

class Lrclib extends ApiManager {
    constructor() {
        super(configManager.getConfig.LRCLIB_BASEURL);
    }

    // public --> start region /////////////////////////////////////////////
    public async searchLyrics(query: string): Promise<LRCLIBResponseType[]> {
        const formattedQuery = encodeURIComponent(query);
        const response = await this.get<LRCLIBResponseType[]>(`search?q=${formattedQuery}`);
        return response;
    }

    public async searchLyricsByTrackAndArtist(trackName: string, artistName: string): Promise<LRCLIBResponseType> {
        const formattedTrack = decodeURIComponent(trackName);
        const formattedArtist = decodeURIComponent(artistName);
        const searchParams = new URLSearchParams();
        searchParams.append('artist_name', formattedArtist);
        searchParams.append('track_name', formattedTrack);
        const response = await this.get<LRCLIBResponseType>(`get?${searchParams.toString()}`);
        return response;
    }

    public async getLyrics(id: number): Promise<LRCLIBResponseType> {
        try {
            const response = await this.get<LRCLIBResponseType>(`get/${id}`);
            return response;
        } catch {
            return null;
        }
    }
    // public --> end region ///////////////////////////////////////////////

    // private --> start region ////////////////////////////////////////////
    // private --> end region //////////////////////////////////////////////
}
export default new Lrclib();
