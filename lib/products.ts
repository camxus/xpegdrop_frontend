export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
  features: string[]
  monthly: number
  annual: number
}

// This is the source of truth for all products. 
// All UI to display products should pull from this array. 
// IDs passed to the checkout session should be the same as IDs from this array. 
export const PRODUCTS: Product[] = [
  {
    id: 'pro-monthly',
    name: 'Pro Monthly',
    description: 'For serious creators and small studios that need flexibility and performance.',
    priceInCents: 600, // $6.00
    monthly: 6,
    annual: 60,
    features: [
      'Dropbox storage + 500 GB storage',
      'Unlimited projects',
      'Advanced analytics & project insights',
      'Custom branding & watermark control',
      'Cloud storage for all your images',
    ],
  },
  {
    id: 'pro-annual',
    name: 'Pro Annual',
    description: 'For serious creators and small studios that need flexibility and performance. Save with annual billing!',
    priceInCents: 6000, // $60.00
    monthly: 6,
    annual: 60,
    features: [
      'Dropbox storage + 500 GB storage',
      'Unlimited projects',
      'Advanced analytics & project insights',
      'Custom branding & watermark control',
      'Cloud storage for all your images',
    ],
  },
  {
    id: 'agency-monthly',
    name: 'Agency Monthly',
    description: 'Designed for agencies, collectives, and professional teams.',
    priceInCents: 3900, // $39.00
    monthly: 39,
    annual: 390,
    features: [
      '2 TB storage',
      'Team collaboration tools',
      'Priority support',
    ],
  },
  {
    id: 'agency-annual',
    name: 'Agency Annual',
    description: 'Designed for agencies, collectives, and professional teams. Save with annual billing!',
    priceInCents: 39000, // $390.00
    monthly: 39,
    annual: 390,
    features: [
      '2 TB storage',
      'Team collaboration tools',
      'Priority support',
    ],
  },
]
