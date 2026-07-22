import { Repertoire, RepertoirePayload } from '~/models/repertoires';
import { UserAccessLevel } from '~/types/typeCore';
import { ControllerConfig } from '~/core/controllerBase';
import TableController from './tableController';
import RepertoiresModule from "~/module/repertoiresModule";

@ControllerConfig({ baseRoute: "repertoires", accessLevel: UserAccessLevel.USER })
class RepertoiresController extends TableController<Repertoire, RepertoirePayload> {
    constructor() {
        super(RepertoiresModule)
    }

    // public --> start region /////////////////////////////////////////////
    // public --> end region ///////////////////////////////////////////////

    // private --> start region ////////////////////////////////////////////
    // private --> end region //////////////////////////////////////////////
}
export default new RepertoiresController();