import { BaseModel } from '~/types/typeCore';
import { Model } from './base';
import { ApiTable } from '~/types/coreApiTypes';

export class Score extends Model implements BaseModel {
    protected static override table = ApiTable.SCORES;
    public id: number;
    public userId: number;
    public isLib: boolean;
    public title: string;
    public composer: string;
    public nume: number;
    public denom: number;
    public key: string;
    public tempo: number;
    public comment?: string;
    public fontStyle?: string;
    public orientation: ScoreOrientation;
    public content: ScorePage[];
    public addedAt: string;
    public updatedAt?: string;
}
export type ScoreClientPayload = {
    userId: number;
    title: string;
    composer: string;
    timeSig: string;
    key: string;
    tempo: number;
    comment?: string;
    fontStyle?: string;
    orientation: ScoreOrientation;
};

export type ScorePayload = {
    userId?: number;
    title: string;
    composer: string;
    nume: number;
    denom: number;
    key: string;
    tempo: number;
    comment?: string;
    fontStyle?: string;
    orientation: ScoreOrientation;
};
/**
 * @description Conteneur de la Grille (Page)
 */
export interface ScoreApp {
    info: ScoreInfo;
    content: ScorePage[];
}

/**
 * @description Information sur le document
 */
export type ScoreInfo = {
    title: string;
    composer: string;
    denom: number;
    nume: number;
    tempo: number;
    key: string;
    comment?: string;
    orientation: ScoreOrientation;
};

export enum ScoreOrientation {
    PORTRAIT = 0,
    LANDSCAPE = 1,
}

/**
 * @description Page du document
 */
export type ScorePage = {
    index: number;
    content: ScoreBarGroup[];
    texts: ScorePageText[];
};

/**
 * @description Groupe de mesure
 */
export type ScoreBarGroup = {
    title: string;
    index: number;
    maxLength: number;
    position: {
        x: number;
        y: number;
    };
    content: ScoreBar[];
};

/**
 * @description Mesure de la grille
 */
export type ScoreBar = {
    type: string;
    index: number;
    timeBar?: {
        nume: number;
        denom: number;
    };
    tempo?: string;
    key?: string;
    mesureNumber?: number;
    isRepeat?: boolean;
    content: ScoreBarContent[];
    isTheEnd?: boolean;
};

/**
 * @description Division de la mesure
 */
export type ScoreBarContent = {
    chordName: string;
    chordID: string;
    index: number;
    symbols?: string;
};

/**
 * @description Texte présent sur les page de la grille
 */
export type ScorePageText = {
    content: string;
    parentPage: number;
    position: {
        x: number;
        y: number;
    };
};
