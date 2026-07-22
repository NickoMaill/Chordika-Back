import { LRCLIBResponseType } from '~/module/services/lyrics/contracts/lrclibTypes';
export type Lyrics = {
    id: number;
    title: string;
    artist: string;
    album: string;
    lyrics: string;
};

export const lyricsMapper = (arr: LRCLIBResponseType[]): Lyrics[] => {
    return arr.map((o) => ({
        id: o.id,
        title: o.trackName,
        artist: o.artistName,
        album: o.albumName,
        lyrics: o.plainLyrics,
    }));
};
