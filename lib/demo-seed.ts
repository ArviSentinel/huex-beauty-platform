import type {
  Booking,
  BusinessType,
  Customer,
  Service,
  Staff,
  WorkspaceData,
} from "@/lib/platform-types";

function day(offset: number) {
  const value = new Date();
  value.setDate(value.getDate() + offset);
  return value.toISOString().slice(0, 10);
}

const staff: Staff[] = [
  {
    id: "staff-aya",
    name: "Demo Team 1",
    role: "owner",
    title: "Inhaberin · Hair & Color",
    color: "#7c3aed",
    locationIds: ["loc-main"],
    active: true,
  },
  {
    id: "staff-mira",
    name: "Demo Team 2",
    role: "manager",
    title: "Studioleitung · Nails",
    color: "#db2777",
    locationIds: ["loc-main"],
    active: true,
  },
  {
    id: "staff-leila",
    name: "Demo Team 3",
    role: "staff",
    title: "Lashes & Brows",
    color: "#0891b2",
    locationIds: ["loc-main"],
    active: true,
  },
  {
    id: "staff-samira",
    name: "Demo Team 4",
    role: "staff",
    title: "Skin & Beauty",
    color: "#ca8a04",
    locationIds: ["loc-main"],
    active: true,
  },
];

const services: Service[] = [
  {
    id: "svc-cut",
    category: "Haare",
    name: "Cut & Finish",
    duration: 60,
    buffer: 10,
    priceCents: 5900,
    staffIds: ["staff-aya"],
    onlineBookable: true,
  },
  {
    id: "svc-color",
    category: "Haare",
    name: "Balayage Signature",
    duration: 180,
    buffer: 20,
    priceCents: 18900,
    staffIds: ["staff-aya"],
    onlineBookable: true,
  },
  {
    id: "svc-nails",
    category: "Nägel",
    name: "Gelmodellage",
    duration: 90,
    buffer: 10,
    priceCents: 6900,
    staffIds: ["staff-mira"],
    onlineBookable: true,
  },
  {
    id: "svc-lashes",
    category: "Wimpern",
    name: "Lash Lifting",
    duration: 75,
    buffer: 10,
    priceCents: 6500,
    staffIds: ["staff-leila"],
    onlineBookable: true,
  },
  {
    id: "svc-facial",
    category: "Kosmetik",
    name: "Glow Facial",
    duration: 60,
    buffer: 15,
    priceCents: 8900,
    staffIds: ["staff-samira"],
    onlineBookable: true,
  },
];

const customers: Customer[] = [
  { id: "cus-1", name: "Demo-Kundin 01", email: "", phone: "", visits: 8, points: 420, trustScore: 98, lastVisit: day(-4) },
  { id: "cus-2", name: "Demo-Kundin 02", email: "", phone: "", visits: 5, points: 270, trustScore: 94, lastVisit: day(-8) },
  { id: "cus-3", name: "Demo-Kundin 03", email: "", phone: "", visits: 11, points: 610, trustScore: 100, lastVisit: day(-2) },
  { id: "cus-4", name: "Demo-Kundin 04", email: "", phone: "", visits: 2, points: 80, trustScore: 86, lastVisit: day(-18) },
  { id: "cus-5", name: "Demo-Kundin 05", email: "", phone: "", visits: 6, points: 315, trustScore: 96, lastVisit: day(-6) },
  { id: "cus-6", name: "Demo-Kundin 06", email: "", phone: "", visits: 1, points: 50, trustScore: 100, lastVisit: day(-1) },
];

const bookingSeed: Array<[string, string, string, number, string, Booking["status"]]> = [
  ["cus-1", "staff-aya", "svc-cut", 0, "09:00", "confirmed"],
  ["cus-2", "staff-mira", "svc-nails", 0, "10:00", "confirmed"],
  ["cus-3", "staff-leila", "svc-lashes", 0, "11:30", "pending"],
  ["cus-4", "staff-samira", "svc-facial", 0, "13:00", "confirmed"],
  ["cus-5", "staff-aya", "svc-color", 1, "09:30", "confirmed"],
  ["cus-6", "staff-mira", "svc-nails", 1, "14:00", "pending"],
  ["cus-4", "staff-samira", "svc-facial", 2, "16:00", "cancelled"],
  ["cus-1", "staff-leila", "svc-lashes", -1, "12:00", "completed"],
  ["cus-2", "staff-samira", "svc-facial", -2, "15:00", "no_show"],
];

const businessNames: Record<BusinessType, string> = {
  beauty: "Élan Beauty House",
  hair: "Élan Hair Studio",
  barber: "Élan Barber Studio",
  nails: "Élan Nail Atelier",
  lashes: "Élan Lash Studio",
  cosmetics: "Élan Skin Studio",
  wellness: "Élan Wellness",
  tattoo: "Élan Ink Studio",
};

export function createSeedWorkspace(type: BusinessType = "beauty"): WorkspaceData {
  const bookings: Booking[] = bookingSeed.map(([customerId, staffId, serviceId, offset, start, status], index) => {
    const service = services.find((item) => item.id === serviceId)!;
    return {
      id: `book-${index + 1}`,
      customerId,
      staffId,
      serviceId,
      locationId: "loc-main",
      date: day(offset),
      start,
      duration: service.duration,
      priceCents: service.priceCents,
      status,
      source: index % 2 ? "widget" : "dashboard",
      createdAt: new Date().toISOString(),
      pointsAwarded: status === "completed",
      noShowRecorded: status === "no_show",
    };
  });

  return {
    tenant: {
      id: "tenant-demo",
      name: businessNames[type],
      businessType: type,
      plan: "Pro",
      timezone: "Europe/Berlin",
      demoExpiresAt: day(14),
      bookingEnabled: true,
    },
    locations: [
      {
        id: "loc-main",
        name: "Hauptstudio",
        address: "Demo-Standort, Wuppertal",
        timezone: "Europe/Berlin",
        slotMinutes: 15,
      },
    ],
    staff,
    services,
    customers,
    bookings,
    bookingEvents: bookings.map((booking) => ({
      id: `event-${booking.id}`,
      bookingId: booking.id,
      event: "created" as const,
      detail: "Demo-Termin angelegt",
      createdAt: booking.createdAt,
    })),
    marketingPosts: [
      {
        id: "post-1",
        title: "Freie Termine am Freitag",
        channel: "Instagram",
        copy: "Dein Beauty-Moment wartet: Am Freitag sind zwei Termine frei geworden. Sichere dir jetzt deine Auszeit.",
        status: "scheduled",
        scheduledFor: `${day(2)}T18:00`,
        simulated: true,
      },
      {
        id: "post-2",
        title: "Team Spotlight",
        channel: "Story",
        copy: "Lerne unser Demo-Team kennen – spezialisiert auf Lashes & Brows.",
        status: "draft",
        scheduledFor: `${day(4)}T12:00`,
        simulated: true,
      },
    ],
    emailLog: [
      { id: "mail-1", subject: "Terminbestätigung", recipient: "Demo-Kundin 01", status: "delivered", createdAt: new Date().toISOString() },
      { id: "mail-2", subject: "Terminerinnerung", recipient: "Demo-Kundin 02", status: "queued", createdAt: new Date().toISOString() },
    ],
    growthCampaigns: [
      {
        id: "campaign-1",
        type: "seasonal",
        name: "September Glow",
        audience: "Stammkundinnen mit 3+ Besuchen",
        channel: "E-Mail",
        status: "active",
        sent: 48,
        bookings: 7,
        revenueCents: 48300,
        createdAt: new Date().toISOString(),
      },
    ],
    referrals: [
      {
        id: "referral-1",
        referrerCustomerId: "cus-3",
        referredName: "Demo-Empfehlung 01",
        status: "booked",
        rewardPoints: 150,
        createdAt: new Date().toISOString(),
      },
    ],
    reviewRequests: [
      {
        id: "review-1",
        customerId: "cus-1",
        status: "received",
        rating: 5,
        createdAt: new Date().toISOString(),
      },
    ],
    security: {
      trustedDevices: 2,
      blockedAttempts: 7,
      widgetKey: "pk_live_demo_••••7K2M",
    },
  };
}
