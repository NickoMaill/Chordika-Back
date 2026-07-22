import { MusicTrack } from './../models/musicTrack';
import { Lyrics } from './../models/lyrics';
import { UserAccessLevel } from '~/types/typeCore';
import ControllerBase, { ControllerConfig, Get, AppQuery, AppResponse, AppParams } from '~/core/controllerBase';
import resourcesManager from '~/managers/resourcesManager';

@ControllerConfig({ baseRoute: 'resources', accessLevel: UserAccessLevel.VISITOR })
class ResourcesController extends ControllerBase {
    @Get('/lyrics', UserAccessLevel.VISITOR)
    private async SearchLyrics(req: AppQuery<{ q?: string; track?: string; artist?: string }>, res: AppResponse<Lyrics[]>): Promise<void> {
        let lyrics = [];
        if (req.query.q) {
            lyrics = await resourcesManager.searchLyrics(req.query.q);
        } else if (req.query.artist && req.query.track) {
            lyrics = await resourcesManager.searchLyricsByTrackAndArtist(req.query.track, req.query.artist);
        } else {
            lyrics = [];
        }
        res.json(lyrics);
    }

    @Get('/lyrics/:id', UserAccessLevel.VISITOR)
    private async GetLyrics(req: AppParams<{ id: number }>, res: AppResponse<Lyrics[]>): Promise<void> {
        const lyrics = await resourcesManager.getLyrics(req.params.id);
        res.json(lyrics);
    }

    @Get('/tracks', UserAccessLevel.VISITOR)
    private async SearchMusicTracks(req: AppQuery<{ q: string }>, res: AppResponse<MusicTrack[]>): Promise<void> {
        const tracks = await resourcesManager.searchMusicTrack(req.query.q);
        res.json(tracks);
    }

    @Get('/tracks/:id', UserAccessLevel.VISITOR)
    private async GetMusicTrack(req: AppParams<{ id: number }>, res: AppResponse<MusicTrack[]>): Promise<void> {
        const track = await resourcesManager.getMusicTrack(req.params.id);
        res.json(track);
    }
}

export default new ResourcesController();
