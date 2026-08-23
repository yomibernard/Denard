"use client";

import { format } from "date-fns";
import { useEffect, useState } from "react";

type Log = {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
  details: string | null;
  user: { name: string } | null;
};

export function EnquiryAuditTrail({ enquiryId }: { enquiryId: string }) {
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    void fetch(`/api/admin/audit?entityType=Enquiry&entityId=${enquiryId}`)
      .then((r) => r.json())
      .then((d) => setLogs(d.logs ?? []))
      .catch(() => setLogs([]));
  }, [enquiryId]);

  if (!logs.length) return null;

  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold">Audit trail</h2>
      <ul className="mt-3 space-y-2 text-xs text-muted">
        {logs.map((l) => (
          <li key={l.id} className="border-b border-line pb-2 last:border-0">
            <span className="font-medium text-ink">{l.action}</span>{" "}
            {l.user?.name ? `by ${l.user.name}` : "system"} ·{" "}
            {format(new Date(l.createdAt), "dd MMM HH:mm")}
          </li>
        ))}
      </ul>
    </section>
  );
}

export const EnquiryAuditLog = EnquiryAuditTrail;
