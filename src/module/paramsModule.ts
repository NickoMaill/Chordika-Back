import { ApiTable, DatabaseCoreQuery } from '~/types/coreApiTypes';
import { DatabaseCore } from '~/core/dataBaseCore';
import { StandardError } from '~/core/class/standardError';
import { OutputQueryRequest } from '~/types/typeCore';
import { Params, ParamsPayload } from '~/models/params';
import { FTPUploadResponse, UploadOptions } from '~/models/media';
import ftpModule from './services/ftp/ftpModule';
import { AppTools } from '~/helpers/appTools';

class ParamsModule extends DatabaseCore {
    private keys: string[] = Object.keys(new Params());
    constructor() {
        super(ApiTable.PARAMS, Object.keys(new Params()));
    }

    public async getParams(select?: string[]): Promise<OutputQueryRequest<Params>> {
        let records: OutputQueryRequest<Params>;
        if (select) {
            select.forEach((s) => {
                if (!this.keys.includes(s)) {
                    throw new StandardError('paramsModule.getParams', 'BAD_REQUEST', 'unknow_column', `${s} is not a column`);
                }
            });
            const query: DatabaseCoreQuery = {
                select: select,
            };
            records = await this.getByQuery<Params>(query);
        } else {
            records = await this.getAll<Params>();
        }
        return records;
    }

    public async update(payload: ParamsPayload, file?: Express.Multer.File): Promise<void> {
        if (file) {
            const bufferedImg = file?.buffer.toString('base64');
            const uploadOptions: UploadOptions = {
                name: file.originalname.split('.')[0],
                isVideo: false,
                type: file.mimetype.split('/')[1],
                mime: file.mimetype,
            };
            const upload: FTPUploadResponse = await ftpModule.upload({ base64: `${bufferedImg}`, options: uploadOptions });
            upload.bytes = file.size;
            payload.pressFolderUrl = upload.url;
        }
        payload.bioText = AppTools.sanitizeHTML(decodeURIComponent(payload.bioText));
        payload.proText = AppTools.sanitizeHTML(decodeURIComponent(payload.proText));
        payload.defaultListsMailing = (payload.defaultListsMailing as string).split(',').map(l => parseInt(l))
        const query: DatabaseCoreQuery<Params> = {
            update: payload,
        };
        await this.updateRecord(query);
    }
}

export default new ParamsModule();
