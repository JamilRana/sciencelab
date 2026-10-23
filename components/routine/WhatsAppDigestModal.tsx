"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  CheckCircle2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Phone,
  Calendar,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getTeacherDigestWhatsAppUrlAction,
  logWhatsAppSentAction,
  isWhatsAppCloudConfiguredAction,
  sendWhatsAppCloudDigestAction,
} from "@/app/actions/notifications";
import { formatDhakaDate } from "@/lib/dhaka-time";

interface WhatsAppDigestModalProps {
  isOpen: boolean;
  onClose: () => void;
  tomorrowDate: string;
  teachersWithSessions: Array<{
    id: number;
    name: string;
    mobile?: string | null;
    whatsappNumber?: string | null;
    sessionCount: number;
  }>;
  onSuccess?: () => void;
}

export function WhatsAppDigestModal({
  isOpen,
  onClose,
  tomorrowDate,
  teachersWithSessions,
  onSuccess,
}: WhatsAppDigestModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sentTeacherIds, setSentTeacherIds] = useState<Set<number>>(new Set());
  const [previewText, setPreviewText] = useState<string>("");
  const [targetPhone, setTargetPhone] = useState<string>("");
  const [waUrl, setWaUrl] = useState<string>("");
  const [hasCopied, setHasCopied] = useState(false);
  const [isCloudConfigured, setIsCloudConfigured] = useState(false);
  const [isSendingCloud, setIsSendingCloud] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      isWhatsAppCloudConfiguredAction().then((res) => {
        setIsCloudConfigured(!!res.configured);
      });
    }
  }, [isOpen]);

  const currentTeacher = teachersWithSessions[currentIndex];

  // Load preview when currentTeacher changes
  React.useEffect(() => {
    if (!currentTeacher || !isOpen) return;

    let isMounted = true;
    setLoading(true);

    getTeacherDigestWhatsAppUrlAction(currentTeacher.id, tomorrowDate)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.url && res.text) {
          setWaUrl(res.url);
          setPreviewText(res.text);
          setTargetPhone(res.targetPhone || "");
        } else {
          setWaUrl("");
          setPreviewText(res.error || "Unable to generate digest");
          setTargetPhone("");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentTeacher, tomorrowDate, isOpen]);

  if (!currentTeacher) {
    return null;
  }

  const handleOpenWhatsApp = async () => {
    if (!waUrl) {
      toast.error("No valid WhatsApp URL generated");
      return;
    }

    // Open link in new tab
    window.open(waUrl, "_blank", "noopener,noreferrer");

    // Record delivery log
    try {
      await logWhatsAppSentAction(currentTeacher.id, tomorrowDate);
      setSentTeacherIds((prev) => new Set([...prev, currentTeacher.id]));
      toast.success(`Logged WhatsApp digest sent to ${currentTeacher.name}`);
      if (onSuccess) onSuccess();
    } catch {
      toast.error("Failed to log WhatsApp delivery record");
    }
  };

  const handleSendCloud = async () => {
    if (!currentTeacher) return;

    setIsSendingCloud(true);
    try {
      const res = await sendWhatsAppCloudDigestAction(currentTeacher.id, tomorrowDate);
      if (res.success) {
        setSentTeacherIds((prev) => new Set([...prev, currentTeacher.id]));
        toast.success(`Sent via WhatsApp Cloud API to ${currentTeacher.name}`);
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.error || "Failed to send via WhatsApp Cloud API");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send via WhatsApp Cloud API");
    } finally {
      setIsSendingCloud(false);
    }
  };

  const handleCopyMessage = () => {
    if (!previewText) return;
    navigator.clipboard.writeText(previewText);
    setHasCopied(true);
    toast.success("Message copied to clipboard");
    setTimeout(() => setHasCopied(false), 2000);
  };

  const isSent = sentTeacherIds.has(currentTeacher.id);
  const total = teachersWithSessions.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-zinc-900">
              <MessageSquare className="h-5 w-5 text-emerald-600" />
              WhatsApp Routine Dispatch
            </DialogTitle>
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
              {currentIndex + 1} of {total} Faculty
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Progress Bar */}
          <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
            />
          </div>

          {/* Teacher Summary Card */}
          <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-zinc-900">{currentTeacher.name}</h4>
                {isSent ? (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Sent
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-zinc-500">
                    Pending
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-600 mt-1">
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="h-3 w-3 text-zinc-400" />
                  {targetPhone || currentTeacher.whatsappNumber || currentTeacher.mobile || "No number"}
                </span>
                <span>•</span>
                <span>{currentTeacher.sessionCount} session(s) tomorrow</span>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyMessage}
              className="text-xs h-8 gap-1 text-zinc-700"
            >
              {hasCopied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
              {hasCopied ? "Copied" : "Copy"}
            </Button>
          </div>

          {/* Pre-filled Message Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>Pre-filled Message Preview ({formatDhakaDate(tomorrowDate, "digest")}):</span>
              <span className="text-[11px] text-zinc-400">Section 9 Spec Format</span>
            </div>
            <pre className="p-3.5 rounded-lg border border-zinc-200 bg-white font-mono text-xs text-zinc-800 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
              {loading ? "Generating digest preview..." : previewText}
            </pre>
          </div>

          {/* Click to send instruction */}
          <p className="text-[11px] text-zinc-500 italic">
            Clicking &quot;Send via WhatsApp&quot; opens WhatsApp Web or your desktop app with the pre-filled text and records the delivery in the Notification Log.
          </p>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between w-full border-t border-zinc-100 pt-3">
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="text-xs h-8 gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentIndex((prev) => Math.min(total - 1, prev + 1))}
              disabled={currentIndex === total - 1}
              className="text-xs h-8 gap-1"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs h-8">
              Close
            </Button>
            {isCloudConfigured && (
              <Button
                size="sm"
                onClick={handleSendCloud}
                disabled={isSendingCloud || loading}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-8 gap-1.5 shadow-xs"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                {isSendingCloud ? "Sending..." : "Send Cloud API"}
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleOpenWhatsApp}
              disabled={!waUrl || loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 gap-1.5 shadow-xs"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Send via WhatsApp
              <ExternalLink className="h-3 w-3 ml-0.5 opacity-70" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
