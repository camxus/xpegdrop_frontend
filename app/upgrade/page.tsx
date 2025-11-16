'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import PricingCard from '@/components/pricing-card'
import { startCheckoutSession } from '@/app/actions/stripe'
import { useAuth } from '@/hooks/api/useAuth'

export default function UpgradePage() {
  const { user } = useAuth()

  const [showAnnualBilling, setShowAnnualBilling] = useState(false)

  const handleSelectPlan = async (productId: string) => {
    if (!user) return

    try {
      const checkoutUrl = await startCheckoutSession(productId, user?.user_id)
      if (checkoutUrl) {
        window.location.href = checkoutUrl
      }
    } catch (error) {
      console.error('Error starting checkout:', error)
    }
  }

  const plans = [
    {
      name: 'Pro',
      desc: 'For serious creators and small studios that need flexibility and performance.',
      monthly: 6,
      annual: 60,
      features: [
        'Dropbox storage + 500 GB storage',
        'Unlimited projects',
        'Advanced analytics & project insights',
        'Custom branding & watermark control',
        'Cloud storage for all your images',
      ],
      primary: true,
      monthlyId: 'pro-monthly',
      annualId: 'pro-annual',
      delay: 0.1,
    },
    {
      name: 'Agency',
      desc: 'Designed for agencies, collectives, and professional teams.',
      monthly: 39,
      annual: 390,
      features: [
        '2 TB storage',
        'Team collaboration tools',
        'Priority support',
      ],
      primary: false,
      monthlyId: 'agency-monthly',
      annualId: 'agency-annual',
      delay: 0.2,
    },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-6xl"
      >
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
            Choose Your Plan
          </h1>
          <p className="text-lg text-muted-foreground text-balance">
            Select the perfect plan for your creative needs
          </p>

          <div className="flex justify-center mt-8">
            <div className="relative inline-flex items-center bg-muted p-1 rounded-full">
              <motion.div
                className="absolute inset-y-1 bg-background rounded-full shadow-sm"
                initial={false}
                animate={{
                  x: showAnnualBilling ? '100%' : '0%',
                  width: 'calc(50% - 4px)',
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                }}
              />
              <button
                onClick={() => setShowAnnualBilling(false)}
                className={`cursor-pointer relative z-10 px-6 py-2 text-sm font-medium transition-colors ${!showAnnualBilling ? 'text-foreground' : 'text-muted-foreground'
                  }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setShowAnnualBilling(true)}
                className={`cursor-pointer relative z-10 px-6 py-2 text-sm font-medium transition-colors ${showAnnualBilling ? 'text-foreground' : 'text-muted-foreground'
                  }`}
              >
                Annual
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => {
            const productId = showAnnualBilling ? plan.annualId : plan.monthlyId

            return (
              <PricingCard
                key={plan.name}
                name={plan.name}
                desc={plan.desc}
                features={plan.features}
                monthly={plan.monthly}
                annual={plan.annual}
                link=""
                buttonText={`Upgrade to ${plan.name}`}
                primary={plan.primary}
                delay={plan.delay}
                showAnnualBilling={showAnnualBilling}
                setShowAnnualBilling={setShowAnnualBilling}
                onClick={() => handleSelectPlan(productId)}
              />
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
