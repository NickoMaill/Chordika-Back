import { DataText } from '~/models/dataText';
import TableController from './tableController';
import { DataTextModule } from '~/module/dataTextModule';
import { AppQuery, AppResponse, ControllerConfig, Get } from '~/core/controllerBase';
import { OutputQueryRequest, UserAccessLevel } from '~/types/typeCore';

@ControllerConfig({ baseRoute: 'resources', accessLevel: UserAccessLevel.USER })
class DataTextController extends TableController<DataText, null> {
    constructor() {
        super(DataTextModule);
    }

    @Get('/countries', UserAccessLevel.USER)
    private searchCountries(req: AppQuery<{ q: string; code: string }>, res: AppResponse<OutputQueryRequest<DataText>>): void {
        const countries = DataTextModule.searchCountry(req.query?.q, req.query?.code);
        res.json(countries);
    }

    // public --> start region /////////////////////////////////////////////
    // public --> end region ///////////////////////////////////////////////

    // private --> start region ////////////////////////////////////////////
    // private --> end region //////////////////////////////////////////////
}
export default new DataTextController();
