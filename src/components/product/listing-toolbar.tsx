"use client";

import { useCallback, useMemo, useState, useTransition, type HTMLAttributes } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filter, X } from "lucide-react";
import { Button, buttonClassName } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { formatPrice, cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Popular" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "name", label: "Name A–Z" },
  { value: "discount", label: "Biggest discount" },
] as const;

const AVAILABILITY_OPTIONS = [
  { value: "", label: "Any availability" },
  { value: "IN_STOCK", label: "In stock" },
  { value: "LOW_STOCK", label: "Low stock" },
  { value: "PREORDER", label: "Pre-order" },
  { value: "MADE_TO_ORDER", label: "Made to order" },
] as const;

const FILTER_KEYS = [
  "colour",
  "size",
  "brand",
  "minPrice",
  "maxPrice",
  "availability",
  "isNew",
  "isBestSeller",
  "isOnOffer",
] as const;

export type FacetOption = { slug: string; name: string };

export type ListingToolbarProps = {
  className?: string;
  lockedFlags?: Array<"isNew" | "isBestSeller" | "isOnOffer">;
  colours?: FacetOption[];
  sizes?: FacetOption[];
  brands?: FacetOption[];
};

function chipLabel(
  key: string,
  value: string,
  facets: { colours: FacetOption[]; sizes: FacetOption[]; brands: FacetOption[] },
) {
  switch (key) {
    case "colour":
      return `Colour: ${facets.colours.find((c) => c.slug === value)?.name ?? value}`;
    case "size":
      return `Size: ${facets.sizes.find((s) => s.slug === value)?.name ?? value}`;
    case "brand":
      return `Brand: ${facets.brands.find((b) => b.slug === value)?.name ?? value}`;
    case "minPrice":
      return `Min ${formatPrice(Number(value) || 0)}`;
    case "maxPrice":
      return `Max ${formatPrice(Number(value) || 0)}`;
    case "availability":
      return value.replaceAll("_", " ").toLowerCase();
    case "isNew":
      return "New arrivals";
    case "isBestSeller":
      return "Best sellers";
    case "isOnOffer":
      return "On offer";
    default:
      return `${key}: ${value}`;
  }
}

export function ListingToolbar({
  className,
  lockedFlags = [],
  colours = [],
  sizes = [],
  brands = [],
}: ListingToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sort = searchParams.get("sort") || "recommended";
  const facets = useMemo(() => ({ colours, sizes, brands }), [colours, sizes, brands]);

  const activeChips = useMemo(() => {
    const chips: Array<{ key: string; value: string; label: string }> = [];
    for (const key of FILTER_KEYS) {
      if (lockedFlags.includes(key as (typeof lockedFlags)[number])) continue;
      const value = searchParams.get(key);
      if (!value) continue;
      chips.push({ key, value, label: chipLabel(key, value, facets) });
    }
    return chips;
  }, [searchParams, lockedFlags, facets]);

  const replaceParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      params.delete("page");
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  const setParam = (key: string, value: string) => {
    replaceParams((params) => {
      if (!value) params.delete(key);
      else params.set(key, value);
    });
  };

  const clearAll = () => {
    replaceParams((params) => {
      for (const key of FILTER_KEYS) {
        if (lockedFlags.includes(key as (typeof lockedFlags)[number])) continue;
        params.delete(key);
      }
    });
    setDrawerOpen(false);
  };

  const removeChip = (key: string) => {
    replaceParams((params) => {
      params.delete(key);
    });
  };

  const applyDraft = (form: HTMLFormElement) => {
    const fd = new FormData(form);
    replaceParams((params) => {
      const textKeys = ["colour", "size", "brand", "minPrice", "maxPrice", "availability"] as const;
      for (const key of textKeys) {
        const v = String(fd.get(key) ?? "").trim();
        if (v) params.set(key, v);
        else params.delete(key);
      }
      for (const flag of ["isNew", "isBestSeller", "isOnOffer"] as const) {
        if (lockedFlags.includes(flag)) continue;
        if (fd.get(flag) === "on") params.set(flag, "1");
        else params.delete(flag);
      }
    });
    trackEvent({ eventName: "filter_use", path: pathname });
    setDrawerOpen(false);
  };

  return (
    <div className={cn("space-y-3", pending && "opacity-80", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="md:hidden"
          onClick={() => setDrawerOpen(true)}
          aria-expanded={drawerOpen}
        >
          <Filter className="h-3.5 w-3.5" strokeWidth={1.75} />
          Filters
          {activeChips.length ? (
            <span className="ml-1 rounded-full bg-accent px-1.5 text-[10px] text-white">
              {activeChips.length}
            </span>
          ) : null}
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <Label htmlFor="plp-sort" className="mb-0 hidden sm:block">
            Sort
          </Label>
          <Select
            id="plp-sort"
            value={sort}
            onChange={(e) => setParam("sort", e.target.value === "recommended" ? "" : e.target.value)}
            aria-label="Sort products"
            className="w-[11.5rem] sm:w-[14rem]"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {activeChips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => removeChip(chip.key)}
              aria-label={`Remove filter ${chip.label}`}
              className="inline-flex items-center gap-1.5 rounded-[var(--denard-radius)] border border-line bg-surface px-2.5 py-1 text-xs text-ink-soft hover:border-accent hover:text-accent"
            >
              {chip.label}
              <X className="h-3 w-3" strokeWidth={2} />
            </button>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-medium text-accent hover:underline"
          >
            Clear all
          </button>
        </div>
      ) : null}

      <form
        className="hidden md:grid md:grid-cols-4 lg:grid-cols-6 gap-3 rounded-[var(--denard-radius)] border border-line bg-surface p-4"
        onSubmit={(e) => {
          e.preventDefault();
          applyDraft(e.currentTarget);
        }}
      >
        <FilterFields
          searchParams={searchParams}
          lockedFlags={lockedFlags}
          colours={colours}
          sizes={sizes}
          brands={brands}
        />
        <div className="flex items-end gap-2 md:col-span-2 lg:col-span-6">
          <button type="submit" className={buttonClassName({ size: "sm" })}>
            Apply filters
          </button>
          {activeChips.length ? (
            <button
              type="button"
              onClick={clearAll}
              className={buttonClassName({ variant: "ghost", size: "sm" })}
            >
              Clear
            </button>
          ) : null}
        </div>
      </form>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal aria-label="Filters">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            aria-label="Close filters"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-lg bg-surface p-5 shadow-xl animate-fade-up">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl text-ink">Filters</h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex h-9 w-9 items-center justify-center text-ink-soft"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                applyDraft(e.currentTarget);
              }}
            >
              <FilterFields
                searchParams={searchParams}
                lockedFlags={lockedFlags}
                colours={colours}
                sizes={sizes}
                brands={brands}
                stacked
              />
              <div className="flex gap-2 pt-2">
                <button type="submit" className={buttonClassName({ className: "flex-1" })}>
                  Apply
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className={buttonClassName({ variant: "outline", className: "flex-1" })}
                >
                  Clear all
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FilterFields({
  searchParams,
  lockedFlags,
  colours,
  sizes,
  brands,
  stacked,
}: {
  searchParams: ReturnType<typeof useSearchParams>;
  lockedFlags: ListingToolbarProps["lockedFlags"];
  colours: FacetOption[];
  sizes: FacetOption[];
  brands: FacetOption[];
  stacked?: boolean;
}) {
  const wrap = stacked ? "space-y-3" : "contents";
  return (
    <div className={wrap}>
      <FacetSelect
        label="Colour"
        name="colour"
        options={colours}
        defaultValue={searchParams.get("colour") ?? ""}
        emptyLabel="Any colour"
      />
      <FacetSelect
        label="Size"
        name="size"
        options={sizes}
        defaultValue={searchParams.get("size") ?? ""}
        emptyLabel="Any size"
      />
      <FacetSelect
        label="Brand"
        name="brand"
        options={brands}
        defaultValue={searchParams.get("brand") ?? ""}
        emptyLabel="Any brand"
      />
      <Field
        label="Min price (£)"
        name="minPrice"
        type="number"
        inputMode="numeric"
        defaultValue={searchParams.get("minPrice") ?? ""}
      />
      <Field
        label="Max price (£)"
        name="maxPrice"
        type="number"
        inputMode="numeric"
        defaultValue={searchParams.get("maxPrice") ?? ""}
      />
      <div>
        <Label htmlFor="availability">Availability</Label>
        <Select
          id="availability"
          name="availability"
          defaultValue={searchParams.get("availability") ?? ""}
        >
          {AVAILABILITY_OPTIONS.map((o) => (
            <option key={o.value || "any"} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
      <div className={cn("flex flex-wrap gap-4 pt-2", stacked ? "" : "md:col-span-2 lg:col-span-3")}>
        {(["isNew", "isBestSeller", "isOnOffer"] as const).map((flag) => {
          if (lockedFlags?.includes(flag)) return null;
          const labels = {
            isNew: "New",
            isBestSeller: "Best seller",
            isOnOffer: "On offer",
          };
          return (
            <label key={flag} className="inline-flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                name={flag}
                defaultChecked={searchParams.get(flag) === "1" || searchParams.get(flag) === "true"}
                className="h-4 w-4 accent-[var(--denard-accent)]"
              />
              {labels[flag]}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function FacetSelect({
  label,
  name,
  options,
  defaultValue,
  emptyLabel,
}: {
  label: string;
  name: string;
  options: FacetOption[];
  defaultValue: string;
  emptyLabel: string;
}) {
  if (!options.length) {
    return <Field label={label} name={name} defaultValue={defaultValue} />;
  }
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Select id={name} name={name} defaultValue={defaultValue}>
        <option value="">{emptyLabel}</option>
        {options.map((o) => (
          <option key={o.slug} value={o.slug}>
            {o.name}
          </option>
        ))}
      </Select>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  inputMode,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} inputMode={inputMode} />
    </div>
  );
}
