"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MultiCharInput } from "@/components/ui/multi-char-input";
import { useReferrals } from "@/hooks/api/useReferrals";
import { REFERRAL_LENGTH } from "@/lib/api/referralsApi";
import { useDialog } from "@/hooks/use-dialog";
import { useUser } from "@/hooks/api/useUser";
import { useSearchParams } from "next/navigation";

export function RedeemReferralDialog() {
  const searchParams = useSearchParams();

  const { currentUser: { refetch: refetchCurrentUser } } = useUser()
  const { hide } = useDialog()

  const [referralCode, setReferralCode] = useState<string>(
    searchParams.get("code") || ''
  );

  const {
    redeemReferral: { mutateAsync: redeemReferral, isPending },
  } = useReferrals();

  const handleSubmit = async () => {
    const result = await redeemReferral(referralCode);

    if (result) {
      refetchCurrentUser()
      hide();
    }
  };

  return (
    <div className="flex items-center justify-center">
      <p className="text-white/70 text-center text-sm mb-6">
        Redeem your invitation
      </p>

      <div className="flex justify-center mb-4">
        <MultiCharInput
          value={referralCode}
          onChange={(v) => setReferralCode(v.toUpperCase())}
          length={REFERRAL_LENGTH}
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={
          referralCode.length !== REFERRAL_LENGTH || isPending
        }
        className="w-full"
      >
        {isPending ? "Checking..." : "Redeem"}
      </Button>
    </div>
  );
}
