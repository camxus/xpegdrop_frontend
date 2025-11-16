import Stripe from "stripe";
import { api } from "./client";

export type BillingInfo = {
  subscription: Stripe.Subscription | null;
  invoices: Stripe.Invoice[];
  payment_method: Stripe.PaymentMethod | null;
};

export const stripeApi = {
  getBillingInfo: async () => {
    return await api.post<BillingInfo>("/stripe/billing");
  },

  getBillingPortalUrl: async () => {
    return await api.post<string>("/stripe/billing/portal");
  },
};
