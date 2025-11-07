import { api } from "./client";

export class Referral {
  referral_id?: string = undefined;
  created_by: string = "";
  code: string = "";
  created_at?: string = undefined;
  updated_at?: string = undefined;
  reedemed?: boolean = false;
}

export const MAX_REFERRALS_AMOUNT = 5
export const REFERRAL_LENGTH = 6

export const referralsApi = {
  /**
   * Create a new referral
   * User can only create up to 5
   */
  createReferral: async () => {
    return await api.post<Referral>("/referrals");
  },

  /**
   * Get all referrals created by a user
   */
  getUserReferrals: async () => {
    return await api.get<Referral[]>(`/referrals`);
  },

  /**
   * Redeem a referral code
   */
  redeemReferral: async (code: string) => {
    return await api.post(`/referrals/redeem`, { code });
  },

  /**
   * Redeem a referral code
   */
  checkReferral: async (code: string) => {
    return await api.get(`/referrals/check?code=${code}`);
  },
};
