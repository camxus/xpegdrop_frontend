"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { useStripe } from '@/hooks/api/useStripe'
import { addDays, format } from 'date-fns'
import { PRODUCTS } from '@/lib/products'


export default function BillingPage() {
  const { billingInfo: { data: billingInfo }, billingPortal: { data: billingPortal } } = useStripe()

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8">Billing & Subscription</h1>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
            </CardHeader>
            <CardContent>
              {billingInfo?.subscription ? (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Plan: {PRODUCTS.find((p) => p.id === billingInfo.subscription?.items.data[0].plan.id)?.name}
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Status: {billingInfo.subscription.status}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Renewal Date:{' '}
                    {billingInfo.subscription?.days_until_due !== undefined
                      ? format(
                        addDays(new Date(), billingInfo.subscription.days_until_due || 0),
                        'PPP'
                      )
                      : 'N/A'}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  You do not have an active subscription.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              {billingInfo?.payment_method ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {billingInfo?.payment_method.card?.brand?.toUpperCase() || "Card"} ending in{" "}
                    {billingInfo?.payment_method.card?.last4}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Expires {billingInfo?.payment_method.card?.exp_month}/{billingInfo?.payment_method.card?.exp_year}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No payment method on file. Payment methods are managed through Stripe.
                </p>
              )}
            </CardContent>
          </Card>
          {billingInfo?.subscription?.status && <Card>
            <CardHeader>
              <CardTitle>Manage Billing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                View and manage your subscription details, including renewal dates and payment history.
              </p>

              <Link href={billingPortal || ""} target="_blank" rel="noopener noreferrer">
                <Button variant="default">Go to Poral</Button>
              </Link>
            </CardContent>
          </Card>}
        </div>
      </div>
    </div>
  )
}
