'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function PricingCard({
  name,
  desc,
  features,
  monthly,
  annual,
  trialDays,
  buttonText,
  link,
  primary,
  delay,
  showAnnualBilling,
  setShowAnnualBilling,
  onClick,
}: {
  name: string;
  desc: string;
  features: string[];
  monthly: number;
  annual: number;
  trialDays: number | undefined,
  buttonText: string;
  link?: string;
  primary?: boolean;
  delay?: number;
  showAnnualBilling: boolean;
  setShowAnnualBilling: React.Dispatch<React.SetStateAction<boolean>>;
  onClick?: (event?: React.MouseEvent<HTMLButtonElement>, opts?: { trial?: boolean }) => void;
}) {
  return (
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      whileHover={{
        filter: "drop-shadow(0 0 20px rgba(255, 255, 255, 0.4))",
      }}
      transition={{
        duration: 0.8,
        delay,
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
      viewport={{ once: true }}
    >
      <Card
        className={`relative transition-all duration-300 h-full ${primary
          ? "bg-primary border-0"
          : "bg-muted-background border border-border"
          }`}
      >
        {/* Toggle */}
        {annual > 0 && monthly > 0 && (
          <div className="absolute top-4 right-4 flex overflow-hidden text-xs font-medium">
            <div className={`px-3 py-1 rounded-full border text-xs font-medium 
              ${primary
                ? "text-black border-background/50"
                : "border-foreground/50"
              }`}>Limited Offer</div>
          </div>
        )}

        <CardContent className="p-8 h-full flex flex-col justify-between">
          <div>
            <h3 className={`text-2xl font-semibold mb-3  ${primary ? "text-background" : "text-foreground"}`}>{name}</h3>
            <p
              className={`mb-6 ${primary ? "text-muted-foreground" : "text-muted-foreground"
                }`}
            >
              {desc}
            </p>
            <ul
              className={`space-y-3 text-sm ${primary ? "text-muted-foreground" : "text-muted-foreground"
                }`}
            >
              {features.map((f, idx) => (
                <li key={idx}>• {f}</li>
              ))}
            </ul>
          </div>

          <div className="mt-8">
            <div className="mb-4 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p
                  key={showAnnualBilling ? "annual" : "monthly"}
                  initial={{
                    opacity: 0,
                    y: showAnnualBilling ? 100 : -100,
                  }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{
                    opacity: 0,
                    y: showAnnualBilling ? 100 : -100,
                  }}
                  transition={{
                    opacity: { duration: 0.3, delay: 0 },
                    y: { duration: 0.3, delay: 0 },
                  }}
                  className={`text-3xl font-bold ${primary ? "text-background" : "text-foreground"}`}
                >
                  {showAnnualBilling ? (
                    <>
                      {annual > 0 ? (
                        <>
                          €{annual}
                          <span className="text-base font-normal">/year</span>
                        </>
                      ) : (
                        "Invite Only"
                      )}
                    </>
                  ) : (
                    <>
                      {monthly > 0 ? (
                        <>
                          €{monthly}
                          <span className="text-base font-normal">/month</span>
                        </>
                      ) : (
                        "Invite Only"
                      )}
                    </>
                  )}
                </motion.p>
              </AnimatePresence>
            </div>
            {(() => {
              const button = (
                <Button
                  className={`w-full cursor-pointer ${primary
                    ? "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  onClick={link ? undefined : onClick}
                >
                  {buttonText}
                </Button>
              )

              // trial button
              const trialButton = trialDays ? (
                <Button
                  variant="outline"
                  className="w-full mb-2" // spacing above main button
                  onClick={(e) => onClick && onClick(e, { trial: true })}
                >
                  Try {trialDays} days for free
                </Button>
              ) : null

              return (
                <>
                  {trialButton}
                  {link ? <Link href={link}>{button}</Link> : button}
                </>
              )
            })()}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
