import { MusicTrack, musicTrackMapper } from './../models/musicTrack';
import { Lyrics, lyricsMapper } from './../models/lyrics';
import lrclib from "~/module/services/lyrics/lrclib";
import itunes from "~/module/services/music/itunes";
class ResourcesManager {
    constructor() {}

    // public --> start region /////////////////////////////////////////////
    public async searchLyrics(query: string): Promise<Lyrics[]> {
        const search = await lrclib.searchLyrics(query);
        const mapped = lyricsMapper(search);
        return mapped;
    }

    public async searchLyricsByTrackAndArtist(track: string, artist: string): Promise<Lyrics[]> {
        const search = await lrclib.searchLyricsByTrackAndArtist(track, artist);
        const mapped = lyricsMapper([search]);
        return mapped;
    }

    public async getLyrics(id: number): Promise<Lyrics[]> {
        const search = await lrclib.getLyrics(id);
        const mapped = lyricsMapper([search]);
        mapped[0].id = Number(id);
        return mapped;
    }

    public async searchMusicTrack(query: string): Promise<MusicTrack[]> {
        const tracks = await itunes.searchTrack(query);
        const mapped = musicTrackMapper(tracks.results);
        return mapped;
    }

    public async getMusicTrack(id: number): Promise<MusicTrack[]> {
        const track = await itunes.searchByTrackId(id);
        if (!track) return [];
        const mapped = musicTrackMapper([track]);
        return mapped;
    }
    // public --> end region ///////////////////////////////////////////////

    // private --> start region ////////////////////////////////////////////
    // private --> end region //////////////////////////////////////////////
}
export default new ResourcesManager();