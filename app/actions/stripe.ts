'use server'

import { stripe } from '@/lib/stripe'
import { PRODUCTS } from '@/lib/products'

export async function startCheckoutSession(productId: string, userId: string, trial = false) {
  const product = PRODUCTS.find(p => p.id === productId)
  if (!product) {
    throw new Error(`Product with id "${productId}" not found`)
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    client_reference_id: userId,
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.priceInCents,
          recurring: {
            interval: product.id.includes('annual')
              ? 'year'
              : 'month',
          },
        },
        quantity: 1,
      },
    ],

    // Only add trial_period_days if trial
    subscription_data: trial
      ? { trial_period_days: product.trialDays }
      : undefined,

    success_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}&plan=${product.id}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/billing`,
  })

  return session.url
}
export async function getCheckoutSession(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId)
  return session
}
