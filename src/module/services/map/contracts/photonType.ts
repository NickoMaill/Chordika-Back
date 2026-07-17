export type PhotonMapType = {
    features: PhotonMapDetailsType[];
    type: string;
};

export type PhotonMapDetailsType = {
    geometry: {
        coordinates: number[];
        type: string;
    };
    type: string;
    properties: {
        osm_id: number;
        country: string;
        city: string;
        name?: string;
        countrycode: string;
        postcode: string;
        locality: string;
        type: string;
        osm_type: string;
        osm_key: string;
        housenumber?: string;
        street: string;
        district: string;
        osm_value: string;
        state: string;
    };
};
