import { eq } from "drizzle-orm";

import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { demoWorkspaces } from "@/db/schema";
import { createSeedWorkspace } from "@/lib/demo-seed";
import type {
  Booking,
  BookingStatus,
  BusinessType,
  WorkspaceData,
} from "@/lib/platform-types";

export const dynamic = "force-dynamic";

type Action =
  | { type: "reset_demo" }
  | { type: "set_business_type"; businessType: BusinessType }
  | { type: "update_tenant"; name: string; bookingEnabled: boolean }
  | { type: "add_customer"; name: string; email: string; phone: string }
  | { type: "add_staff"; name: string; title: string; role: "owner" | "manager" | "staff" }
  | { type: "toggle_staff"; id: string }
  | { type: "add_service"; name: string; category: string; duration: number; priceCents: number }
  | { type: "toggle_service"; id: string }
  | { type: "add_location"; name: string; address: string }
  | {
      type: "create_booking";
      customerId: string;
      staffId: string;
      serviceId: string;
      locationId: string;
      date: string;
      start: string;
      source: Booking["source"];
    }
  | { type: "update_booking_status"; id: string; status: BookingStatus }
  | { type: "adjust_points"; customerId: string; delta: number }
  | {
      type: "generate_post";
      title: string;
      channel: "Instagram" | "Facebook" | "Story";
      goal: string;
      scheduledFor: string;
    }
  | { type: "update_post_status"; id: string; status: "draft" | "scheduled" | "published" }
  | { type: "launch_gap_campaign"; bookingId: string; customerId: string }
  | { type: "launch_winback"; customerId: string }
  | { type: "create_referral"; referrerCustomerId: string; referredName: string }
  | { type: "complete_referral"; id: string }
  | { type: "send_review_request"; customerId: string }
  | { type: "receive_review"; id: string; rating: number }
  | {
      type: "create_growth_campaign";
      name: string;
      campaignType: "seasonal" | "new_service";
      audience: string;
      channel: "WhatsApp" | "E-Mail" | "Instagram";
    }
  | { type: "update_growth_campaign"; id: string; status: "draft" | "active" | "completed" };

function clean(value: unknown, max = 160) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

async function ensureWorkspace(userId: string, email: string) {
  const db = getDb();
  const existing = await db
    .select()
    .from(demoWorkspaces)
    .where(eq(demoWorkspaces.ownerUserId, userId))
    .limit(1);

  if (existing[0]) {
    const parsed = JSON.parse(existing[0].data) as WorkspaceData;
    const seed = createSeedWorkspace(parsed.tenant.businessType);
    const hasDemoGap = parsed.bookings.some(
      (booking) => booking.status === "cancelled" && booking.date >= new Date().toISOString().slice(0, 10),
    );
    return {
      rowId: existing[0].id,
      revision: existing[0].revision,
      workspace: {
        ...parsed,
        bookings: hasDemoGap
          ? parsed.bookings
          : [
              ...parsed.bookings,
              {
                ...seed.bookings.find((booking) => booking.status === "cancelled")!,
                id: "demo-growth-gap",
              },
            ],
        growthCampaigns: parsed.growthCampaigns ?? seed.growthCampaigns,
        referrals: parsed.referrals ?? seed.referrals,
        reviewRequests: parsed.reviewRequests ?? seed.reviewRequests,
      },
    };
  }

  const rowId = crypto.randomUUID();
  const workspace = createSeedWorkspace();
  await db.insert(demoWorkspaces).values({
    id: rowId,
    ownerUserId: userId,
    ownerEmail: email,
    data: JSON.stringify(workspace),
  });
  return { rowId, revision: 1, workspace };
}

async function persist(rowId: string, revision: number, workspace: WorkspaceData) {
  const db = getDb();
  await db
    .update(demoWorkspaces)
    .set({
      data: JSON.stringify(workspace),
      updatedAt: new Date().toISOString(),
      revision: revision + 1,
    })
    .where(eq(demoWorkspaces.id, rowId));
}

function minutes(value: string) {
  const [hours, mins] = value.split(":").map(Number);
  return hours * 60 + mins;
}

function assertNoOverlap(workspace: WorkspaceData, booking: Booking) {
  const nextStart = minutes(booking.start);
  const nextEnd = nextStart + booking.duration;
  const conflict = workspace.bookings.some((existing) => {
    if (
      existing.staffId !== booking.staffId ||
      existing.date !== booking.date ||
      !["pending", "confirmed"].includes(existing.status)
    ) {
      return false;
    }
    const existingStart = minutes(existing.start);
    return nextStart < existingStart + existing.duration && existingStart < nextEnd;
  });
  if (conflict) {
    throw new Error("Dieser Mitarbeiter ist zu dieser Zeit bereits gebucht.");
  }
}

function marketingCopy(goal: string, businessName: string) {
  const subject = clean(goal, 220) || "freie Termine";
  return `${businessName} · ${subject}\n\nEin Moment nur für dich. Entdecke deinen nächsten Termin und buche direkt online. Persönlich, unkompliziert und genau passend zu deinem Alltag.\n\n#beauty #selfcare #wuppertal #termin`;
}

function applyAction(workspace: WorkspaceData, action: Action): WorkspaceData {
  if (action.type === "reset_demo") return createSeedWorkspace(workspace.tenant.businessType);

  if (action.type === "set_business_type") {
    const fresh = createSeedWorkspace(action.businessType);
    return {
      ...workspace,
      tenant: {
        ...workspace.tenant,
        businessType: action.businessType,
        name: fresh.tenant.name,
      },
    };
  }

  if (action.type === "update_tenant") {
    const name = clean(action.name, 100);
    if (!name) throw new Error("Bitte gib einen Betriebsnamen ein.");
    return {
      ...workspace,
      tenant: { ...workspace.tenant, name, bookingEnabled: Boolean(action.bookingEnabled) },
    };
  }

  if (action.type === "add_customer") {
    const name = clean(action.name, 100);
    const email = clean(action.email, 160).toLowerCase();
    const phone = clean(action.phone, 40);
    if (!name || (!email && !phone)) {
      throw new Error("Name und mindestens eine Kontaktmöglichkeit sind erforderlich.");
    }
    if (
      workspace.customers.some(
        (customer) =>
          (email && customer.email.toLowerCase() === email) ||
          (phone && customer.phone === phone),
      )
    ) {
      throw new Error("Ein Kunde mit diesen Kontaktdaten existiert bereits.");
    }
    return {
      ...workspace,
      customers: [
        {
          id: crypto.randomUUID(),
          name,
          email,
          phone,
          visits: 0,
          points: 0,
          trustScore: 100,
          lastVisit: "Noch kein Besuch",
        },
        ...workspace.customers,
      ],
    };
  }

  if (action.type === "add_staff") {
    const name = clean(action.name, 100);
    if (!name) throw new Error("Bitte gib einen Namen ein.");
    return {
      ...workspace,
      staff: [
        ...workspace.staff,
        {
          id: crypto.randomUUID(),
          name,
          title: clean(action.title, 100) || "Beauty Professional",
          role: action.role,
          color: ["#7c3aed", "#db2777", "#0891b2", "#ca8a04"][workspace.staff.length % 4],
          locationIds: [workspace.locations[0]?.id].filter(Boolean),
          active: true,
        },
      ],
    };
  }

  if (action.type === "toggle_staff") {
    return {
      ...workspace,
      staff: workspace.staff.map((member) =>
        member.id === action.id ? { ...member, active: !member.active } : member,
      ),
    };
  }

  if (action.type === "add_service") {
    const name = clean(action.name, 120);
    if (!name || action.duration < 15 || action.priceCents < 0) {
      throw new Error("Bitte prüfe Name, Dauer und Preis.");
    }
    return {
      ...workspace,
      services: [
        ...workspace.services,
        {
          id: crypto.randomUUID(),
          name,
          category: clean(action.category, 80) || "Weitere Leistungen",
          duration: Math.min(480, Math.round(action.duration)),
          buffer: 10,
          priceCents: Math.round(action.priceCents),
          staffIds: workspace.staff.filter((member) => member.active).map((member) => member.id),
          onlineBookable: true,
        },
      ],
    };
  }

  if (action.type === "toggle_service") {
    return {
      ...workspace,
      services: workspace.services.map((service) =>
        service.id === action.id
          ? { ...service, onlineBookable: !service.onlineBookable }
          : service,
      ),
    };
  }

  if (action.type === "add_location") {
    const name = clean(action.name, 100);
    const address = clean(action.address, 180);
    if (!name || !address) throw new Error("Name und Adresse sind erforderlich.");
    return {
      ...workspace,
      locations: [
        ...workspace.locations,
        {
          id: crypto.randomUUID(),
          name,
          address,
          timezone: workspace.tenant.timezone,
          slotMinutes: 15,
        },
      ],
    };
  }

  if (action.type === "create_booking") {
    const service = workspace.services.find((item) => item.id === action.serviceId);
    const member = workspace.staff.find((item) => item.id === action.staffId);
    const customer = workspace.customers.find((item) => item.id === action.customerId);
    const location = workspace.locations.find((item) => item.id === action.locationId);
    if (!service || !service.onlineBookable || !member?.active || !customer || !location) {
      throw new Error("Die gewählte Kombination ist nicht verfügbar.");
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(action.date) || !/^\d{2}:\d{2}$/.test(action.start)) {
      throw new Error("Bitte wähle Datum und Uhrzeit.");
    }
    if (service.staffIds.length && !service.staffIds.includes(member.id)) {
      throw new Error("Dieser Mitarbeiter bietet die Leistung nicht an.");
    }
    const booking: Booking = {
      id: crypto.randomUUID(),
      customerId: customer.id,
      staffId: member.id,
      serviceId: service.id,
      locationId: location.id,
      date: action.date,
      start: action.start,
      duration: service.duration + service.buffer,
      priceCents: service.priceCents,
      status: action.source === "widget" ? "pending" : "confirmed",
      source: action.source,
      createdAt: new Date().toISOString(),
      pointsAwarded: false,
      noShowRecorded: false,
    };
    assertNoOverlap(workspace, booking);
    return {
      ...workspace,
      bookings: [booking, ...workspace.bookings],
      bookingEvents: [
        {
          id: crypto.randomUUID(),
          bookingId: booking.id,
          event: "created",
          detail: `Termin über ${action.source} angelegt`,
          createdAt: new Date().toISOString(),
        },
        ...workspace.bookingEvents,
      ],
      emailLog: [
        {
          id: crypto.randomUUID(),
          subject: action.source === "widget" ? "Terminanfrage eingegangen" : "Terminbestätigung",
          recipient: customer.name,
          status: "queued",
          createdAt: new Date().toISOString(),
        },
        ...workspace.emailLog,
      ],
    };
  }

  if (action.type === "update_booking_status") {
    const previous = workspace.bookings.find((booking) => booking.id === action.id);
    if (!previous) throw new Error("Termin nicht gefunden.");
    const customers = workspace.customers.map((customer) => {
      if (customer.id !== previous.customerId || previous.status === action.status) return customer;
      if (action.status === "completed" && !previous.pointsAwarded) {
        return {
          ...customer,
          visits: customer.visits + 1,
          points: customer.points + 50,
          trustScore: Math.min(100, customer.trustScore + 2),
          lastVisit: previous.date,
        };
      }
      if (action.status === "no_show" && !previous.noShowRecorded) {
        return { ...customer, trustScore: Math.max(0, customer.trustScore - 12) };
      }
      return customer;
    });
    return {
      ...workspace,
      customers,
      bookings: workspace.bookings.map((booking) =>
        booking.id === action.id
          ? {
              ...booking,
              status: action.status,
              pointsAwarded: booking.pointsAwarded || action.status === "completed",
              noShowRecorded: booking.noShowRecorded || action.status === "no_show",
            }
          : booking,
      ),
      bookingEvents: [
        {
          id: crypto.randomUUID(),
          bookingId: previous.id,
          event: "status_changed",
          detail: `Status von ${previous.status} auf ${action.status} geändert`,
          createdAt: new Date().toISOString(),
        },
        ...workspace.bookingEvents,
      ],
    };
  }

  if (action.type === "adjust_points") {
    const delta = Math.max(-5000, Math.min(5000, Math.round(action.delta)));
    return {
      ...workspace,
      customers: workspace.customers.map((customer) =>
        customer.id === action.customerId
          ? { ...customer, points: Math.max(0, customer.points + delta) }
          : customer,
      ),
    };
  }

  if (action.type === "generate_post") {
    const title = clean(action.title, 120) || "Neuer Beitrag";
    return {
      ...workspace,
      marketingPosts: [
        {
          id: crypto.randomUUID(),
          title,
          channel: action.channel,
          copy: marketingCopy(action.goal, workspace.tenant.name),
          status: action.scheduledFor ? "scheduled" : "draft",
          scheduledFor: clean(action.scheduledFor, 40),
          simulated: true,
        },
        ...workspace.marketingPosts,
      ],
    };
  }

  if (action.type === "update_post_status") {
    return {
      ...workspace,
      marketingPosts: workspace.marketingPosts.map((post) =>
        post.id === action.id ? { ...post, status: action.status } : post,
      ),
    };
  }

  if (action.type === "launch_gap_campaign") {
    const gap = workspace.bookings.find(
      (booking) => booking.id === action.bookingId && booking.status === "cancelled",
    );
    const customer = workspace.customers.find((item) => item.id === action.customerId);
    if (!gap || !customer) throw new Error("Lücke oder Kunde wurde nicht gefunden.");
    const service = workspace.services.find((item) => item.id === gap.serviceId);
    const replacement: Booking = {
      ...gap,
      id: crypto.randomUUID(),
      customerId: customer.id,
      status: "confirmed",
      source: "dashboard",
      createdAt: new Date().toISOString(),
      pointsAwarded: false,
      noShowRecorded: false,
    };
    assertNoOverlap(workspace, replacement);
    return {
      ...workspace,
      bookings: [replacement, ...workspace.bookings],
      bookingEvents: [
        {
          id: crypto.randomUUID(),
          bookingId: replacement.id,
          event: "created",
          detail: "Freie Lücke über den intelligenten Lückenfüller besetzt",
          createdAt: new Date().toISOString(),
        },
        ...workspace.bookingEvents,
      ],
      growthCampaigns: [
        {
          id: crypto.randomUUID(),
          type: "gap_fill",
          name: `Lückenfüller · ${prettyCampaignDate(gap.date)} ${gap.start}`,
          audience: `12 passende Kundinnen für ${service?.name ?? "diesen Termin"}`,
          channel: "WhatsApp",
          status: "completed",
          sent: 12,
          bookings: 1,
          revenueCents: gap.priceCents,
          createdAt: new Date().toISOString(),
        },
        ...workspace.growthCampaigns,
      ],
      emailLog: [
        {
          id: crypto.randomUUID(),
          subject: "Last-Minute-Termin (Demo)",
          recipient: customer.name,
          status: "delivered",
          createdAt: new Date().toISOString(),
        },
        ...workspace.emailLog,
      ],
    };
  }

  if (action.type === "launch_winback") {
    const customer = workspace.customers.find((item) => item.id === action.customerId);
    if (!customer) throw new Error("Kunde wurde nicht gefunden.");
    return {
      ...workspace,
      growthCampaigns: [
        {
          id: crypto.randomUUID(),
          type: "winback",
          name: `Comeback für ${customer.name}`,
          audience: customer.name,
          channel: "E-Mail",
          status: "active",
          sent: 1,
          bookings: 0,
          revenueCents: 0,
          createdAt: new Date().toISOString(),
        },
        ...workspace.growthCampaigns,
      ],
      emailLog: [
        {
          id: crypto.randomUUID(),
          subject: "Wir vermissen dich – dein persönlicher Beauty-Moment (Demo)",
          recipient: customer.name,
          status: "queued",
          createdAt: new Date().toISOString(),
        },
        ...workspace.emailLog,
      ],
    };
  }

  if (action.type === "create_referral") {
    const customer = workspace.customers.find((item) => item.id === action.referrerCustomerId);
    const referredName = clean(action.referredName, 100);
    if (!customer || !referredName) throw new Error("Bitte wähle einen Kunden und gib einen Namen ein.");
    return {
      ...workspace,
      referrals: [
        {
          id: crypto.randomUUID(),
          referrerCustomerId: customer.id,
          referredName,
          status: "invited",
          rewardPoints: 150,
          createdAt: new Date().toISOString(),
        },
        ...workspace.referrals,
      ],
    };
  }

  if (action.type === "complete_referral") {
    const referral = workspace.referrals.find((item) => item.id === action.id);
    if (!referral) throw new Error("Empfehlung wurde nicht gefunden.");
    if (referral.status === "completed") return workspace;
    return {
      ...workspace,
      referrals: workspace.referrals.map((item) =>
        item.id === referral.id ? { ...item, status: "completed" as const } : item,
      ),
      customers: workspace.customers.map((customer) =>
        customer.id === referral.referrerCustomerId
          ? { ...customer, points: customer.points + referral.rewardPoints }
          : customer,
      ),
    };
  }

  if (action.type === "send_review_request") {
    const customer = workspace.customers.find((item) => item.id === action.customerId);
    if (!customer) throw new Error("Kunde wurde nicht gefunden.");
    return {
      ...workspace,
      reviewRequests: [
        {
          id: crypto.randomUUID(),
          customerId: customer.id,
          status: "sent",
          createdAt: new Date().toISOString(),
        },
        ...workspace.reviewRequests,
      ],
      emailLog: [
        {
          id: crypto.randomUUID(),
          subject: "Wie war dein Besuch? (Demo)",
          recipient: customer.name,
          status: "delivered",
          createdAt: new Date().toISOString(),
        },
        ...workspace.emailLog,
      ],
    };
  }

  if (action.type === "receive_review") {
    const rating = Math.max(1, Math.min(5, Math.round(action.rating)));
    return {
      ...workspace,
      reviewRequests: workspace.reviewRequests.map((request) =>
        request.id === action.id ? { ...request, status: "received" as const, rating } : request,
      ),
    };
  }

  if (action.type === "create_growth_campaign") {
    const name = clean(action.name, 120);
    const audience = clean(action.audience, 180);
    if (!name || !audience) throw new Error("Name und Zielgruppe sind erforderlich.");
    return {
      ...workspace,
      growthCampaigns: [
        {
          id: crypto.randomUUID(),
          type: action.campaignType,
          name,
          audience,
          channel: action.channel,
          status: "draft",
          sent: 0,
          bookings: 0,
          revenueCents: 0,
          createdAt: new Date().toISOString(),
        },
        ...workspace.growthCampaigns,
      ],
    };
  }

  if (action.type === "update_growth_campaign") {
    return {
      ...workspace,
      growthCampaigns: workspace.growthCampaigns.map((campaign) =>
        campaign.id === action.id ? { ...campaign, status: action.status } : campaign,
      ),
    };
  }

  return workspace;
}

function prettyCampaignDate(value: string) {
  return value.split("-").reverse().join(".");
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  try {
    const result = await ensureWorkspace(user.id, user.email);
    return Response.json({ workspace: result.workspace });
  } catch (error) {
    console.error("workspace:get", error);
    return Response.json({ error: "Demo-Daten konnten nicht geladen werden." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
  try {
    const action = (await request.json()) as Action;
    const result = await ensureWorkspace(user.id, user.email);
    const workspace = applyAction(result.workspace, action);
    await persist(result.rowId, result.revision, workspace);
    return Response.json({ workspace });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Aktion fehlgeschlagen.";
    return Response.json({ error: message }, { status: 400 });
  }
}
