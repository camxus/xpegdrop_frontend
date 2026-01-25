export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
  features: string[]
  monthly: number
  annual: number
  trialDays?: number
}

const TRIAL_DAYS = 7

// This is the source of truth for all products. 
// All UI to display products should pull from this array. 
// IDs passed to the checkout session should be the same as IDs from this array. 
export const PRODUCTS: Product[] = [
  {
    id: 'artist',
    name: "Artists Pass",
    description: "Ideal for emerging artists and small teams just getting started.",
    priceInCents: 0,
    monthly: 0,
    annual: 0,
    features: [
      "Dropbox storage + 2 GB",
      "Dropbox configuration",
      "Share up to 3 projects",
      "Ratings and feedback system",
    ],
  },
  {
    id: 'pro_monthly',
    name: 'Pro Monthly',
    description: 'For serious creators and small studios that need flexibility and performance.',
    priceInCents: 900, // $6.00
    monthly: 9,
    annual: 90,
    features: [
      'Dropbox storage + 500 GB storage',
      'Unlimited projects',
      'Advanced analytics & project insights',
      'Custom branding & watermark control',
      'Cloud storage for all your images',
    ],
    trialDays: TRIAL_DAYS,
  },
  {
    id: 'pro_annual',
    name: 'Pro Annual',
    description: 'For serious creators and small studios that need flexibility and performance.',
    priceInCents: 9000, // $60.00
    monthly: 9,
    annual: 90,
    features: [
      'Dropbox storage + 500 GB storage',
      'Unlimited projects',
      'Advanced analytics & project insights',
      'Custom branding & watermark control',
      'Cloud storage for all your images',
    ],
    trialDays: 14,
  },
  {
    id: 'agency_monthly',
    name: 'Agency Monthly',
    description: 'Designed for agencies, collectives, and professional teams.',
    priceInCents: 4500, // $45.00
    monthly: 45,
    annual: 450,
    features: [
      '2 TB storage',
      'Team collaboration tools',
      'Priority support',
    ],
  },
  {
    id: 'agency_annual',
    name: 'Agency Annual',
    description: 'Designed for agencies, collectives, and professional teams.',
    priceInCents: 45000, // $450.00
    monthly: 45,
    annual: 450,
    features: [
      '2 TB storage',
      'Team collaboration tools',
      'Priority support',
    ],
  },
]
