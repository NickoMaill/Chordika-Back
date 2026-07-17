export type ReCAPTCHAResponse = {
    success: boolean;
    challenge_ts?: Date;
    hostname?: string;
    'error-codes'?: string[];
};
