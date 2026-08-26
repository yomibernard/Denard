"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { slugify } from "@/lib/utils";

type Row = { id: string; name: string; slug: string; active: boolean; [key: string]: unknown };

const field =
  "h-9 rounded border border-line bg-white px-3 text-sm outline-none focus:border-accent";

function CreateForm({
  endpoint,
  fields,
  onDone,
}: {
  endpoint: string;
  fields: { key: string; label: string; type?: string; options?: { id: string; name: string }[] }[];
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {};
    for (const f of fields) {
      const v = String(fd.get(f.key) ?? "").trim();
      if (f.key === "name" && !body.slug) body.slug = slugify(v);
      body[f.key] = v || null;
    }
    if (!body.name) {
      setError("Name required");
      return;
    }
    startTransition(async () => {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Create failed");
        return;
      }
      (e.target as HTMLFormElement).reset();
      onDone();
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2 border-t border-line pt-3">
      {fields.map((f) =>
        f.options ? (
          <div key={f.key}>
            <label className="mb-1 block text-[11px] text-muted">{f.label}</label>
            <select name={f.key} className={field}>
              <option value="">—</option>
              {f.options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div key={f.key}>
            <label className="mb-1 block text-[11px] text-muted">{f.label}</label>
            <input name={f.key} className={field} placeholder={f.label} />
          </div>
        ),
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-9 rounded bg-accent px-3 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "…" : "Add"}
      </button>
      {error ? <p className="w-full text-xs text-danger">{error}</p> : null}
    </form>
  );
}

function EditRow({
  row,
  endpoint,
  fields,
  onDone,
  onCancel,
}: {
  row: Row;
  endpoint: string;
  fields: { key: string; label: string; options?: { id: string; name: string }[] }[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(row.name);
  const [slug, setSlug] = useState(row.slug);
  const [departmentId, setDepartmentId] = useState(String(row.departmentId ?? ""));

  function save() {
    setError(null);
    startTransition(async () => {
      const body: Record<string, unknown> = {
        id: row.id,
        name: name.trim(),
        slug: slug.trim() || slugify(name),
      };
      if (fields.some((f) => f.key === "departmentId")) {
        body.departmentId = departmentId || null;
      }
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Update failed");
        return;
      }
      onDone();
    });
  }

  return (
    <tr className="border-t border-line bg-mint-soft/30">
      <td className="py-2 pr-3" colSpan={5}>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-[11px] text-muted">Name</label>
            <input className={field} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-muted">Slug</label>
            <input className={field} value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
          {fields.some((f) => f.key === "departmentId") ? (
            <div>
              <label className="mb-1 block text-[11px] text-muted">Department</label>
              <select
                className={field}
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
              >
                <option value="">—</option>
                {fields
                  .find((f) => f.key === "departmentId")
                  ?.options?.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
              </select>
            </div>
          ) : null}
          <button
            type="button"
            disabled={pending}
            onClick={save}
            className="h-9 rounded bg-accent px-3 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="h-9 rounded border border-line px-3 text-sm hover:bg-sand"
          >
            Cancel
          </button>
          {error ? <p className="w-full text-xs text-danger">{error}</p> : null}
        </div>
      </td>
    </tr>
  );
}

function CatalogueSection({
  title,
  rows,
  endpoint,
  fields,
  extraCols,
}: {
  title: string;
  rows: Row[];
  endpoint: string;
  fields: { key: string; label: string; type?: string; options?: { id: string; name: string }[] }[];
  extraCols?: (row: Row) => React.ReactNode;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);

  async function toggleActive(row: Row) {
    await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: row.id, active: !row.active }),
    });
    router.refresh();
  }

  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-1 text-xs text-muted">Add new rows below, or edit name/slug in place.</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-muted">
            <tr>
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium">Slug</th>
              <th className="pb-2 font-medium">Active</th>
              {extraCols ? <th className="pb-2 font-medium">Info</th> : null}
              <th className="pb-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) =>
              editingId === row.id ? (
                <EditRow
                  key={row.id}
                  row={row}
                  endpoint={endpoint}
                  fields={fields}
                  onCancel={() => setEditingId(null)}
                  onDone={() => {
                    setEditingId(null);
                    router.refresh();
                  }}
                />
              ) : (
                <tr key={row.id} className="border-t border-line">
                  <td className="py-2 pr-3 font-medium">{row.name}</td>
                  <td className="py-2 pr-3 font-mono text-xs text-muted">{row.slug}</td>
                  <td className="py-2 pr-3 text-xs">{row.active ? "Yes" : "No"}</td>
                  {extraCols ? <td className="py-2 pr-3 text-xs text-muted">{extraCols(row)}</td> : null}
                  <td className="py-2 text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingId(row.id)}
                        className="text-xs font-medium text-accent hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActive(row)}
                        className="text-xs font-medium text-muted hover:underline"
                      >
                        {row.active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ),
            )}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-center text-muted">
                  None yet
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <CreateForm endpoint={endpoint} fields={fields} onDone={() => router.refresh()} />
    </section>
  );
}

export function CatalogueManager({
  departments,
  categories,
  collections,
  brands,
}: {
  departments: Row[];
  categories: (Row & { department?: { name: string } | null; departmentId?: string | null })[];
  collections: Row[];
  brands: Row[];
}) {
  const deptOptions = departments.map((d) => ({ id: d.id, name: d.name }));

  return (
    <div className="space-y-6">
      <CatalogueSection
        title="Departments"
        rows={departments}
        endpoint="/api/admin/catalogue/departments"
        fields={[
          { key: "name", label: "Name" },
          { key: "slug", label: "Slug (optional)" },
        ]}
      />
      <CatalogueSection
        title="Categories"
        rows={categories}
        endpoint="/api/admin/catalogue/categories"
        fields={[
          { key: "name", label: "Name" },
          { key: "slug", label: "Slug (optional)" },
          { key: "departmentId", label: "Department", options: deptOptions },
        ]}
        extraCols={(row) => (row as { department?: { name: string } | null }).department?.name ?? "—"}
      />
      <CatalogueSection
        title="Collections"
        rows={collections}
        endpoint="/api/admin/catalogue/collections"
        fields={[
          { key: "name", label: "Name" },
          { key: "slug", label: "Slug (optional)" },
        ]}
      />
      <CatalogueSection
        title="Brands"
        rows={brands}
        endpoint="/api/admin/catalogue/brands"
        fields={[
          { key: "name", label: "Name" },
          { key: "slug", label: "Slug (optional)" },
        ]}
      />
    </div>
  );
}
