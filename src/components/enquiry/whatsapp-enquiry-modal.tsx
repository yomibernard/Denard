"use client";

import { useEffect, useId, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import type { IntendedActionType } from "@/lib/whatsapp";
import {
  cancelWhatsAppLaunch,
  prepareWhatsAppLaunch,
  type WhatsAppLaunchHandle,
} from "@/lib/whatsapp-launch";

export type EnquiryCustomerFormValues = {
  customerName: string;
  customerPhone: string;
  deliveryCity?: string;
  deliveryCountry?: string;
  note?: string;
  intendedAction: IntendedActionType;
};

export type WhatsAppEnquiryReady = {
  reference: string;
  whatsappUrl: string;
  confirmation: string;
};

export type WhatsAppEnquiryModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** When true, collect delivery city and country (multi-product bag). */
  requireLocation?: boolean;
  defaultAction?: IntendedActionType;
  submitting?: boolean;
  error?: string | null;
  /** Shown when enquiry saved but WhatsApp needs a manual tap (popup blocked). */
  ready?: WhatsAppEnquiryReady | null;
  onSubmit: (
    values: EnquiryCustomerFormValues,
    launch: WhatsAppLaunchHandle,
  ) => void | Promise<void>;
};

export function WhatsAppEnquiryModal({
  open,
  onClose,
  title,
  description,
  requireLocation = false,
  defaultAction = "ENQUIRY",
  submitting = false,
  error,
  ready = null,
  onSubmit,
}: WhatsAppEnquiryModalProps) {
  const titleId = useId();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("United Kingdom");
  const [note, setNote] = useState("");
  const [action, setAction] = useState<IntendedActionType>(defaultAction);

  useEffect(() => {
    if (open) setAction(defaultAction);
  }, [open, defaultAction]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !submitting) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, submitting, onClose]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Must open the tab in this click turn (before any await) or browsers block it.
    const launch = prepareWhatsAppLaunch();
    try {
      await onSubmit(
        {
          customerName: name.trim(),
          customerPhone: phone.trim(),
          deliveryCity: city.trim() || undefined,
          deliveryCountry: country.trim() || undefined,
          note: note.trim() || undefined,
          intendedAction: action,
        },
        launch,
      );
    } catch {
      cancelWhatsAppLaunch(launch);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[95] flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close"
        disabled={submitting}
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[92vh] w-full max-w-md overflow-y-auto border border-line bg-surface p-5 shadow-lg sm:rounded-[var(--denard-radius)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="font-display text-2xl text-ink">
              {ready ? "Enquiry prepared" : title}
            </h2>
            {ready ? (
              <p className="mt-1 text-sm text-ink-soft">{ready.confirmation}</p>
            ) : description ? (
              <p className="mt-1 text-sm text-ink-soft">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center text-ink-soft hover:bg-sand"
            aria-label="Close"
            disabled={submitting}
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {ready ? (
          <div className="mt-5 space-y-4">
            <p className="rounded-[var(--denard-radius)] border border-mint/40 bg-mint/10 px-3 py-2 text-sm text-ink">
              Reference <strong>{ready.reference}</strong> is ready. Tap below to open WhatsApp with
              your product message already filled in — then press Send in WhatsApp.
            </p>
            <a
              href={ready.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 w-full items-center justify-center bg-whatsapp px-4 text-sm font-semibold uppercase tracking-wide text-white hover:bg-whatsapp-hover"
            >
              Open WhatsApp
            </a>
            <button
              type="button"
              className="w-full text-sm text-accent hover:underline"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <Label htmlFor="wa-name">Full name</Label>
              <Input
                id="wa-name"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                disabled={submitting}
              />
            </div>
            <div>
              <Label htmlFor="wa-phone">Telephone number</Label>
              <Input
                id="wa-phone"
                required
                type="tel"
                minLength={7}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                placeholder="+44…"
                disabled={submitting}
              />
            </div>
            {requireLocation ? (
              <>
                <div>
                  <Label htmlFor="wa-city">Delivery city</Label>
                  <Input
                    id="wa-city"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    autoComplete="address-level2"
                    disabled={submitting}
                  />
                </div>
                <div>
                  <Label htmlFor="wa-country">Delivery country</Label>
                  <Input
                    id="wa-country"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    autoComplete="country-name"
                    disabled={submitting}
                  />
                </div>
              </>
            ) : null}
            <div>
              <Label htmlFor="wa-action">Preferred action</Label>
              <Select
                id="wa-action"
                value={action}
                onChange={(e) => setAction(e.target.value as IntendedActionType)}
                disabled={submitting}
              >
                <option value="ENQUIRY">Make an enquiry</option>
                <option value="PAYMENT">Complete payment</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="wa-note">Message (optional)</Label>
              <Textarea
                id="wa-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Sizing, timing, gift wrap…"
                disabled={submitting}
              />
            </div>

            {error ? <p className="text-sm text-danger">{error}</p> : null}

            <Button type="submit" variant="whatsapp" className="w-full min-h-12" disabled={submitting}>
              {submitting ? "Preparing…" : "Continue to WhatsApp"}
            </Button>
            <p className="text-xs text-muted">
              We never ask for card or bank details on this site. Payment is confirmed with Denard on
              WhatsApp.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
