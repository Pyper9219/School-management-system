import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { initials } from "@/src/lib/format";

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-3 pb-1", className)}>
      <div className="min-w-0">
        <h1 className="font-display text-2xl leading-tight font-semibold tracking-tight">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <Card className={cn("border-border/80 shadow-none", className)}>
      {title || action ? (
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 py-3">
          <div className="min-w-0">
            {title ? <CardTitle className="text-base font-semibold">{title}</CardTitle> : null}
            {description ? <CardDescription className="mt-0.5 text-xs">{description}</CardDescription> : null}
          </div>
          {action}
        </CardHeader>
      ) : null}
      <CardContent className={cn("pt-0 pb-4", bodyClassName)}>{children}</CardContent>
    </Card>
  );
}

const TONES = {
  neutral: "bg-muted text-muted-foreground border-transparent",
  good: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900",
  warn: "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900",
  bad: "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900",
  info: "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-900",
  brand: "bg-primary/10 text-primary border-primary/20",
} as const;

export type Tone = keyof typeof TONES;

export function Pill({ tone = "neutral", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <Badge variant="outline" className={cn("nums text-[11px] font-medium", TONES[tone], className)}>
      {children}
    </Badge>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
  trend,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: Tone;
  trend?: { direction: "up" | "down" | "flat"; text: string };
}) {
  const accent =
    tone === "good" ? "before:bg-emerald-500" : tone === "bad" ? "before:bg-rose-500" : tone === "warn" ? "before:bg-amber-500" : tone === "info" ? "before:bg-sky-500" : "before:bg-primary/40";
  return (
    <div className={cn("relative overflow-hidden rounded-lg border border-border/80 bg-card p-4 before:absolute before:inset-y-0 before:left-0 before:w-1 before:content-['']", accent)}>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="nums font-display mt-1.5 text-2xl leading-none font-semibold">{value}</p>
      {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
      {trend ? (
        <p className={cn("mt-1.5 inline-flex items-center gap-1 text-xs font-medium", trend.direction === "up" ? "text-emerald-700 dark:text-emerald-400" : trend.direction === "down" ? "text-rose-700 dark:text-rose-400" : "text-muted-foreground")}>
          {trend.direction === "up" ? <ChevronUp className="size-3.5" /> : trend.direction === "down" ? <ChevronDown className="size-3.5" /> : null}
          {trend.text}
        </p>
      ) : null}
    </div>
  );
}

export function AvatarCircle({ name, color, size = 36 }: { name: string; color?: string; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: color ?? "#1d3f63", fontSize: size * 0.36 }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder = "Search",
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="pl-8"
        aria-label={placeholder}
      />
    </div>
  );
}

const ALL = "all";

export function FilterSelect({
  label,
  value,
  onChange,
  options,
  width = "min-w-40",
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: Array<{ value: string; label: string }>;
  width?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" className={width} aria-label={`Filter by ${label}`}>
        <SelectValue placeholder={`All ${label.toLowerCase()}`} />
      </SelectTrigger>
      <SelectContent position="popper" className="max-h-72">
        <SelectItem value={ALL}>All {label.toLowerCase()}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  align?: "left" | "right" | "center";
  className?: string;
  headClassName?: string;
  hideOnMobile?: boolean;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  pageSize = 12,
  initialSort,
  emptyTitle = "Nothing here yet",
  emptyDescription,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  initialSort?: { key: string; dir: "asc" | "desc" };
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const [sort, setSort] = useState(initialSort ?? null);
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((c) => c.key === sort.key);
    if (!column?.sortValue) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = column.sortValue!(a);
      const bv = column.sortValue!(b);
      if (av === bv) return 0;
      const result = av > bv ? 1 : -1;
      return sort.dir === "asc" ? result : -result;
    });
    return copy;
  }, [rows, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);

  if (!rows.length) {
    return (
      <Empty className="py-10">
        <EmptyHeader>
          <EmptyTitle>{emptyTitle}</EmptyTitle>
          {emptyDescription ? <EmptyDescription>{emptyDescription}</EmptyDescription> : null}
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg border border-border/80 bg-card">
        <Table>
          <TableHeader className="bg-secondary/50">
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn("text-xs font-semibold tracking-wide uppercase", column.align === "right" && "text-right", column.align === "center" && "text-center", column.headClassName, column.hideOnMobile && "hidden md:table-cell")}
                >
                  {column.sortValue ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-foreground"
                      onClick={() =>
                        setSort((current) =>
                          current?.key === column.key ? { key: column.key, dir: current.dir === "asc" ? "desc" : "asc" } : { key: column.key, dir: "asc" },
                        )
                      }
                    >
                      {column.header}
                      {sort?.key === column.key ? (sort.dir === "asc" ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />) : null}
                    </button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((row) => (
              <TableRow
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(onRowClick && "cursor-pointer")}
              >
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={cn(column.align === "right" && "text-right", column.align === "center" && "text-center", column.className, column.hideOnMobile && "hidden md:table-cell")}
                  >
                    {column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {pageCount > 1 ? (
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="nums">
            {safePage * pageSize + 1}–{Math.min(sorted.length, (safePage + 1) * pageSize)} of {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
              Previous
            </Button>
            <Button size="sm" variant="outline" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}>
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function FormRow({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-xs font-semibold tracking-wide text-foreground/80 uppercase">
        {label}
      </Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function FieldGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid gap-4 sm:grid-cols-2", className)}>{children}</div>;
}

export function KeyValue({ items, className }: { items: Array<[string, React.ReactNode]>; className?: string }) {
  return (
    <dl className={cn("grid gap-x-6 gap-y-3", className)}>
      {items.map(([key, value]) => (
        <div key={key} className="min-w-0">
          <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{key}</dt>
          <dd className="mt-0.5 text-sm break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Bar({ value, max = 100, tone = "brand", className }: { value: number; max?: number; tone?: Tone; className?: string }) {
  const fill = tone === "good" ? "bg-emerald-600" : tone === "bad" ? "bg-rose-600" : tone === "warn" ? "bg-amber-500" : tone === "info" ? "bg-sky-600" : "bg-primary";
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div className={cn("h-full rounded-full transition-width", fill)} style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%` }} />
    </div>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function InlineEmpty({ title, description }: { title: string; description?: string }) {
  return (
    <Empty className="border border-dashed border-border/80 py-8">
      <EmptyHeader>
        <EmptyTitle className="text-sm">{title}</EmptyTitle>
        {description ? <EmptyDescription className="text-xs">{description}</EmptyDescription> : null}
      </EmptyHeader>
      <EmptyContent />
    </Empty>
  );
}
