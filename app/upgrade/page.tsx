'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import PricingCard from '@/components/pricing-card'
import { startCheckoutSession } from '@/app/actions/stripe'
import { useAuth } from '@/hooks/api/useAuth'
import { PRODUCTS } from '@/lib/products'
import { useDialog } from '@/hooks/use-dialog'
import { RedeemReferralDialog } from '@/components/redeem-referral-dialog'
import { useSearchParams } from 'next/navigation'

export default function UpgradePage() {
  const { user } = useAuth()
  const { show } = useDialog()

  const [showAnnualBilling, setShowAnnualBilling] = useState(true)

  const handleSelectPlan = async (productId: string, trial = false) => {
    if (!user) return

    if (productId.includes("artist")) {
      show({
        title: "Redeem Referral",
        content: () => <RedeemReferralDialog />,
      });
      return
    }

    try {
      const checkoutUrl = await startCheckoutSession(productId, user?.user_id, trial)
      if (checkoutUrl) {
        window.location.href = checkoutUrl
      }
    } catch (error) {
      console.error('Error starting checkout:', error)
    }
  }

  const planNames = Array.from(new Set(PRODUCTS.map(p => {
    if (p.id.includes("artist")) return "Artist"
    if (p.id.includes("pro")) return "Pro"
    if (p.id.includes("agency")) return "Agency"
    return p.name
  })))

  const plans = planNames.map((planName, index) => {
    const product = PRODUCTS.find(p => p.id.includes(planName.toLowerCase()))
    const monthlyProduct = PRODUCTS.find(p => p.id.includes(planName.toLowerCase()) && p.id.includes("monthly"))
    const annualProduct = PRODUCTS.find(p => p.id.includes(planName.toLowerCase()) && p.id.includes("annual"))

    return {
      name: planName,
      productId: product?.id || "",
      desc: monthlyProduct?.description || annualProduct?.description || product?.description || "",
      monthly: monthlyProduct?.monthly || 0,
      annual: annualProduct?.annual || 0,
      features: monthlyProduct?.features || annualProduct?.features || product?.features || [],
      trialDays: PRODUCTS.find(p => p.id.includes(planName.toLowerCase()))?.trialDays,
      primary: planName === "Pro",
      monthlyId: monthlyProduct?.id || "",
      annualId: annualProduct?.id || "",
      delay: 0.1 + index * 0.1,
    }
  })

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

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const productId = (showAnnualBilling ? plan.annualId : plan.monthlyId) || plan.productId

            return (
              <PricingCard
                key={plan.name}
                name={plan.name}
                desc={plan.desc}
                features={plan.features}
                monthly={plan.monthly}
                annual={plan.annual}
                trialDays={plan.trialDays}
                buttonText={
                  user?.membership?.membership_id === productId
                    ? `You're currently on ${plan.name}`
                    : `Upgrade to ${plan.name}`
                } primary={plan.primary}
                delay={plan.delay}
                disabled={user?.membership?.membership_id === productId}
                showAnnualBilling={showAnnualBilling}
                setShowAnnualBilling={setShowAnnualBilling}
                onClick={(e, opts) => handleSelectPlan(productId, opts?.trial)}
              />
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
