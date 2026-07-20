import { AppParams, AppRequest, AppResponse, ControllerConfig, Get, Put } from '~/core/controllerBase';
import { Score, ScorePage, ScoreClientPayload } from '~/models/score';
import ScoreModule from '~/module/scoreModule';
import { UserAccessLevel } from '~/types/typeCore';
import TableController from './tableController';

@ControllerConfig({ baseRoute: 'scores', accessLevel: UserAccessLevel.USER })
class ScoreController extends TableController<Score, ScoreClientPayload> {
    constructor() {
        super(ScoreModule)
    }

    // @Get("/form/add", UserAccessLevel.USER)
    // public async GetFormAddStructure(_req: AppRequest, res: AppResponse): Promise<void> {
    //     const get = await ScoreModule.getAddFormStruct();
    //     res.json(get.search);
    // }

    @Get("/form/bars", UserAccessLevel.USER)
    public async GetFormBarsStructure(_req: AppRequest, res: AppResponse): Promise<void> {
        const get = await ScoreModule.getBarsFormStruct();
        res.json(get.search);
    }
    // @Get("/form/search", UserAccessLevel.USER)
    // public async GetSearchForm(_req: AppRequest, res: AppResponse): Promise<void> {
    //     const get = await ScoreModule.getSearchForm();
    //     res.json(get.search);
    // }
    // @Get("/list", UserAccessLevel.USER)
    // public async GetScoresList(_req: AppRequest, res: AppResponse): Promise<void> {
    //     const get = await ScoreModule.getUserScoresList();
    //     res.json(get);
    // }
    @Put("/:id/content", UserAccessLevel.USER)
    public async UpdateScoreContent(req: AppParams<{ id: number }, { datas: ScorePage[] }>, res: AppResponse): Promise<void> {
        await ScoreModule.saveScoreContent(req.params.id, req.body.datas);
        res.json({ success: true });
    }
}

export default new ScoreController();
