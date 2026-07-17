import configManager from '~/managers/configManager';
import { ReCAPTCHAResponse } from './contracts';
import { StandardError } from '~/core/class/standardError';
import ApiManager from '~/managers/apiManager';

class CaptchaModule extends ApiManager {
    constructor() {
        super(configManager.getConfig.RECAPTCHA_BASEURL);
    }

    // public --> start region /////////////////////////////////////////////
    public async verifyForm(token: string): Promise<boolean> {
        const body = new URLSearchParams({
            secret: configManager.getConfig.RECAPTCHA_SECRET,
            response: token, // le token exact reçu du front
        });
        const res = await this.post<ReCAPTCHAResponse>('siteverify', body, null);
        console.log(res);
        if (res.success) {
            return true;
        }
        throw new StandardError('CaptchaModule.verifyForm', 'BAD_REQUEST', 'invalid_captcha', 'Captcha invalide', 'Captcha invalide');
    }
    // public --> end region ///////////////////////////////////////////////

    // private --> start region ////////////////////////////////////////////
    // private --> end region //////////////////////////////////////////////
}
export default new CaptchaModule();
