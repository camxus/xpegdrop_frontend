"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useReferrals } from "@/hooks/api/useReferrals";
import { useAuth } from "@/hooks/api/useAuth";

export function MakeReferralComponent() {
  const { user } = useAuth()
  const { toast } = useToast();
  const {
    referrals = [],
    createReferral: { mutateAsync: createReferral, isPending: creatingReferral }
  } = useReferrals();

  const handleCopyLink = (code: string) => {
    const link = `https://app.fframess.com/signup?code=${code}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Copied to clipboard",
      description: `Referral link copied`,
    });
  };

  return (
    <div className="space-y-4">
      {/* List existing referrals */}
      <div className="space-y-2">
        {referrals.sort(
          (a, b) =>
            new Date(b.created_at!).getTime() -
            new Date(a.created_at!).getTime()
        ).map((ref) => (
          <div
            key={ref.code}
            className="flex justify-between items-center border p-2 rounded"
          >
            <div>
              <span className="font-medium">{ref.code}</span>
              <span className="ml-2 text-sm text-muted-foreground">
                {ref.redeemed ? "Redeemed" : "Available"}
              </span>
            </div>
            <Button size="sm" variant="outline" onClick={() => handleCopyLink(ref.code)}>
              Copy Link
            </Button>
          </div>
        ))}
      </div>

      {/* Create new referral */}
      <div className="w-full flex flex-col space-y-2 items-center">
        <Button
          className="w-fit"
          onClick={() => createReferral()}
          disabled={(referrals.length >= 5 && user?.email !== "camillus.konkwo@gmail.com") || creatingReferral}
        >
          {creatingReferral ? "Creating..." : "Create Referral"}
        </Button>
        <p className="text-sm text-muted-foreground mt-1">
          You have {5 - referrals.length} {5 - referrals.length === 1 ? "referral" : "referrals"} left
        </p>
      </div>
    </div>
  );
}
