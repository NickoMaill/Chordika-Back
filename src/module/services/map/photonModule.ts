import configManager from '~/managers/configManager';
import { PhotonMapType } from './contracts/photonType';
import ApiManager from '~/managers/apiManager';

class PhotonModule extends ApiManager {
    constructor() {
        super(configManager.getConfig.PHOTON_BASEURL);
    }

    // public --> start region /////////////////////////////////////////////
    public async autocomplete(query: string): Promise<PhotonMapType> {
        const result = await this.get<PhotonMapType>('api', { lang: 'fr', q: query });
        return result;
    }

    public async cityAutocomplete(query: string): Promise<PhotonMapType> {
        const req = await this.autocomplete(query);
        req.features = req.features.filter((m) => ['village', 'town'].includes(m.properties.osm_value));
        return req;
    }

    public async getByCoordinate(lon: number, lat: number): Promise<PhotonMapType> {
        const result = await this.get<PhotonMapType>('reverse', { lang: 'fr', lon, lat });
        return result;
    }
    // public --> end region ///////////////////////////////////////////////

    // private --> start region ////////////////////////////////////////////
    // private --> end region //////////////////////////////////////////////
}
export default new PhotonModule();
