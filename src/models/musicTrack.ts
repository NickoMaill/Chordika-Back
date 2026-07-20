import { ItunesTrackType } from './../module/services/music/contracts/itunesType';
export type MusicTrack = {
    id: number;
    title: string;
    artist: string;
    album: string;
    releaseDate: string;
    previewUrl: string;
    artwork: string;
}

export const musicTrackMapper = (arr: ItunesTrackType[]): MusicTrack[] => {
    return arr.map((t) => ({
        id: t?.trackId,
        title: t.trackName,
        artist: t.artistName,
        album: t.collectionName,
        releaseDate: t.releaseDate,
        previewUrl: t.previewUrl,
        artwork: t.artworkUrl100,
    }));
}