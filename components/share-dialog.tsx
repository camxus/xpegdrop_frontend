"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Check, Share2, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface ShareDialogProps {
  folderName: string
  shareUrl: string
  onClose: () => void
}

export function ShareDialog({ folderName, shareUrl, onClose }: ShareDialogProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast({
        title: "Success",
        description: "Link copied to clipboard",
      })

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      })
    }
  }

  const handleOpenLink = () => {
    window.open(shareUrl, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Share2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Share Folder</h3>
          <p className="text-sm text-muted-foreground">Share "{folderName}" with others</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="share-url">Dropbox Share Link</Label>
          <div className="flex gap-2">
            <Input
              id="share-url"
              value={shareUrl}
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
                copied && "bg-green-50 border-green-200 text-green-700 hover:bg-green-100",
              )}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Anyone with this link can view and download the images</p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button onClick={handleOpenLink} className="flex-1 gap-2">
            <ExternalLink className="h-4 w-4" />
            Open in Dropbox
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
