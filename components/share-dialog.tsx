"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Copy, Check, Share2, ExternalLink, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useProjects } from "@/hooks/api/useProjects";
import { Project } from "@/types/project";

interface ShareDialogProps {
  project: Project;
  onClose: () => void;
}

export function ShareDialog({ project, onClose }: ShareDialogProps) {
  const {
    updateProject: { mutateAsync: updateProject },
  } = useProjects();
  const [copied, setCopied] = useState(false);
  const [emails, setEmails] = useState<string[]>(project.approved_emails || []);
  const [newEmail, setNewEmail] = useState("");
  const [isPublic, setIsPublic] = useState<boolean>(project.is_public || true);
  const [canDownload, setCanDownload] = useState<boolean>(
    project.can_download || true
  );
  const { toast } = useToast();

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(project.share_url);
      setCopied(true);
      toast({ title: "Success", description: "Link copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleOpenLink = () => {
    window.open(project.share_url, "_blank", "noopener,noreferrer");
  };

  const handleAddEmail = () => {
    if (!newEmail.trim()) return;
    if (!/\S+@\S+\.\S+/.test(newEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email",
        variant: "destructive",
      });
      return;
    }
    if (emails.includes(newEmail)) {
      toast({
        title: "Already added",
        description: "This email is already approved",
      });
      return;
    }
    setEmails([...emails, newEmail]);
    setNewEmail("");
  };

  const handleRemoveEmail = (email: string) => {
    setEmails(emails.filter((e) => e !== email));
  };

  useEffect(() => {
    const update = async () => {
      try {
        await updateProject({
          projectId: project.project_id,
          data: {
            is_public: isPublic,
            approved_emails: emails,
            can_download: canDownload, // <-- added here
          },
        });
        toast({ title: "Project updated", description: "Settings saved" });
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to update project",
          variant: "destructive",
        });
      }
    };

    if (
      isPublic === project.is_public &&
      emails === project.approved_emails &&
      canDownload === project.can_download
    )
      return;

    update();
  }, [isPublic, emails, canDownload]);
  
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Share2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Share Folder</h3>
          <p className="text-sm text-muted-foreground">
            Share "{project.name}" with others
          </p>
        </div>
      </div>

      {/* Share link */}
      <div className="space-y-2">
        <Label htmlFor="share-url">Dropbox Share Link</Label>
        <div className="flex gap-2">
          <Input
            id="share-url"
            value={project.share_url}
            readOnly
            className="font-mono text-sm"
            onClick={(e) => e.currentTarget.select()}
          />
          <Button
            size="icon"
            variant="outline"
            onClick={handleCopyToClipboard}
            className={cn(
              "shrink-0 transition-colors",
              copied &&
                "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            )}
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Approved emails */}
      <AnimatePresence initial={false}>
        {!isPublic && (
          <motion.div
            key="emails"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{
              opacity: { duration: 0.1 },
              height: { duration: 0.3 },
            }}
            className="space-y-2 overflow-hidden"
          >
            <Label>Approved Emails</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add email..."
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddEmail()}
              />
              <Button type="button" size="icon" onClick={handleAddEmail}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {emails.length > 0 && (
              <ul className="space-y-1">
                {emails.map((email) => (
                  <li
                    key={email}
                    className="flex items-center justify-between rounded-md border p-2 text-sm"
                  >
                    {email}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveEmail(email)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Public toggle */}
      <div className="flex items-center justify-between border rounded-lg p-3">
        <div>
          <Label htmlFor="is-public" className="text-sm font-medium">
            Public Access
          </Label>
          <p className="text-xs text-muted-foreground">
            Anyone with the link can view and download
          </p>
        </div>
        <Switch
          id="is-public"
          checked={isPublic}
          onCheckedChange={setIsPublic}
        />
      </div>

      <div className="flex items-center justify-between border rounded-lg p-3 mt-2">
        <div>
          <Label htmlFor="can-download" className="text-sm font-medium">
            Allow Download
          </Label>
          <p className="text-xs text-muted-foreground">
            Users with access can download folder with full resolution files
          </p>
        </div>
        <Switch
          id="can-download"
          checked={canDownload}
          onCheckedChange={setCanDownload}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button onClick={handleOpenLink} className="flex-1 gap-2">
          <ExternalLink className="h-4 w-4" />
          Open in Dropbox
        </Button>
        <Button
          variant="outline"
          onClick={onClose}
          className="flex-1 bg-transparent"
        >
          Close
        </Button>
      </div>
    </div>
  );
}
