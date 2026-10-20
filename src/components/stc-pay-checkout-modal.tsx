/**
 * src/components/stc-pay-checkout-modal.tsx
 *
 * Reusable STC Pay checkout modal — renders the payment breakdown,
 * STC Pay account details, and handles receipt upload + Gemini analysis.
 * Designed to work for both main alvey.study and effat.alvey.study tenants.
 */

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DataStore, type Booking } from "@/lib/data-store";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/integrations/firebase/client";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface STCPayCheckoutModalProps {
  booking: Booking;
  tenant: "main" | "effat";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function STCPayCheckoutModal({
  booking,
  tenant,
  open,
  onOpenChange,
  onUploadComplete,
}: STCPayCheckoutModalProps) {
  const [uploading, setUploading] = useState(false);
  const [analyzingReceipt, setAnalyzingReceipt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    classQty,
    classRateSAR,
    discountSAR,
    totalAmountSAR,
    platformFeesSAR,
  } = booking;

  const accountName =
    tenant === "effat" ? "Alvey Education - Effat Portal" : "Alvey Education";

  const handleUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      await DataStore.uploadReceipt(booking.id, file);
      setUploading(false);
      setAnalyzingReceipt(true);
      // Non-fatal Gemini analysis
      try {
        const toBase64 = (f: File): Promise<string> =>
          new Promise((res, rej) => {
            const reader = new FileReader();
            reader.readAsDataURL(f);
            reader.onload = () => res((reader.result as string).split(",")[1]);
            reader.onerror = rej;
          });
        const imageBase64 = await toBase64(file);
        const analyzeReceiptFn = httpsCallable(functions, "analyzeReceipt");
        await analyzeReceiptFn({
          bookingId: booking.id,
          imageBase64,
          mimeType: file.type || "image/jpeg",
        });
      } catch (err) {
        console.warn("Gemini analysis failed (non-fatal):", err);
      }
      setAnalyzingReceipt(false);
      toast.success("Receipt uploaded — awaiting admin verification.");
      onUploadComplete();
      onOpenChange(false);
    } catch {
      toast.error("Failed to upload receipt. Please try again.");
      setUploading(false);
      setAnalyzingReceipt(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Complete Your Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Payment breakdown */}
          {totalAmountSAR !== null ? (
            <div className="rounded-lg border p-4 space-y-2">
              <p className="font-semibold text-sm mb-3">Payment Breakdown</p>
              {classQty !== null && classRateSAR !== null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Classes: {classQty} × SAR {classRateSAR.toFixed(2)}
                  </span>
                  <span>SAR {(classQty * classRateSAR).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Platform Fee</span>
                <span>SAR {(platformFeesSAR || 5).toFixed(2)}</span>
              </div>
              {discountSAR > 0 && (
                <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                  <span>Discount</span>
                  <span>- SAR {discountSAR.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-sm font-bold">
                <span>Total Amount</span>
                <span>SAR {totalAmountSAR.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border text-sm text-blue-800 dark:text-blue-300">
              Payment terms not set yet — please check back shortly.
            </div>
          )}

          {/* STC Pay account details */}
          <div className="rounded-lg border p-4 space-y-3">
            <p className="font-semibold text-sm">STC Pay Account Details</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Bank</span>
              <span className="font-medium">STC Pay</span>
              <span className="text-muted-foreground">Account Name</span>
              <span className="font-medium">{accountName}</span>
              <span className="text-muted-foreground">IBAN</span>
              {/* TODO: replace with real IBAN */}
              <span className="font-mono font-medium text-xs">SA287 8000 0000 0133 8940 382</span>
            </div>
          </div>

          {/* File upload */}
          {totalAmountSAR !== null && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Upload Payment Receipt</p>
              <p className="text-xs text-muted-foreground">
                Accepted formats: JPG, PNG, PDF. Max size: 10 MB.
              </p>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                }}
              />

              {analyzingReceipt ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing receipt with AI…
                </div>
              ) : uploading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading…
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Choose Receipt File
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
