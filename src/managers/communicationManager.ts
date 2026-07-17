import { AppTools } from '~/helpers/appTools';
import { StandardError } from '../core/class/standardError';
import { CampaignReportType, ContactPayload, IEmailContactDetail, InfoContact, TransactionalEmailType } from '../module/services/mail/contracts';
import configManager from './configManager';
import photonModule from '~/module/services/map/photonModule';
import { PhotonMapDetailsType } from '~/module/services/map/contracts/photonType';
import captchaModule from '~/module/services/captcha/captchaModule';
import { GetEmailCampaigns } from '@getbrevo/brevo';
import mailModule from '~/module/services/mail/mailModule';
import logManager from './logManager';
import App from '~/core/appCore';

const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
class CommunicationManager {
    public async addContactToList(email: string, firstName?: string, lastName?: string, itemName?: string, orderId?: string, country?: string, city?: string, lists: number[] = [configManager.getConfig.SENDINGBLUE_LIST_ID]): Promise<{ id: number }> {
        const contactInfo: InfoContact = {
            email,
            attributes: {
                NOM: firstName,
                PRENOM: lastName,
                COUNTRY: country,
                CITY: city,
            },
            listIds: lists,
        };
        const id = await mailModule.createContact(contactInfo);
        return id;
    }

    public async addContact(payload: ContactPayload): Promise<{ id: string; alreadyAdded: boolean }> {
        await captchaModule.verifyForm(payload.capVal);
        if (!payload.email.match(AppTools.emailRegex)) throw new StandardError('activityManager.addContact', 'BAD_REQUEST', 'invalid_email', "Format d'email incorrect", "Le format de l'email fournis est incorrect");
        if (payload.tel) {
            payload.tel = payload.tel.trim().replaceAll('-', '').replaceAll(' ', '').replaceAll('_', '');
            if (!payload.tel.match(AppTools.phoneRegex)) throw new StandardError('activityManager.addContact', 'BAD_REQUEST', 'invalid_phone', 'Format du numéro de téléphone incorrect', 'Le format de numéros de téléphone fournis est incorrect');
        }
        let reqCity: PhotonMapDetailsType[] = [];
        if (payload.city) {
            reqCity = (await photonModule.cityAutocomplete(payload.city)).features;

            if (reqCity.length < 1) throw new StandardError('activityManager.addContact', 'BAD_REQUEST', 'city_phone', "La ville renseignée n'existe pas", "la ville fournis n'existe pas dans la base");

            reqCity = reqCity.filter((m) => m.properties.countrycode.toUpperCase() === payload.country.toUpperCase());

            if (reqCity.length < 1) throw new StandardError('activityManager.addContact', 'BAD_REQUEST', 'city_phone', "La ville renseignée n'existe pas", "la ville fournis n'existe pas dans la base");
        }
        const listsIds = await App.queryGet<{ defaultListsMailing: number[] }>('SELECT defaultListsMailing as "defaultListsMailing" FROM Params');
        const toAdd: InfoContact = {
            email: payload.email,
            listIds: listsIds.rowCount > 0 && listsIds.rows[0].defaultListsMailing.length > 0 ? listsIds.rows[0].defaultListsMailing : [configManager.configAsNumber.BREVO_LIST_ID],
            attributes: {
                NOM: payload.lastName,
                PRENOM: payload.firstName,
                SMS: payload.tel,
                CITY: reqCity.length > 0 ? reqCity[0].properties.city : null,
                COUNTRY: reqCity.length > 0 ? reqCity[0].properties.country : null,
                EXT_ID: AppTools.generateUuid(),
            },
        };
        const user = await mailModule.getContactByEmail(payload.email);
        if (!user) {
            const added = await mailModule.createContact(toAdd);
            await App.queryDo("INSERT INTO Subscribers (email, phoneNumber, firstName, lastName, listIds, externalId) VALUES ($1 , $2, $3, $4, $5, $6)", 
                payload.email, 
                payload.tel,
                payload.firstName, 
                payload.lastName,
                toAdd.listIds.join(","),
                added.id
            )
            await logManager.setLog("Abonnés.ées", `Un nouvel abonné a souscrit à la mailing list => ${payload.email}`);
            return { id: toAdd.attributes.EXT_ID, alreadyAdded: false };
        } else {
            return { id: user.attributes['EXT_ID'], alreadyAdded: true };
        }
    }

    public async updateContact(id: number, email: string, firstName?: string, lastName?: string, lists: number[] = []): Promise<void> {
        const contactInfo: InfoContact = {
            email,
            attributes: {
                EMAIL: email,
                NOM: firstName,
                PRENOM: lastName,
            },
            listIds: lists,
        };
        await mailModule.updateContact(id, contactInfo);
    }

    public async sendOrderEmail(to: string, orderId: string, firstName: string, _itemName: string): Promise<void> {
        const emailInfo: TransactionalEmailType = {
            to: [{ email: to }],
            replyTo: { email: configManager.getConfig.USER_MAIL },
            params: {
                NOM: firstName,
            },
            templateId: 3,
        };
        await mailModule.sendTransactionalEmail(emailInfo);
    }

    public async sendContactEmail(data: IEmailContactDetail): Promise<void> {
        if (data.from.length < 1 || data.subject.length < 1 || data.textContent.length < 1) {
            throw new StandardError('communicationManager.sendContactEmail', 'BAD_REQUEST', 'missing_data', 'wrong data receive', 'wrong data receive from website');
        }
        if (!data.from.match(emailRegex)) {
            throw new StandardError('communicationManager.sendContactEmail', 'BAD_REQUEST', 'wrong_email_format', 'wrong email format receive', 'email format is invalid');
        }
        const emailInfo: TransactionalEmailType = {
            to: [{ email: configManager.getConfig.USER_MAIL }],
            subject: data.subject,
            htmlContent: `<p>${data.textContent}</p><br/><br/><span>cet email vous est envoyé depuis l'email ${data.from}</span>`,
        };

        await mailModule.sendTransactionalEmail(emailInfo);
    }

    public async sendResetPassword(to: string, token: string): Promise<void> {
        const emailInfo: TransactionalEmailType = {
            to: [{ email: to }],
            subject: 'Réinitialisation de votre mot de passe',
            htmlContent: `<p>Bonjour</p><br/><br/>
            <p>Vous avez émis une demande de reinitialisation de mot de passe, <a href='${configManager.getConfig.API_BASE_URL}/admin/password/chooseNewPassword/${token}'>cliquez-ici</a> pour modifier votre mot de passe</p><br/><br/>
            <p>Si le lien ne fonctionne pas essayez celui - ci →  <a href='${configManager.getConfig.API_BASE_URL}/admin/password/chooseNewPassword/${token}'>${configManager.getConfig.API_BASE_URL}/admin/password/chooseNewPassword/${token}</a></p><br/><br/>
            <p>Best regards</p>
            <p><strong>L'équipe d'Untel Officiel</strong></p>
            `,
        };
        await mailModule.sendTransactionalEmail(emailInfo);
    }

    public async sendMfa(to: string, otp: string): Promise<void> {
        const emailInfo: TransactionalEmailType = {
            to: [{ email: to }],
            subject: 'Mell Admin : authentification a deux facteurs',
            htmlContent: `
            <p>Bonjour</p>
            <p>Une connexion a été initié sur l'interface administrateur du site mellhumour.com.</p>
            <p>Entrez ce code dans l'espace prévue à cette effet, vous serez redirigé vers votre interface d'administration</p>
            <p style="font-weight: bold; color: red; text-align: center;">Si vous n'êtes pas a l'origine de cette connexion veuillez en informé votre administrateur</p>
            <p style="font-size: 2rem; font-weight: bold; text-align: center; margin-top: 1rem; margin-bottom: 3rem;">${otp}</p>
            <span>Merci,</span><br/>
            <span>L'équipe support mellhumour.com,</span>
            `,
        };
        await mailModule.sendTransactionalEmail(emailInfo);
    }

    public async getCampaigns(limit: number = 50, offset: number = 0): Promise<CampaignReportType[]> {
        const campaigns = await mailModule.getCampaignList(limit, offset);
        return this.mapCampaignToReport(campaigns);
    }
    private mapCampaignToReport(campaigns: GetEmailCampaigns): CampaignReportType[] {
        return campaigns.campaigns.map((m) => ({
            id: m.id,
            name: m.name,
            subject: m.subject,
            status: m.status as unknown as string,
            type: m.type as unknown as string,
            previewText: m.previewText,
            date: new Date(m.scheduledAt),
            replyTo: m.replyTo,
            statistics: {
                uniqueClicks: m.statistics.globalStats.uniqueClicks,
                clickers: m.statistics.globalStats.clickers,
                complaints: m.statistics.globalStats.complaints,
                delivered: m.statistics.globalStats.delivered,
                sent: m.statistics.globalStats.sent,
                softBounces: m.statistics.globalStats.softBounces,
                hardBounces: m.statistics.globalStats.hardBounces,
                uniqueViews: m.statistics.globalStats.uniqueViews,
                trackableViews: m.statistics.globalStats.trackableViews,
                unsubscriptions: m.statistics.globalStats.unsubscriptions,
                viewed: m.statistics.globalStats.viewed,
                deferred: m.statistics.globalStats.deferred,
            },
        }));
    }
}

export default new CommunicationManager();
