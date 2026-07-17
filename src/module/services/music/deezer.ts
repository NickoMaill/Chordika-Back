import ApiManager from "~/managers/apiManager";
import configManager from "~/managers/configManager";

class Deezer extends ApiManager {
    constructor() {
        super(configManager.getConfig.DEEZER_BASEURL)
    }

    // public --> start region /////////////////////////////////////////////
    public async searchTrack(query: string): Promise<unknown> {
        const formattedQuery = this.formatQuery({ track: query });
        const response = await this.get<unknown>(`/search?q=${formattedQuery}&strict=on`)
        return response;
    }
    // public --> end region ///////////////////////////////////////////////

    // private --> start region ////////////////////////////////////////////
    private formatQuery(query: Record<string, string | number | boolean>): string {
        let queryString: Set<string> = new Set();
        for (const key in query) {
            queryString.add(`${key}:"${encodeURIComponent(String(query[key]))}"`)
        }
        return queryString.toArray().join(' ');
    }
    // private --> end region //////////////////////////////////////////////
}
export default new Deezer();