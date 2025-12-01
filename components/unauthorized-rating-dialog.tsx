import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useDialog } from "@/hooks/use-dialog";

interface UnauthorizedRatingDialogProps {
  firstName?: string,
  lastName?: string
  open: boolean;
  onClose: () => void;
  onSubmit: (firstName: string, lastName: string) => void;
}

export default function UnauthorizedRatingDialog(props: UnauthorizedRatingDialogProps) {
  const { updateProps } = useDialog()
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  useEffect(() => {
    updateProps({
      firstName,
      lastName,
      note: `${firstName} ${lastName}`.trim(),
    });
  }, [firstName, lastName]);

  return (
    <>
      <div className="space-y-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="first-name">First Name</Label>
          <Input
            id="first-name"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="last-name">Last Name</Label>
          <Input
            id="last-name"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
      </div>
    </>
  );
}

export function UnauthorizedRatingDialogActions({ firstName, lastName, onClose, onSubmit }: UnauthorizedRatingDialogProps) {
  return (
    <div className="flex justify-end pt-2 gap-3">
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button
        disabled={!firstName?.trim() || !lastName?.trim()}
        onClick={() => onSubmit(firstName!, lastName!)}
      >
        Submit
      </Button>
    </div>
  )
}
