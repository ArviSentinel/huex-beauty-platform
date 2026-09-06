"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  Bell,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Gift,
  Globe2,
  LayoutDashboard,
  Mail,
  MapPin,
  Megaphone,
  Plus,
  RefreshCcw,
  Rocket,
  RotateCcw,
  Search,
  Send,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  UserRound,
  Users,
  WandSparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import type {
  Booking,
  BookingStatus,
  BusinessType,
  WorkspaceData,
} from "@/lib/platform-types";

type Section =
  | "overview"
  | "appointments"
  | "customers"
  | "team"
  | "services"
  | "locations"
  | "booking"
  | "growth"
  | "gapfill"
  | "winback"
  | "referrals"
  | "reviews"
  | "campaigns"
  | "marketing"
  | "rewards"
  | "communication"
  | "billing"
  | "settings";

type DialogType =
  | "appointment"
  | "widget-appointment"
  | "customer"
  | "staff"
  | "service"
  | "location"
  | "growth-campaign"
  | "marketing"
  | null;

type ApiAction = Record<string, unknown> & { type: string };

const businessLabels: Record<BusinessType, string> = {
  beauty: "Beauty & Concept Store",
  hair: "Friseur & Hair",
  barber: "Barber",
  nails: "Nagelstudio",
  lashes: "Wimpern & Brows",
  cosmetics: "Kosmetik",
  wellness: "Wellness & Massage",
  tattoo: "Tattoo & Piercing",
};

const statusLabels: Record<BookingStatus, string> = {
  pending: "Angefragt",
  confirmed: "Bestätigt",
  completed: "Abgeschlossen",
  cancelled: "Storniert",
  no_show: "No-Show",
};

const statusClasses: Record<BookingStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  confirmed: "border-violet-200 bg-violet-50 text-violet-800",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  cancelled: "border-slate-200 bg-slate-50 text-slate-500",
  no_show: "border-rose-200 bg-rose-50 text-rose-700",
};

const navigation: Array<{
  label: string;
  items: Array<{ id: Section; label: string; icon: typeof LayoutDashboard }>;
}> = [
  {
    label: "Betrieb",
    items: [
      { id: "overview", label: "Übersicht", icon: LayoutDashboard },
      { id: "appointments", label: "Termine", icon: CalendarDays },
      { id: "customers", label: "Kunden", icon: Users },
      { id: "team", label: "Team", icon: UserRound },
      { id: "services", label: "Leistungen", icon: Sparkles },
      { id: "locations", label: "Standorte", icon: MapPin },
      { id: "booking", label: "Onlinebuchung", icon: Globe2 },
    ],
  },
  {
    label: "Wachstum",
    items: [
      { id: "growth", label: "Growth Hub", icon: Rocket },
      { id: "gapfill", label: "Lückenfüller", icon: Zap },
      { id: "winback", label: "Rückgewinnung", icon: RefreshCcw },
      { id: "referrals", label: "Empfehlungen", icon: Share2 },
      { id: "reviews", label: "Bewertungen", icon: Star },
      { id: "campaigns", label: "Kampagnen", icon: Target },
      { id: "marketing", label: "KI & Social", icon: Megaphone },
      { id: "rewards", label: "Bonus & Trust", icon: Gift },
    ],
  },
  {
    label: "System",
    items: [
      { id: "communication", label: "Kommunikation", icon: Mail },
      { id: "billing", label: "Tarif", icon: CreditCard },
      { id: "settings", label: "Einstellungen", icon: Settings },
    ],
  },
];

const sectionMeta: Record<
  Section,
  { title: string; description: string; dialog?: Exclude<DialogType, null>; action?: string }
> = {
  overview: {
    title: "Guten Morgen",
    description: "Dein Studio, deine Kundinnen und die kleinen Momente, die heute zählen.",
  },
  appointments: {
    title: "Termine",
    description: "Plane, bestätige und dokumentiere alle Buchungen.",
    dialog: "appointment",
    action: "Neuer Termin",
  },
  customers: {
    title: "Kunden",
    description: "Kontakte, Besuchsverlauf und Kundenstatus.",
    dialog: "customer",
    action: "Neuer Kunde",
  },
  team: {
    title: "Team",
    description: "Mitarbeiter, Rollen und Verfügbarkeiten.",
    dialog: "staff",
    action: "Teammitglied",
  },
  services: {
    title: "Leistungen",
    description: "Dauer, Preise und Online-Verfügbarkeit.",
    dialog: "service",
    action: "Neue Leistung",
  },
  locations: {
    title: "Standorte",
    description: "Filialen, Zeitzonen und Zeitraster.",
    dialog: "location",
    action: "Neuer Standort",
  },
  booking: { title: "Onlinebuchung", description: "Teste den Buchungsweg aus Kundensicht." },
  growth: {
    title: "Growth Hub",
    description: "Alle Wachstumschancen, Ergebnisse und nächsten Aktionen an einem Ort.",
  },
  gapfill: {
    title: "Intelligenter Lückenfüller",
    description: "Erkenne freie Umsatzfenster und besetze sie mit passenden Kunden.",
  },
  winback: {
    title: "Kunden-Rückgewinnung",
    description: "Aktiviere Kundinnen, deren letzter Besuch länger zurückliegt.",
  },
  referrals: {
    title: "Empfehlungsprogramm",
    description: "Neue Kunden durch persönliche Empfehlungen gewinnen und belohnen.",
  },
  reviews: {
    title: "Bewertungsmanager",
    description: "Zufriedene Kunden im richtigen Moment um eine Bewertung bitten.",
  },
  campaigns: {
    title: "Kampagnenmanager",
    description: "Zielgruppen, Kanäle und Resultate deiner Aktionen steuern.",
    dialog: "growth-campaign",
    action: "Neue Kampagne",
  },
  marketing: {
    title: "KI & Social Media",
    description: "Erstelle und plane Inhalte im sicheren Demo-Modus.",
    dialog: "marketing",
    action: "Inhalt erstellen",
  },
  rewards: { title: "Bonus & Trust", description: "Belohne Treue und erkenne zuverlässige Kunden." },
  communication: {
    title: "Kommunikation",
    description: "Status aller Bestätigungen und Erinnerungen.",
  },
  billing: { title: "Tarif", description: "Dein aktueller Plan und die enthaltenen Limits." },
  settings: {
    title: "Einstellungen",
    description: "Branche, Buchungsseite und Sicherheit verwalten.",
  },
};

function euro(cents: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function prettyDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[1.5rem] border border-[#6f4a70]/[0.07] bg-white/90 shadow-[0_1px_2px_rgba(79,52,81,0.025),0_18px_50px_rgba(87,54,88,0.065)] backdrop-blur-xl transition-[transform,box-shadow,border-color] duration-300 ${className}`}
    >
      {children}
    </section>
  );
}

function Metric({
  label,
  value,
  note,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof LayoutDashboard;
  accent: string;
}) {
  return (
    <Panel className="group p-5 hover:-translate-y-0.5 hover:border-[#b581b5]/20 hover:shadow-[0_20px_55px_rgba(107,68,109,0.1)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#716873]">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-[#2c2230]">{value}</p>
        </div>
        <span className={`grid size-10 place-items-center rounded-xl ${accent}`}>
          <Icon className="size-5" />
        </span>
      </div>
      <p className="mt-4 text-xs font-medium text-[#928794]">{note}</p>
    </Panel>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-36 place-items-center rounded-2xl border border-dashed border-black/10 bg-[#fbf7fa] p-8 text-center text-sm text-[#716873]">
      {children}
    </div>
  );
}

export function PlatformApp({
  userName,
  signOutHref,
}: {
  userName: string;
  signOutHref: string;
}) {
  const [section, setSection] = useState<Section>("overview");
  const [dialog, setDialog] = useState<DialogType>(null);
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/workspace", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as {
          workspace?: WorkspaceData;
          error?: string;
        };
        if (!response.ok || !payload.workspace) throw new Error(payload.error);
        if (active) setWorkspace(payload.workspace);
      })
      .catch(() => {
        if (active) toast.error("Die Demo-Daten konnten nicht geladen werden.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function mutate(action: ApiAction, success?: string) {
    setSaving(true);
    try {
      const response = await fetch("/api/workspace", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(action),
      });
      const payload = (await response.json()) as {
        workspace?: WorkspaceData;
        error?: string;
      };
      if (!response.ok || !payload.workspace) {
        throw new Error(payload.error || "Aktion fehlgeschlagen.");
      }
      setWorkspace(payload.workspace);
      if (success) toast.success(success);
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Aktion fehlgeschlagen.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingShell />;
  if (!workspace) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#fbf7fa] p-6">
        <Panel className="max-w-md p-8 text-center">
          <h1 className="text-2xl font-semibold text-[#2c2230]">Demo nicht erreichbar</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Bitte lade die Seite neu. Falls der Fehler bleibt, versuche es in wenigen Minuten erneut.
          </p>
        </Panel>
      </main>
    );
  }

  const meta = sectionMeta[section];
  const searchResults = query
    ? workspace.customers.filter((customer) =>
        `${customer.name} ${customer.email} ${customer.phone}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
    : [];

  return (
    <SidebarProvider>
      <Sidebar
        collapsible="offcanvas"
        className="huex-glass border-r border-black/[0.06] text-[#2c2230] shadow-[10px_0_40px_rgba(0,0,0,0.025)]"
      >
        <SidebarHeader className="border-b border-black/[0.055] px-5 py-[1.15rem]">
          <button
            type="button"
            onClick={() => setSection("overview")}
            className="flex items-center gap-3 rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9a659f]/40"
          >
            <span className="grid size-10 place-items-center rounded-[0.9rem] bg-gradient-to-br from-[#ad7bb5] via-[#ce829d] to-[#dfb776] text-white shadow-[0_9px_22px_rgba(139,90,146,0.24)]">
              <Sparkles className="size-[1.15rem]" />
            </span>
            <span>
              <span className="block text-[0.68rem] font-bold tracking-[0.24em] text-[#9a659f]">
                HUEX
              </span>
              <span className="block text-[0.95rem] font-semibold tracking-[-0.02em] text-[#2c2230]">Beauty Platform</span>
            </span>
          </button>
        </SidebarHeader>
        <SidebarContent className="px-3 py-4">
          {navigation.map((group) => (
            <SidebarGroup key={group.label} className="py-2">
              <SidebarGroupLabel className="px-3 text-[0.68rem] font-semibold uppercase tracking-[0.17em] text-[#928794]">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="mt-1 gap-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          type="button"
                          isActive={section === item.id}
                          onClick={() => setSection(item.id)}
                          className="h-10 rounded-xl border border-transparent px-3 text-sm font-medium text-[#716873] hover:bg-[#f8eef4] hover:text-[#5f3d65] data-[active=true]:border-[#a46ba8]/10 data-[active=true]:bg-gradient-to-r data-[active=true]:from-white data-[active=true]:to-[#faf0f6] data-[active=true]:font-semibold data-[active=true]:text-[#6e4675] data-[active=true]:shadow-[0_1px_2px_rgba(79,52,81,0.04),0_7px_20px_rgba(112,70,117,0.08)]"
                        >
                          <Icon />
                          <span>{item.label}</span>
                          {item.id === "marketing" || item.id === "rewards" ? (
                            <span className="ml-auto rounded-full border border-[#9a659f]/20 bg-[#f4eaf6] px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-[#85528d]">
                              Demo
                            </span>
                          ) : null}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter className="border-t border-black/[0.055] p-4">
          <div className="rounded-2xl border border-black/[0.055] bg-white/70 p-3 shadow-[0_8px_25px_rgba(0,0,0,0.035)]">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-[#f4eaf6] text-sm font-semibold text-[#85528d]">
                {initials(userName)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#2c2230]">{userName}</p>
                <p className="text-xs text-[#928794]">Demo-Inhaber</p>
              </div>
            </div>
            <a
              href={signOutHref}
              className="mt-3 block text-xs font-medium text-[#928794] hover:text-[#85528d]"
            >
              Abmelden
            </a>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-w-0 bg-transparent">
        <header className="huex-glass sticky top-0 z-30 border-b border-black/[0.055] px-4 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="md:hidden" aria-label="Menü öffnen" />
            <div className="relative hidden max-w-sm flex-1 md:block">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Kunden suchen …"
                className="h-10 rounded-xl border-black/[0.07] bg-white/80 pl-10 shadow-[inset_0_1px_1px_rgba(0,0,0,0.02)] focus-visible:border-[#9a659f]/40 focus-visible:ring-[#9a659f]/15"
              />
              {query && (
                <div className="absolute top-12 z-40 w-full rounded-2xl border border-black/[0.07] bg-white/95 p-2 shadow-[0_18px_50px_rgba(0,0,0,0.13)] backdrop-blur-2xl">
                  {searchResults.length ? (
                    searchResults.slice(0, 5).map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => {
                          setSection("customers");
                          setQuery("");
                        }}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-[#fbf7fa]"
                      >
                        <span className="text-sm font-medium text-[#2c2230]">{customer.name}</span>
                        <span className="text-xs text-slate-400">{customer.points} Punkte</span>
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-4 text-sm text-slate-400">Kein Kunde gefunden.</p>
                  )}
                </div>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Badge
                variant="outline"
                className="hidden border-[#34c759]/20 bg-[#eaf8ee] px-3 py-1 font-medium text-[#248a3d] sm:inline-flex"
              >
                Sicherer Demo-Modus
              </Badge>
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl border-black/[0.07] bg-white/80 shadow-sm hover:bg-white"
                aria-label="Benachrichtigungen"
              >
                <Bell className="size-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setDialog("widget-appointment")}
                className="hidden rounded-xl border-black/[0.07] bg-white/80 font-medium shadow-sm hover:bg-white lg:inline-flex"
              >
                Buchung testen
              </Button>
            </div>
          </div>
        </header>

        <main className="p-4 pb-12 md:p-8 md:pb-16">
          <div className="mx-auto max-w-[1460px]">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge className="border-0 bg-gradient-to-r from-[#815388] to-[#a36f95] px-3 py-1 text-white shadow-[0_5px_14px_rgba(129,83,136,0.18)]">
                    {businessLabels[workspace.tenant.businessType]}
                  </Badge>
                  <span className="text-xs font-medium text-slate-400">
                    {workspace.tenant.name}
                  </span>
                </div>
                <h1 className="text-3xl font-semibold tracking-[-0.05em] text-[#2c2230] md:text-[2.65rem] md:leading-none">
                  {section === "overview" ? `${meta.title}, ${userName.split(" ")[0]}` : meta.title}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#716873] md:text-base">{meta.description}</p>
              </div>
              {meta.dialog && meta.action ? (
                <Button
                  onClick={() => setDialog(meta.dialog!)}
                  className="h-11 rounded-full bg-gradient-to-r from-[#8b5a92] to-[#b56f91] px-5 font-semibold text-white shadow-[0_9px_22px_rgba(154,101,159,0.24)] hover:-translate-y-0.5 hover:from-[#7d4d84] hover:to-[#a96386]"
                >
                  <Plus className="size-4" />
                  {meta.action}
                </Button>
              ) : null}
            </div>

            {section === "overview" && (
              <Overview workspace={workspace} onNavigate={setSection} />
            )}
            {section === "appointments" && (
              <Appointments workspace={workspace} mutate={mutate} saving={saving} />
            )}
            {section === "customers" && (
              <Customers workspace={workspace} mutate={mutate} />
            )}
            {section === "team" && <Team workspace={workspace} mutate={mutate} />}
            {section === "services" && (
              <Services workspace={workspace} mutate={mutate} />
            )}
            {section === "locations" && <Locations workspace={workspace} />}
            {section === "booking" && (
              <BookingPreview workspace={workspace} onStart={() => setDialog("widget-appointment")} />
            )}
            {section === "growth" && (
              <GrowthHub workspace={workspace} onNavigate={setSection} />
            )}
            {section === "gapfill" && (
              <GapFiller workspace={workspace} mutate={mutate} saving={saving} />
            )}
            {section === "winback" && (
              <Winback workspace={workspace} mutate={mutate} saving={saving} />
            )}
            {section === "referrals" && (
              <ReferralProgram workspace={workspace} mutate={mutate} saving={saving} />
            )}
            {section === "reviews" && (
              <ReviewManager workspace={workspace} mutate={mutate} saving={saving} />
            )}
            {section === "campaigns" && (
              <CampaignManager workspace={workspace} mutate={mutate} />
            )}
            {section === "marketing" && (
              <Marketing workspace={workspace} mutate={mutate} />
            )}
            {section === "rewards" && (
              <Rewards workspace={workspace} mutate={mutate} />
            )}
            {section === "communication" && <Communication workspace={workspace} />}
            {section === "billing" && <Billing workspace={workspace} />}
            {section === "settings" && (
              <PlatformSettings workspace={workspace} mutate={mutate} saving={saving} />
            )}
          </div>
        </main>
      </SidebarInset>

      <ActionDialog
        type={dialog}
        workspace={workspace}
        saving={saving}
        onClose={() => setDialog(null)}
        mutate={mutate}
      />
      <Toaster richColors position="bottom-right" />
    </SidebarProvider>
  );
}

function LoadingShell() {
  return (
    <main className="min-h-screen bg-[#fbf7fa] p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <Skeleton className="h-12 w-72 rounded-xl" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-36 rounded-[1.35rem]" />
          ))}
        </div>
        <Skeleton className="h-[28rem] rounded-[1.35rem]" />
      </div>
    </main>
  );
}

function Overview({
  workspace,
  onNavigate,
}: {
  workspace: WorkspaceData;
  onNavigate: (section: Section) => void;
}) {
  const todaysBookings = workspace.bookings
    .filter((booking) => booking.date === today() && booking.status !== "cancelled")
    .sort((a, b) => a.start.localeCompare(b.start));
  const revenue = workspace.bookings
    .filter((booking) => booking.status === "completed")
    .reduce((sum, booking) => sum + booking.priceCents, 0);
  const activeStaff = workspace.staff.filter((member) => member.active).length;
  const pending = workspace.bookings.filter((booking) => booking.status === "pending").length;
  const nextBooking = todaysBookings[0];
  const nextCustomer = workspace.customers.find((customer) => customer.id === nextBooking?.customerId);
  const nextService = workspace.services.find((service) => service.id === nextBooking?.serviceId);

  return (
    <div className="space-y-6">
      <Panel className="relative overflow-hidden border-white/70 bg-[linear-gradient(125deg,#fffdfd_0%,#fbeaf2_48%,#eee7fa_100%)] p-0">
        <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-[#d690a8]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-[28%] size-64 rounded-full bg-[#b89ed2]/25 blur-3xl" />
        <div className="relative grid gap-6 p-6 md:grid-cols-[1.35fr_0.65fr] md:items-center md:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8b5a92]">Dein Studio heute</p>
            <h2 className="mt-3 max-w-2xl text-2xl font-semibold leading-tight tracking-[-0.04em] text-[#33243a] md:text-[2rem]">
              Heute entstehen {todaysBookings.length || "neue"} kleine Wohlfühlmomente.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#716873] md:text-base">
              Jeder Termin ist mehr als ein Eintrag im Kalender – er ist Zeit, die deine Kundinnen nur für sich haben.
            </p>
          </div>
          <div className="rounded-[1.25rem] border border-white/70 bg-white/55 p-5 shadow-[0_12px_35px_rgba(103,65,105,0.09)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#9a659f]">Nächster Moment</p>
              <span className="size-2 rounded-full bg-[#d79d64] shadow-[0_0_0_5px_rgba(215,157,100,0.12)]" />
            </div>
            {nextBooking ? (
              <>
                <p className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[#33243a]">{nextBooking.start}</p>
                <p className="mt-2 font-semibold text-[#4d3a51]">{nextCustomer?.name}</p>
                <p className="mt-1 text-sm text-[#8c7f8e]">{nextService?.name}</p>
              </>
            ) : (
              <p className="mt-4 text-sm leading-6 text-[#716873]">Der Tag ist noch offen für neue Buchungen.</p>
            )}
          </div>
        </div>
      </Panel>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Termine heute"
          value={String(todaysBookings.length)}
          note={pending ? `${pending} Anfrage(n) warten auf Freigabe` : "Alle Anfragen bearbeitet"}
          icon={CalendarCheck}
          accent="bg-violet-100 text-violet-700"
        />
        <Metric
          label="Umsatz erfasst"
          value={euro(revenue)}
          note="aus abgeschlossenen Demo-Terminen"
          icon={CircleDollarSign}
          accent="bg-emerald-100 text-emerald-700"
        />
        <Metric
          label="Aktive Kunden"
          value={String(workspace.customers.length)}
          note="6 davon mit hohem Trust-Score"
          icon={Users}
          accent="bg-pink-100 text-pink-700"
        />
        <Metric
          label="Team heute"
          value={`${activeStaff}/${workspace.staff.length}`}
          note="am Hauptstandort verfügbar"
          icon={TrendingUp}
          accent="bg-amber-100 text-amber-700"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_0.8fr]">
        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-[rgba(79,52,81,0.08)] px-5 py-4 md:px-6">
            <div>
              <h2 className="font-semibold text-[#2c2230]">Heute im Studio</h2>
              <p className="mt-1 text-xs text-slate-400">{prettyDate(today())}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("appointments")}>
              Alle Termine <ChevronRight />
            </Button>
          </div>
          <div className="divide-y divide-[#efe5eb]">
            {todaysBookings.length ? (
              todaysBookings.map((booking) => (
                <BookingRow key={booking.id} booking={booking} workspace={workspace} />
              ))
            ) : (
              <div className="p-6">
                <EmptyState>Heute sind noch keine Termine eingetragen.</EmptyState>
              </div>
            )}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel className="overflow-hidden bg-gradient-to-br from-[#2c2230] via-[#39283e] to-[#5d3e5c] p-6 text-white">
            <div className="flex items-start justify-between">
              <span className="grid size-11 place-items-center rounded-2xl bg-white/10">
                <WandSparkles className="size-5 text-[#f2c88f]" />
              </span>
              <Badge className="border border-white/15 bg-white/10 text-white">Demo</Badge>
            </div>
            <h2 className="mt-8 text-xl font-semibold">Freie Zeiten sichtbar machen</h2>
            <p className="mt-2 text-sm leading-6 text-white/65">
              Lass dir einen Social-Post für die nächsten Buchungslücken vorschlagen.
            </p>
            <Button
              onClick={() => onNavigate("marketing")}
              className="mt-5 rounded-full bg-white px-5 font-semibold text-[#2c2230] hover:-translate-y-0.5 hover:bg-white/90"
            >
              Beitrag vorbereiten
            </Button>
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[#2c2230]">Demo-Zugang</h2>
              <ShieldCheck className="size-5 text-emerald-600" />
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Dein Testbetrieb bleibt bis {prettyDate(workspace.tenant.demoExpiresAt)} aktiv.
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[rgba(79,52,81,0.08)]">
              <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-[#9a659f] to-[#af52de]" />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function BookingRow({ booking, workspace }: { booking: Booking; workspace: WorkspaceData }) {
  const customer = workspace.customers.find((item) => item.id === booking.customerId);
  const service = workspace.services.find((item) => item.id === booking.serviceId);
  const member = workspace.staff.find((item) => item.id === booking.staffId);
  return (
    <div className="flex flex-wrap items-center gap-4 px-5 py-4 md:px-6">
      <div className="w-14 text-lg font-semibold tabular-nums text-[#2c2230]">{booking.start}</div>
      <span
        className="h-10 w-1 rounded-full"
        style={{ backgroundColor: member?.color ?? "#9a659f" }}
      />
      <div className="min-w-44 flex-1">
        <p className="font-medium text-[#2c2230]">{customer?.name ?? "Unbekannter Kunde"}</p>
        <p className="mt-1 text-sm text-slate-400">
          {service?.name} · {member?.name}
        </p>
      </div>
      <Badge variant="outline" className={statusClasses[booking.status]}>
        {statusLabels[booking.status]}
      </Badge>
      <span className="min-w-20 text-right text-sm font-semibold text-[#2c2230]">
        {euro(booking.priceCents)}
      </span>
    </div>
  );
}

function Appointments({
  workspace,
  mutate,
  saving,
}: {
  workspace: WorkspaceData;
  mutate: (action: ApiAction, success?: string) => Promise<boolean>;
  saving: boolean;
}) {
  const sorted = [...workspace.bookings].sort(
    (a, b) => `${b.date}${b.start}`.localeCompare(`${a.date}${a.start}`),
  );
  return (
    <Panel className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(79,52,81,0.08)] px-5 py-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-xl">
            Woche
          </Button>
          <Button variant="ghost" size="sm" className="rounded-xl text-slate-500">
            Tag
          </Button>
          <Button variant="ghost" size="sm" className="rounded-xl text-slate-500">
            Liste
          </Button>
        </div>
        <p className="text-xs text-slate-400">
          Doppelbuchungen werden beim Speichern serverseitig verhindert.
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-5">Datum</TableHead>
            <TableHead>Zeit</TableHead>
            <TableHead>Kunde</TableHead>
            <TableHead>Leistung</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-5 text-right">Preis</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((booking) => {
            const customer = workspace.customers.find((item) => item.id === booking.customerId);
            const service = workspace.services.find((item) => item.id === booking.serviceId);
            const member = workspace.staff.find((item) => item.id === booking.staffId);
            return (
              <TableRow key={booking.id}>
                <TableCell className="px-5 font-medium">{prettyDate(booking.date)}</TableCell>
                <TableCell className="tabular-nums">{booking.start}</TableCell>
                <TableCell>{customer?.name}</TableCell>
                <TableCell>{service?.name}</TableCell>
                <TableCell>{member?.name}</TableCell>
                <TableCell>
                  <NativeSelect
                    aria-label="Terminstatus"
                    value={booking.status}
                    disabled={saving}
                    onChange={(event) =>
                      void mutate(
                        {
                          type: "update_booking_status",
                          id: booking.id,
                          status: event.target.value,
                        },
                        "Terminstatus aktualisiert.",
                      )
                    }
                    className="h-8 min-w-36 border-[rgba(79,52,81,0.1)] bg-white text-xs"
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <NativeSelectOption key={value} value={value}>
                        {label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </TableCell>
                <TableCell className="pr-5 text-right font-semibold">{euro(booking.priceCents)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Panel>
  );
}

function Customers({
  workspace,
  mutate,
}: {
  workspace: WorkspaceData;
  mutate: (action: ApiAction, success?: string) => Promise<boolean>;
}) {
  return (
    <Panel className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-5">Kunde</TableHead>
            <TableHead>Kontakt</TableHead>
            <TableHead>Besuche</TableHead>
            <TableHead>Bonuspunkte</TableHead>
            <TableHead>Trust</TableHead>
            <TableHead className="pr-5">Schnellaktion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workspace.customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="px-5">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-[#efe5eb] text-xs font-semibold text-[#6f4681]">
                    {initials(customer.name)}
                  </span>
                  <div>
                    <p className="font-medium text-[#2c2230]">{customer.name}</p>
                    <p className="text-xs text-slate-400">Zuletzt: {prettyDate(customer.lastVisit)}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <p>{customer.email || "—"}</p>
                <p className="mt-1 text-xs text-slate-400">{customer.phone || "—"}</p>
              </TableCell>
              <TableCell>{customer.visits}</TableCell>
              <TableCell className="font-semibold text-[#85528d]">{customer.points}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    customer.trustScore >= 95
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : customer.trustScore >= 85
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-rose-200 bg-rose-50 text-rose-700"
                  }
                >
                  {customer.trustScore} %
                </Badge>
              </TableCell>
              <TableCell className="pr-5">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() =>
                    void mutate(
                      { type: "adjust_points", customerId: customer.id, delta: 50 },
                      "50 Demo-Punkte vergeben.",
                    )
                  }
                >
                  +50 Punkte
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Panel>
  );
}

function Team({
  workspace,
  mutate,
}: {
  workspace: WorkspaceData;
  mutate: (action: ApiAction, success?: string) => Promise<boolean>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {workspace.staff.map((member) => {
        const assigned = workspace.bookings.filter(
          (booking) =>
            booking.staffId === member.id &&
            ["pending", "confirmed"].includes(booking.status),
        ).length;
        return (
          <Panel key={member.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span
                  className="grid size-12 place-items-center rounded-2xl text-sm font-semibold text-white"
                  style={{ backgroundColor: member.color }}
                >
                  {initials(member.name)}
                </span>
                <div>
                  <h2 className="font-semibold text-[#2c2230]">{member.name}</h2>
                  <p className="mt-1 text-sm text-slate-400">{member.title}</p>
                </div>
              </div>
              <Switch
                checked={member.active}
                aria-label={member.active ? "Mitarbeiter deaktivieren" : "Mitarbeiter aktivieren"}
                onCheckedChange={() =>
                  void mutate(
                    { type: "toggle_staff", id: member.id },
                    member.active ? "Teammitglied deaktiviert." : "Teammitglied aktiviert.",
                  )
                }
              />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#fbf7fa] p-3">
                <p className="text-xs text-slate-400">Offene Termine</p>
                <p className="mt-1 text-xl font-semibold text-[#2c2230]">{assigned}</p>
              </div>
              <div className="rounded-xl bg-[#fbf7fa] p-3">
                <p className="text-xs text-slate-400">Rolle</p>
                <p className="mt-1 text-sm font-semibold capitalize text-[#2c2230]">{member.role}</p>
              </div>
            </div>
          </Panel>
        );
      })}
    </div>
  );
}

function Services({
  workspace,
  mutate,
}: {
  workspace: WorkspaceData;
  mutate: (action: ApiAction, success?: string) => Promise<boolean>;
}) {
  const groups = workspace.services.reduce<Record<string, typeof workspace.services>>((result, service) => {
    (result[service.category] ??= []).push(service);
    return result;
  }, {});
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {Object.entries(groups).map(([category, services]) => (
        <Panel key={category} className="overflow-hidden">
          <div className="border-b border-[rgba(79,52,81,0.08)] px-5 py-4">
            <h2 className="font-semibold text-[#2c2230]">{category}</h2>
            <p className="mt-1 text-xs text-slate-400">{services.length} Leistungen</p>
          </div>
          <div className="divide-y divide-[#efe5eb]">
            {services.map((service) => (
              <div key={service.id} className="flex items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[#2c2230]">{service.name}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {service.duration} Min. + {service.buffer} Min. Puffer
                  </p>
                </div>
                <p className="font-semibold text-[#2c2230]">{euro(service.priceCents)}</p>
                <Switch
                  checked={service.onlineBookable}
                  aria-label="Online buchbar"
                  onCheckedChange={() =>
                    void mutate(
                      { type: "toggle_service", id: service.id },
                      "Online-Verfügbarkeit geändert.",
                    )
                  }
                />
              </div>
            ))}
          </div>
        </Panel>
      ))}
    </div>
  );
}

function Locations({ workspace }: { workspace: WorkspaceData }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {workspace.locations.map((location) => (
        <Panel key={location.id} className="p-6">
          <div className="flex items-start gap-4">
            <span className="grid size-12 place-items-center rounded-2xl bg-[#f4eaf6] text-[#85528d]">
              <MapPin className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-[#2c2230]">{location.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{location.address}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-[#fbf7fa] p-4">
              <p className="text-xs text-slate-400">Zeitzone</p>
              <p className="mt-1 text-sm font-medium text-[#2c2230]">{location.timezone}</p>
            </div>
            <div className="rounded-xl bg-[#fbf7fa] p-4">
              <p className="text-xs text-slate-400">Zeitraster</p>
              <p className="mt-1 text-sm font-medium text-[#2c2230]">
                {location.slotMinutes} Minuten
              </p>
            </div>
          </div>
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Wochenraster
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Mo 09–18", "Di 09–18", "Mi 09–18", "Do 09–19", "Fr 09–18", "Sa 09–15"].map(
                (slot) => (
                  <Badge key={slot} variant="outline" className="border-[rgba(79,52,81,0.1)] bg-white">
                    {slot}
                  </Badge>
                ),
              )}
            </div>
          </div>
        </Panel>
      ))}
    </div>
  );
}

function BookingPreview({
  workspace,
  onStart,
}: {
  workspace: WorkspaceData;
  onStart: () => void;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.72fr]">
      <Panel className="overflow-hidden">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#151517] via-[#25252a] to-[#3a3a42] p-7 text-white md:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-[#9a659f]/25 blur-3xl" />
          <div className="relative">
          <Badge className="border border-white/20 bg-white/10 text-white">Live-Vorschau</Badge>
          <p className="mt-12 text-sm font-medium uppercase tracking-[0.2em] text-[#f2c88f]">
            {workspace.tenant.name}
          </p>
          <h2 className="mt-3 max-w-xl text-4xl font-semibold tracking-[-0.045em] md:text-5xl">
            Dein Termin. So einfach wie dein Alltag.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-white/65">
            Leistung, Team und Wunschzeit auswählen – die Buchung erscheint direkt im Kalender.
          </p>
          <Button
            onClick={onStart}
            className="mt-8 h-12 rounded-full bg-white px-6 font-semibold text-[#2c2230] hover:-translate-y-0.5 hover:bg-white/90"
          >
            Termin buchen
            <ChevronRight />
          </Button>
          </div>
        </div>
      </Panel>
      <Panel className="p-6">
        <h2 className="font-semibold text-[#2c2230]">Buchungsschutz aktiv</h2>
        <div className="mt-5 space-y-4">
          {[
            ["Doppelbuchungsschutz", "Zeiträume werden vor dem Speichern geprüft."],
            ["Persönliche Zuordnung", "Kunde, Leistung, Team und Standort bleiben verbunden."],
            ["Audit-Trail vorbereitet", "Statusänderungen sind nachvollziehbar."],
            ["Widget-Sicherheit", workspace.security.widgetKey],
          ].map(([title, copy]) => (
            <div key={title} className="flex gap-3">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                <Check className="size-3.5" />
              </span>
              <div>
                <p className="text-sm font-medium text-[#2c2230]">{title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function SimulationNotice({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#9a659f]/15 bg-[#f4eaf6]/80 px-5 py-4 text-sm leading-6 text-[#75457e] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
      <strong>Interaktive Demo:</strong> {children}
    </div>
  );
}

function GrowthHub({
  workspace,
  onNavigate,
}: {
  workspace: WorkspaceData;
  onNavigate: (section: Section) => void;
}) {
  const revenue = workspace.growthCampaigns.reduce(
    (sum, campaign) => sum + campaign.revenueCents,
    0,
  );
  const bookings = workspace.growthCampaigns.reduce(
    (sum, campaign) => sum + campaign.bookings,
    0,
  );
  const reviews = workspace.reviewRequests.filter((request) => request.status === "received");
  const averageRating = reviews.length
    ? reviews.reduce((sum, request) => sum + (request.rating ?? 0), 0) / reviews.length
    : 0;
  const modules: Array<{
    section: Section;
    title: string;
    copy: string;
    metric: string;
    icon: typeof Rocket;
    accent: string;
  }> = [
    {
      section: "gapfill",
      title: "Lückenfüller",
      copy: "Freie Termine automatisch mit passenden Stammkunden besetzen.",
      metric: `${workspace.bookings.filter((booking) => booking.status === "cancelled" && booking.date >= today()).length} Chance`,
      icon: Zap,
      accent: "bg-amber-100 text-amber-700",
    },
    {
      section: "winback",
      title: "Rückgewinnung",
      copy: "Inaktive Kunden persönlich und zum richtigen Zeitpunkt ansprechen.",
      metric: `${workspace.growthCampaigns.filter((campaign) => campaign.type === "winback").length} gestartet`,
      icon: RefreshCcw,
      accent: "bg-pink-100 text-pink-700",
    },
    {
      section: "referrals",
      title: "Empfehlungen",
      copy: "Beste Kunden zu Botschaftern machen und Erfolge belohnen.",
      metric: `${workspace.referrals.length} Empfehlung(en)`,
      icon: Share2,
      accent: "bg-violet-100 text-violet-700",
    },
    {
      section: "reviews",
      title: "Bewertungen",
      copy: "Nach gelungenen Terminen strukturiert Bewertungen einsammeln.",
      metric: averageRating ? `${averageRating.toFixed(1)} / 5 Sterne` : "Noch offen",
      icon: Star,
      accent: "bg-emerald-100 text-emerald-700",
    },
    {
      section: "campaigns",
      title: "Kampagnen",
      copy: "Alle Wachstumsaktionen mit Zielgruppe, Kanal und Ergebnis steuern.",
      metric: `${workspace.growthCampaigns.length} Kampagne(n)`,
      icon: Target,
      accent: "bg-sky-100 text-sky-700",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Gewonnene Buchungen" value={String(bookings)} note="aus Wachstumsaktionen" icon={CalendarCheck} accent="bg-violet-100 text-violet-700" />
        <Metric label="Zusatzumsatz" value={euro(revenue)} note="im Demo-Zeitraum zugeordnet" icon={TrendingUp} accent="bg-emerald-100 text-emerald-700" />
        <Metric label="Aktive Kampagnen" value={String(workspace.growthCampaigns.filter((campaign) => campaign.status === "active").length)} note="kanalübergreifend" icon={Rocket} accent="bg-amber-100 text-amber-700" />
      </div>
      <SimulationNotice>
        Nachrichten, Bewertungen und Kanal-Ausspielungen werden simuliert. Aktionen und Ergebnisse bleiben in deinem persönlichen Demo-Betrieb gespeichert.
      </SimulationNotice>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <button key={module.section} type="button" onClick={() => onNavigate(module.section)} className="text-left">
              <Panel className="h-full p-6 transition hover:-translate-y-0.5 hover:border-[#cdbcd4] hover:shadow-xl">
                <div className="flex items-start justify-between gap-4">
                  <span className={`grid size-11 place-items-center rounded-2xl ${module.accent}`}><Icon className="size-5" /></span>
                  <Badge variant="outline" className="border-[rgba(79,52,81,0.1)] bg-[#fbf7fa]">{module.metric}</Badge>
                </div>
                <h2 className="mt-5 text-lg font-semibold text-[#2c2230]">{module.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{module.copy}</p>
                <span className="mt-5 flex items-center gap-1 text-sm font-semibold text-[#85528d]">Modul öffnen <ChevronRight className="size-4" /></span>
              </Panel>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GapFiller({
  workspace,
  mutate,
  saving,
}: {
  workspace: WorkspaceData;
  mutate: (action: ApiAction, success?: string) => Promise<boolean>;
  saving: boolean;
}) {
  const [customerId, setCustomerId] = useState(workspace.customers[0]?.id ?? "");
  const gaps = workspace.bookings
    .filter((booking) => booking.status === "cancelled" && booking.date >= today())
    .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));

  return (
    <div className="space-y-6">
      <SimulationNotice>
        Die passende Zielgruppe und WhatsApp-Reaktion werden simuliert. Wird eine Lücke besetzt, entsteht ein echter Demo-Termin im Kalender.
      </SimulationNotice>
      <Panel className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-[#2c2230]">Erkannte Umsatzlücken</h2>
            <p className="mt-1 text-sm text-slate-500">Stornierte Termine, die noch neu vergeben werden können.</p>
          </div>
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">{gaps.length} erkannt</Badge>
        </div>
        <div className="mt-6 space-y-4">
          {gaps.length ? gaps.map((gap) => {
            const service = workspace.services.find((item) => item.id === gap.serviceId);
            const member = workspace.staff.find((item) => item.id === gap.staffId);
            const filled = workspace.bookings.some((booking) =>
              booking.id !== gap.id && booking.staffId === gap.staffId && booking.date === gap.date && booking.start === gap.start && ["pending", "confirmed"].includes(booking.status),
            );
            return (
              <div key={gap.id} className="rounded-2xl border border-[rgba(79,52,81,0.08)] bg-[#fbf7fa] p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">{prettyDate(gap.date)} · {gap.start}</Badge>
                      {filled && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Neu besetzt</Badge>}
                    </div>
                    <h3 className="mt-3 font-semibold text-[#2c2230]">{service?.name ?? "Termin"}</h3>
                    <p className="mt-1 text-sm text-slate-500">{member?.name} · Umsatzchance {euro(gap.priceCents)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <NativeSelect value={customerId} onChange={(event) => setCustomerId(event.target.value)} disabled={filled} className="h-10 min-w-48 rounded-xl border-[rgba(79,52,81,0.1)] bg-white">
                      {workspace.customers.map((customer) => <NativeSelectOption key={customer.id} value={customer.id}>{customer.name}</NativeSelectOption>)}
                    </NativeSelect>
                    <Button disabled={saving || filled || !customerId} onClick={() => void mutate({ type: "launch_gap_campaign", bookingId: gap.id, customerId }, "Lücke besetzt und im Kalender gespeichert.")} className="rounded-xl bg-[#2c2230]">
                      <Zap className="size-4" /> {filled ? "Besetzt" : "Jetzt besetzen"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          }) : <EmptyState>Aktuell gibt es keine offenen Terminlücken.</EmptyState>}
        </div>
      </Panel>
    </div>
  );
}

function Winback({
  workspace,
  mutate,
  saving,
}: {
  workspace: WorkspaceData;
  mutate: (action: ApiAction, success?: string) => Promise<boolean>;
  saving: boolean;
}) {
  const candidates = workspace.customers
    .filter((customer) => /^\d{4}-\d{2}-\d{2}$/.test(customer.lastVisit))
    .map((customer) => ({ customer, inactiveDays: Math.max(0, Math.floor((Date.now() - new Date(`${customer.lastVisit}T12:00:00`).getTime()) / 86400000)) }))
    .filter((item) => item.inactiveDays >= 7)
    .sort((a, b) => b.inactiveDays - a.inactiveDays);

  return (
    <div className="space-y-6">
      <SimulationNotice>
        Die personalisierte E-Mail wird im Kommunikationsprotokoll gespeichert, aber nicht wirklich verschickt.
      </SimulationNotice>
      <div className="grid gap-5 lg:grid-cols-2">
        {candidates.map(({ customer, inactiveDays }) => {
          const active = workspace.growthCampaigns.some((campaign) => campaign.type === "winback" && campaign.audience === customer.name && campaign.status === "active");
          return (
            <Panel key={customer.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-2xl bg-[#f4eaf6] text-sm font-semibold text-[#85528d]">{initials(customer.name)}</span>
                  <div><h2 className="font-semibold text-[#2c2230]">{customer.name}</h2><p className="mt-1 text-xs text-slate-400">{customer.visits} Besuche · {customer.points} Punkte</p></div>
                </div>
                <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">{inactiveDays} Tage</Badge>
              </div>
              <div className="mt-5 rounded-xl bg-[#fbf7fa] p-4 text-sm leading-6 text-slate-600">„{customer.name.split(" ")[0]}, wir vermissen dich. Sichere dir deinen persönlichen Beauty-Moment.“</div>
              <Button variant="outline" disabled={saving || active} onClick={() => void mutate({ type: "launch_winback", customerId: customer.id }, "Rückgewinnungsaktion gestartet.")} className="mt-5 w-full rounded-xl border-[rgba(79,52,81,0.1)]">
                <Send className="size-4" /> {active ? "Aktion läuft" : "Rückgewinnung starten"}
              </Button>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

function ReferralProgram({
  workspace,
  mutate,
  saving,
}: {
  workspace: WorkspaceData;
  mutate: (action: ApiAction, success?: string) => Promise<boolean>;
  saving: boolean;
}) {
  const [referrerCustomerId, setReferrerCustomerId] = useState(workspace.customers[0]?.id ?? "");
  const [referredName, setReferredName] = useState("");
  const completed = workspace.referrals.filter((referral) => referral.status === "completed").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Empfehlungen" value={String(workspace.referrals.length)} note="insgesamt erzeugt" icon={Share2} accent="bg-violet-100 text-violet-700" />
        <Metric label="Erfolgreich" value={String(completed)} note="mit eingelöster Prämie" icon={Check} accent="bg-emerald-100 text-emerald-700" />
        <Metric label="Prämie" value="150" note="Demo-Punkte pro Erfolg" icon={Gift} accent="bg-amber-100 text-amber-700" />
      </div>
      <Panel className="p-6">
        <h2 className="font-semibold text-[#2c2230]">Neue Empfehlung simulieren</h2>
        <p className="mt-1 text-sm text-slate-500">Wähle den Empfehlenden und erfasse den Vornamen der eingeladenen Person.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <NativeSelect value={referrerCustomerId} onChange={(event) => setReferrerCustomerId(event.target.value)} className="h-11 rounded-xl border-[rgba(79,52,81,0.1)]">
            {workspace.customers.map((customer) => <NativeSelectOption key={customer.id} value={customer.id}>{customer.name}</NativeSelectOption>)}
          </NativeSelect>
          <Input value={referredName} onChange={(event) => setReferredName(event.target.value)} placeholder="Name der Empfehlung" className="h-11 rounded-xl border-[rgba(79,52,81,0.1)]" />
          <Button disabled={saving || !referredName.trim()} onClick={async () => { const ok = await mutate({ type: "create_referral", referrerCustomerId, referredName }, "Empfehlung wurde angelegt."); if (ok) setReferredName(""); }} className="h-11 rounded-xl bg-[#2c2230]"><Plus className="size-4" /> Anlegen</Button>
        </div>
      </Panel>
      <Panel className="overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead className="px-5">Empfohlen von</TableHead><TableHead>Neue Kundin</TableHead><TableHead>Status</TableHead><TableHead className="pr-5">Prämie</TableHead></TableRow></TableHeader>
          <TableBody>{workspace.referrals.map((referral) => {
            const customer = workspace.customers.find((item) => item.id === referral.referrerCustomerId);
            return <TableRow key={referral.id}><TableCell className="px-5 font-medium">{customer?.name}</TableCell><TableCell>{referral.referredName}</TableCell><TableCell><Badge variant="outline" className={referral.status === "completed" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>{referral.status === "completed" ? "Erfolgreich" : referral.status === "booked" ? "Termin gebucht" : "Eingeladen"}</Badge></TableCell><TableCell className="pr-5"><Button size="sm" variant="outline" disabled={saving || referral.status === "completed"} onClick={() => void mutate({ type: "complete_referral", id: referral.id }, `${referral.rewardPoints} Punkte gutgeschrieben.`)} className="rounded-xl">{referral.status === "completed" ? `+${referral.rewardPoints} vergeben` : "Erfolg simulieren"}</Button></TableCell></TableRow>;
          })}</TableBody>
        </Table>
      </Panel>
    </div>
  );
}

function ReviewManager({
  workspace,
  mutate,
  saving,
}: {
  workspace: WorkspaceData;
  mutate: (action: ApiAction, success?: string) => Promise<boolean>;
  saving: boolean;
}) {
  const received = workspace.reviewRequests.filter((request) => request.status === "received");
  const average = received.length ? received.reduce((sum, request) => sum + (request.rating ?? 0), 0) / received.length : 0;
  return (
    <div className="space-y-6">
      <SimulationNotice>
        Bewertungsanfragen und Antworten werden vollständig simuliert; es erfolgt keine Veröffentlichung bei Google oder anderen Portalen.
      </SimulationNotice>
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Anfragen" value={String(workspace.reviewRequests.length)} note="im Demo-Verlauf" icon={Send} accent="bg-violet-100 text-violet-700" />
        <Metric label="Antworten" value={String(received.length)} note="simuliert eingegangen" icon={Star} accent="bg-amber-100 text-amber-700" />
        <Metric label="Durchschnitt" value={average ? average.toFixed(1) : "–"} note="von 5 Sternen" icon={TrendingUp} accent="bg-emerald-100 text-emerald-700" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <Panel className="p-6"><h2 className="font-semibold text-[#2c2230]">Beste Kandidaten</h2><div className="mt-5 space-y-3">{[...workspace.customers].sort((a, b) => b.trustScore - a.trustScore).slice(0, 4).map((customer) => {
          const open = workspace.reviewRequests.some((request) => request.customerId === customer.id && request.status !== "received");
          return <div key={customer.id} className="flex items-center justify-between gap-3 rounded-xl border border-[rgba(79,52,81,0.08)] p-3"><div><p className="text-sm font-medium text-[#2c2230]">{customer.name}</p><p className="mt-1 text-xs text-slate-400">Trust {customer.trustScore}% · {customer.visits} Besuche</p></div><Button size="sm" variant="outline" disabled={saving || open} onClick={() => void mutate({ type: "send_review_request", customerId: customer.id }, "Bewertungsanfrage gespeichert.")} className="rounded-xl">{open ? "Gesendet" : "Anfragen"}</Button></div>;
        })}</div></Panel>
        <Panel className="overflow-hidden"><div className="border-b border-[rgba(79,52,81,0.08)] px-5 py-4"><h2 className="font-semibold text-[#2c2230]">Anfragen & Antworten</h2></div><Table><TableHeader><TableRow><TableHead className="px-5">Kunde</TableHead><TableHead>Status</TableHead><TableHead className="pr-5">Ergebnis</TableHead></TableRow></TableHeader><TableBody>{workspace.reviewRequests.map((request) => {
          const customer = workspace.customers.find((item) => item.id === request.customerId);
          return <TableRow key={request.id}><TableCell className="px-5 font-medium">{customer?.name}</TableCell><TableCell>{request.status === "received" ? "Beantwortet" : request.status === "sent" ? "Gesendet" : "Geplant"}</TableCell><TableCell className="pr-5">{request.status === "received" ? <span className="flex text-amber-500">{Array.from({ length: request.rating ?? 0 }).map((_, index) => <Star key={index} className="size-4 fill-current" />)}</span> : <Button size="sm" variant="outline" disabled={saving} onClick={() => void mutate({ type: "receive_review", id: request.id, rating: 5 }, "5-Sterne-Antwort simuliert.")} className="rounded-xl">5 Sterne simulieren</Button>}</TableCell></TableRow>;
        })}</TableBody></Table></Panel>
      </div>
    </div>
  );
}

function CampaignManager({
  workspace,
  mutate,
}: {
  workspace: WorkspaceData;
  mutate: (action: ApiAction, success?: string) => Promise<boolean>;
}) {
  const labels = { draft: "Entwurf", active: "Aktiv", completed: "Abgeschlossen" } as const;
  return (
    <div className="space-y-6">
      <SimulationNotice>
        Kanalversand und Reaktionen werden simuliert. Planung, Status und Kennzahlen sind bedienbar und gespeichert.
      </SimulationNotice>
      <div className="grid gap-5 xl:grid-cols-2">
        {workspace.growthCampaigns.map((campaign) => (
          <Panel key={campaign.id} className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div><div className="flex flex-wrap gap-2"><Badge variant="outline" className="border-[rgba(79,52,81,0.1)]">{campaign.channel}</Badge><Badge className="bg-[#f4eaf6] text-[#85528d] hover:bg-[#f4eaf6]">{campaign.type === "gap_fill" ? "Lückenfüller" : campaign.type === "winback" ? "Rückgewinnung" : campaign.type === "new_service" ? "Neue Leistung" : "Saisonal"}</Badge></div><h2 className="mt-4 text-lg font-semibold text-[#2c2230]">{campaign.name}</h2><p className="mt-2 text-sm text-slate-500">{campaign.audience}</p></div>
              <NativeSelect value={campaign.status} onChange={(event) => void mutate({ type: "update_growth_campaign", id: campaign.id, status: event.target.value }, "Kampagnenstatus aktualisiert.")} className="h-9 min-w-32 rounded-xl border-[rgba(79,52,81,0.1)]"><NativeSelectOption value="draft">Entwurf</NativeSelectOption><NativeSelectOption value="active">Aktiv</NativeSelectOption><NativeSelectOption value="completed">Abgeschlossen</NativeSelectOption></NativeSelect>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3"><div className="rounded-xl bg-[#fbf7fa] p-3"><p className="text-xs text-slate-400">Erreicht</p><p className="mt-1 font-semibold text-[#2c2230]">{campaign.sent}</p></div><div className="rounded-xl bg-[#fbf7fa] p-3"><p className="text-xs text-slate-400">Buchungen</p><p className="mt-1 font-semibold text-[#2c2230]">{campaign.bookings}</p></div><div className="rounded-xl bg-[#fbf7fa] p-3"><p className="text-xs text-slate-400">Umsatz</p><p className="mt-1 font-semibold text-[#2c2230]">{euro(campaign.revenueCents)}</p></div></div>
            <p className="mt-4 text-xs text-slate-400">Status: {labels[campaign.status]}</p>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function Marketing({
  workspace,
  mutate,
}: {
  workspace: WorkspaceData;
  mutate: (action: ApiAction, success?: string) => Promise<boolean>;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#9a659f]/15 bg-[#f4eaf6]/80 px-5 py-4 text-sm text-[#75457e] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
        <strong>Interaktive Simulation:</strong> Entwürfe und Status werden gespeichert, aber es
        wird nichts an echte Social-Media-Konten gesendet.
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        {workspace.marketingPosts.map((post) => (
          <Panel key={post.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-[rgba(79,52,81,0.1)]">
                    {post.channel}
                  </Badge>
                  <Badge className="bg-[#f4eaf6] text-[#85528d] hover:bg-[#f4eaf6]">Demo</Badge>
                </div>
                <h2 className="mt-4 text-lg font-semibold text-[#2c2230]">{post.title}</h2>
              </div>
              <NativeSelect
                value={post.status}
                aria-label="Beitragsstatus"
                onChange={(event) =>
                  void mutate(
                    { type: "update_post_status", id: post.id, status: event.target.value },
                    event.target.value === "published"
                      ? "Im Demo-Modus veröffentlicht."
                      : "Beitragsstatus aktualisiert.",
                  )
                }
                className="h-8 min-w-28 border-[rgba(79,52,81,0.1)] text-xs"
              >
                <NativeSelectOption value="draft">Entwurf</NativeSelectOption>
                <NativeSelectOption value="scheduled">Geplant</NativeSelectOption>
                <NativeSelectOption value="published">Veröffentlicht</NativeSelectOption>
              </NativeSelect>
            </div>
            <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-600">{post.copy}</p>
            <p className="mt-5 text-xs text-slate-400">
              {post.scheduledFor
                ? new Date(post.scheduledFor).toLocaleString("de-DE", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : "Noch nicht geplant"}
            </p>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function Rewards({
  workspace,
  mutate,
}: {
  workspace: WorkspaceData;
  mutate: (action: ApiAction, success?: string) => Promise<boolean>;
}) {
  const totalPoints = workspace.customers.reduce((sum, customer) => sum + customer.points, 0);
  const trusted = workspace.customers.filter((customer) => customer.trustScore >= 95).length;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric
          label="Punkte im Umlauf"
          value={totalPoints.toLocaleString("de-DE")}
          note="vollständig simuliert"
          icon={Gift}
          accent="bg-violet-100 text-violet-700"
        />
        <Metric
          label="Trusted Customers"
          value={String(trusted)}
          note="Trust-Score ab 95 %"
          icon={ShieldCheck}
          accent="bg-emerald-100 text-emerald-700"
        />
        <Metric
          label="Standard-Belohnung"
          value="50"
          note="Punkte je abgeschlossenem Termin"
          icon={Sparkles}
          accent="bg-amber-100 text-amber-700"
        />
      </div>
      <Panel className="overflow-hidden">
        <div className="border-b border-[rgba(79,52,81,0.08)] px-5 py-4">
          <h2 className="font-semibold text-[#2c2230]">Kunden-Bonusprogramm</h2>
          <p className="mt-1 text-xs text-slate-400">
            Punkte vergeben oder eine Belohnung testweise einlösen.
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-5">Kunde</TableHead>
              <TableHead>Punkte</TableHead>
              <TableHead>Trust</TableHead>
              <TableHead className="pr-5">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...workspace.customers]
              .sort((a, b) => b.points - a.points)
              .map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="px-5 font-medium">{customer.name}</TableCell>
                  <TableCell className="font-semibold text-[#85528d]">{customer.points}</TableCell>
                  <TableCell>{customer.trustScore} %</TableCell>
                  <TableCell className="pr-5">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() =>
                          void mutate(
                            { type: "adjust_points", customerId: customer.id, delta: 50 },
                            "50 Demo-Punkte vergeben.",
                          )
                        }
                      >
                        +50
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        disabled={customer.points < 100}
                        onClick={() =>
                          void mutate(
                            { type: "adjust_points", customerId: customer.id, delta: -100 },
                            "Belohnung für 100 Punkte eingelöst.",
                          )
                        }
                      >
                        100 einlösen
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Panel>
    </div>
  );
}

function Communication({ workspace }: { workspace: WorkspaceData }) {
  return (
    <Panel className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-5">Nachricht</TableHead>
            <TableHead>Empfänger</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-5">Zeitpunkt</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workspace.emailLog.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="px-5 font-medium">{entry.subject}</TableCell>
              <TableCell>{entry.recipient}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    entry.status === "delivered"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : entry.status === "failed"
                        ? "border-rose-200 bg-rose-50 text-rose-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                  }
                >
                  {entry.status === "delivered"
                    ? "Zugestellt"
                    : entry.status === "failed"
                      ? "Fehlgeschlagen"
                      : "Warteschlange"}
                </Badge>
              </TableCell>
              <TableCell className="pr-5 text-slate-500">
                {new Date(entry.createdAt).toLocaleString("de-DE", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Panel>
  );
}

function Billing({ workspace }: { workspace: WorkspaceData }) {
  const limits = [
    ["Mitarbeiter", workspace.staff.length, 10],
    ["Standorte", workspace.locations.length, 3],
    ["Online-Leistungen", workspace.services.filter((service) => service.onlineBookable).length, 50],
  ] as const;
  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <Panel className="bg-gradient-to-br from-[#2c2230] via-[#39283e] to-[#5d3e5c] p-7 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f2c88f]">Aktueller Tarif</p>
        <h2 className="mt-4 text-4xl font-semibold">{workspace.tenant.plan}</h2>
        <p className="mt-3 text-sm leading-6 text-white/60">
          Demo-Abonnement mit den wichtigsten Funktionen für wachsende Beauty-Betriebe.
        </p>
        <p className="mt-8 text-3xl font-semibold">
          99 € <span className="text-sm font-normal text-white/50">/ Monat · Demo</span>
        </p>
      </Panel>
      <Panel className="p-6">
        <h2 className="font-semibold text-[#2c2230]">Nutzung</h2>
        <div className="mt-6 space-y-6">
          {limits.map(([label, current, limit]) => (
            <div key={label}>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-[#2c2230]">{label}</span>
                <span className="text-slate-400">
                  {current} von {limit}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[rgba(79,52,81,0.08)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#9a659f] to-[#af52de]"
                  style={{ width: `${Math.max(5, Math.min(100, (current / limit) * 100))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function PlatformSettings({
  workspace,
  mutate,
  saving,
}: {
  workspace: WorkspaceData;
  mutate: (action: ApiAction, success?: string) => Promise<boolean>;
  saving: boolean;
}) {
  const [name, setName] = useState(workspace.tenant.name);
  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Panel className="p-6">
        <h2 className="font-semibold text-[#2c2230]">Betriebsprofil</h2>
        <div className="mt-6 space-y-5">
          <label className="block">
            <span className="text-sm font-medium text-[#2c2230]">Betriebsname</span>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 h-11 rounded-xl border-[rgba(79,52,81,0.1)]"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-[#2c2230]">Branchenprofil</span>
            <NativeSelect
              value={workspace.tenant.businessType}
              onChange={(event) =>
                void mutate(
                  { type: "set_business_type", businessType: event.target.value },
                  "Branchenprofil gewechselt.",
                )
              }
              className="mt-2 h-11 w-full rounded-xl border-[rgba(79,52,81,0.1)]"
            >
              {Object.entries(businessLabels).map(([value, label]) => (
                <NativeSelectOption key={value} value={value}>
                  {label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
          <div className="flex items-center justify-between rounded-2xl border border-[rgba(79,52,81,0.1)] p-4">
            <div>
              <p className="text-sm font-medium text-[#2c2230]">Onlinebuchung</p>
              <p className="mt-1 text-xs text-slate-400">Buchungswidget für Kunden freigeben</p>
            </div>
            <Switch
              checked={workspace.tenant.bookingEnabled}
              onCheckedChange={(checked) =>
                void mutate(
                  { type: "update_tenant", name, bookingEnabled: checked },
                  "Buchungseinstellung gespeichert.",
                )
              }
            />
          </div>
          <Button
            disabled={saving}
            onClick={() =>
              void mutate(
                {
                  type: "update_tenant",
                  name,
                  bookingEnabled: workspace.tenant.bookingEnabled,
                },
                "Betriebsprofil gespeichert.",
              )
            }
            className="h-11 rounded-full bg-[#9a659f] px-5 font-semibold shadow-[0_8px_20px_rgba(154,101,159,0.2)] hover:bg-[#87538d]"
          >
            Änderungen speichern
          </Button>
        </div>
      </Panel>
      <div className="space-y-6">
        <Panel className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[#2c2230]">Sicherheit</h2>
            <ShieldCheck className="size-5 text-emerald-600" />
          </div>
          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Vertrauenswürdige Geräte</dt>
              <dd className="font-semibold text-[#2c2230]">{workspace.security.trustedDevices}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Blockierte Versuche</dt>
              <dd className="font-semibold text-[#2c2230]">{workspace.security.blockedAttempts}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Widget-Key</dt>
              <dd className="font-mono text-xs text-[#85528d]">{workspace.security.widgetKey}</dd>
            </div>
          </dl>
        </Panel>
        <Panel className="border-rose-100 p-6">
          <h2 className="font-semibold text-[#2c2230]">Demo zurücksetzen</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Entfernt deine Änderungen und stellt die vorbereiteten Beispieldaten wieder her.
          </p>
          <Button
            variant="outline"
            disabled={saving}
            onClick={() => {
              if (window.confirm("Demo wirklich auf den Ausgangszustand zurücksetzen?")) {
                void mutate({ type: "reset_demo" }, "Demo wurde zurückgesetzt.");
              }
            }}
            className="mt-5 rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50"
          >
            <RotateCcw />
            Demo zurücksetzen
          </Button>
        </Panel>
      </div>
    </div>
  );
}

function ActionDialog({
  type,
  workspace,
  saving,
  onClose,
  mutate,
}: {
  type: DialogType;
  workspace: WorkspaceData;
  saving: boolean;
  onClose: () => void;
  mutate: (action: ApiAction, success?: string) => Promise<boolean>;
}) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!type) return;
    const form = new FormData(event.currentTarget);
    let action: ApiAction;
    let success = "Gespeichert.";

    if (type === "customer") {
      action = {
        type: "add_customer",
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone"),
      };
      success = "Kunde wurde angelegt.";
    } else if (type === "staff") {
      action = {
        type: "add_staff",
        name: form.get("name"),
        title: form.get("title"),
        role: form.get("role"),
      };
      success = "Teammitglied wurde hinzugefügt.";
    } else if (type === "service") {
      action = {
        type: "add_service",
        name: form.get("name"),
        category: form.get("category"),
        duration: Number(form.get("duration")),
        priceCents: Math.round(Number(form.get("price")) * 100),
      };
      success = "Leistung wurde angelegt.";
    } else if (type === "location") {
      action = {
        type: "add_location",
        name: form.get("name"),
        address: form.get("address"),
      };
      success = "Standort wurde angelegt.";
    } else if (type === "marketing") {
      action = {
        type: "generate_post",
        title: form.get("title"),
        channel: form.get("channel"),
        goal: form.get("goal"),
        scheduledFor: form.get("scheduledFor"),
      };
      success = "KI-Demo hat einen Entwurf erstellt.";
    } else if (type === "growth-campaign") {
      action = {
        type: "create_growth_campaign",
        name: form.get("name"),
        campaignType: form.get("campaignType"),
        audience: form.get("audience"),
        channel: form.get("channel"),
      };
      success = "Wachstumskampagne wurde als Entwurf angelegt.";
    } else {
      action = {
        type: "create_booking",
        customerId: form.get("customerId"),
        staffId: form.get("staffId"),
        serviceId: form.get("serviceId"),
        locationId: form.get("locationId"),
        date: form.get("date"),
        start: form.get("start"),
        source: type === "widget-appointment" ? "widget" : "dashboard",
      };
      success =
        type === "widget-appointment"
          ? "Demo-Buchung angefragt und im Kalender gespeichert."
          : "Termin wurde gespeichert.";
    }

    if (await mutate(action, success)) onClose();
  }

  const titles: Record<Exclude<DialogType, null>, [string, string]> = {
    appointment: ["Neuen Termin anlegen", "Der Termin wird direkt im Demo-Kalender gespeichert."],
    "widget-appointment": [
      "Buchung aus Kundensicht",
      "Teste den echten Ablauf vom Widget bis zum Kalender.",
    ],
    customer: ["Neuen Kunden anlegen", "Kontaktdaten werden nur in deinem Demo-Betrieb gespeichert."],
    staff: ["Teammitglied hinzufügen", "Rolle und Fachgebiet können später weiter verfeinert werden."],
    service: ["Neue Leistung", "Preis, Dauer und Onlinebuchung werden sofort berücksichtigt."],
    location: ["Standort hinzufügen", "Jeder Standort erhält sein eigenes Zeitraster."],
    marketing: ["KI-Inhalt simulieren", "Der Entwurf wird gespeichert, aber nicht extern veröffentlicht."],
    "growth-campaign": ["Neue Wachstumskampagne", "Zielgruppe, Kanal und Status bleiben in deinem Demo-Betrieb gespeichert."],
  };

  return (
    <Dialog open={Boolean(type)} onOpenChange={(open) => !open && onClose()}>
      {type ? (
        <DialogContent className="max-h-[90svh] overflow-y-auto rounded-[1.75rem] border-black/[0.08] bg-white/95 shadow-[0_30px_90px_rgba(0,0,0,0.2)] backdrop-blur-2xl sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl tracking-[-0.03em] text-[#2c2230]">
              {titles[type][0]}
            </DialogTitle>
            <DialogDescription>{titles[type][1]}</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="mt-2 space-y-4">
            {(type === "appointment" || type === "widget-appointment") && (
              <>
                <SelectField label="Kunde" name="customerId">
                  {workspace.customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </SelectField>
                <SelectField label="Leistung" name="serviceId">
                  {workspace.services
                    .filter((service) => service.onlineBookable)
                    .map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} · {euro(service.priceCents)}
                      </option>
                    ))}
                </SelectField>
                <SelectField label="Team" name="staffId">
                  {workspace.staff
                    .filter((member) => member.active)
                    .map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} · {member.title}
                      </option>
                    ))}
                </SelectField>
                <SelectField label="Standort" name="locationId">
                  {workspace.locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </SelectField>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Datum" name="date" type="date" min={today()} required />
                  <Field label="Uhrzeit" name="start" type="time" required defaultValue="10:00" />
                </div>
              </>
            )}
            {type === "customer" && (
              <>
                <Field label="Name" name="name" placeholder="z. B. Leyla Demir" required />
                <Field label="E-Mail" name="email" type="email" placeholder="leyla@example.de" />
                <Field label="Telefon" name="phone" type="tel" placeholder="+49 …" />
              </>
            )}
            {type === "staff" && (
              <>
                <Field label="Name" name="name" placeholder="Vor- und Nachname" required />
                <Field label="Fachgebiet" name="title" placeholder="z. B. Lashes & Brows" />
                <SelectField label="Rolle" name="role">
                  <option value="staff">Mitarbeiter</option>
                  <option value="manager">Manager</option>
                  <option value="owner">Inhaber</option>
                </SelectField>
              </>
            )}
            {type === "service" && (
              <>
                <Field label="Leistung" name="name" placeholder="z. B. Brow Lifting" required />
                <Field label="Kategorie" name="category" placeholder="z. B. Brows" required />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Dauer in Minuten" name="duration" type="number" min="15" defaultValue="60" required />
                  <Field label="Preis in Euro" name="price" type="number" min="0" step="0.01" defaultValue="59" required />
                </div>
              </>
            )}
            {type === "location" && (
              <>
                <Field label="Bezeichnung" name="name" placeholder="z. B. Studio Barmen" required />
                <Field label="Adresse" name="address" placeholder="Straße, PLZ und Ort" required />
              </>
            )}
            {type === "marketing" && (
              <>
                <Field label="Titel" name="title" placeholder="z. B. Freie Termine am Freitag" required />
                <SelectField label="Kanal" name="channel">
                  <option value="Instagram">Instagram Feed</option>
                  <option value="Story">Instagram Story</option>
                  <option value="Facebook">Facebook</option>
                </SelectField>
                <label className="block">
                  <span className="text-sm font-medium text-[#2c2230]">Ziel und Inhalt</span>
                  <Textarea
                    name="goal"
                    className="mt-2 min-h-28 rounded-xl border-[rgba(79,52,81,0.1)]"
                    placeholder="Was soll der Beitrag erreichen?"
                    required
                  />
                </label>
                <Field label="Geplant für" name="scheduledFor" type="datetime-local" />
              </>
            )}
            {type === "growth-campaign" && (
              <>
                <Field label="Kampagnenname" name="name" placeholder="z. B. Herbst Glow Days" required />
                <SelectField label="Kampagnentyp" name="campaignType">
                  <option value="seasonal">Saisonale Aktion</option>
                  <option value="new_service">Neue Leistung bewerben</option>
                </SelectField>
                <SelectField label="Kanal" name="channel">
                  <option value="E-Mail">E-Mail</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Instagram">Instagram</option>
                </SelectField>
                <Field label="Zielgruppe" name="audience" placeholder="z. B. Kunden mit 3+ Besuchen" required />
              </>
            )}
            <Button
              type="submit"
              disabled={saving}
              className="mt-2 h-11 w-full rounded-full bg-[#9a659f] font-semibold text-white shadow-[0_8px_20px_rgba(154,101,159,0.2)] hover:bg-[#87538d]"
            >
              {saving
                ? "Wird gespeichert …"
                : type === "marketing"
                  ? "Demo-Inhalt generieren"
                  : type === "growth-campaign"
                    ? "Kampagne anlegen"
                  : type === "widget-appointment"
                    ? "Termin anfragen"
                    : "Speichern"}
            </Button>
          </form>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.ComponentProps<typeof Input>) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[#2c2230]">{label}</span>
      <Input {...props} className="mt-2 h-11 rounded-xl border-[rgba(79,52,81,0.1)]" />
    </label>
  );
}

function SelectField({
  label,
  children,
  name,
}: {
  label: string;
  children: ReactNode;
  name: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[#2c2230]">{label}</span>
      <NativeSelect name={name} className="mt-2 h-11 w-full rounded-xl border-[rgba(79,52,81,0.1)]">
        {children}
      </NativeSelect>
    </label>
  );
}
