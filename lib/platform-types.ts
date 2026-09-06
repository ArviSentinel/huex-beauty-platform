export type BusinessType =
  | "beauty"
  | "hair"
  | "barber"
  | "nails"
  | "lashes"
  | "cosmetics"
  | "wellness"
  | "tattoo";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type Tenant = {
  id: string;
  name: string;
  businessType: BusinessType;
  plan: "Starter" | "Pro" | "Business";
  timezone: string;
  demoExpiresAt: string;
  bookingEnabled: boolean;
};

export type Location = {
  id: string;
  name: string;
  address: string;
  timezone: string;
  slotMinutes: number;
};

export type Staff = {
  id: string;
  name: string;
  role: "owner" | "manager" | "staff";
  title: string;
  color: string;
  locationIds: string[];
  active: boolean;
};

export type Service = {
  id: string;
  category: string;
  name: string;
  duration: number;
  buffer: number;
  priceCents: number;
  staffIds: string[];
  onlineBookable: boolean;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  visits: number;
  points: number;
  trustScore: number;
  lastVisit: string;
};

export type Booking = {
  id: string;
  customerId: string;
  staffId: string;
  serviceId: string;
  locationId: string;
  date: string;
  start: string;
  duration: number;
  priceCents: number;
  status: BookingStatus;
  source: "widget" | "dashboard" | "phone";
  createdAt: string;
  pointsAwarded?: boolean;
  noShowRecorded?: boolean;
};

export type BookingEvent = {
  id: string;
  bookingId: string;
  event: "created" | "status_changed";
  detail: string;
  createdAt: string;
};

export type MarketingPost = {
  id: string;
  title: string;
  channel: "Instagram" | "Facebook" | "Story";
  copy: string;
  status: "draft" | "scheduled" | "published";
  scheduledFor: string;
  simulated: true;
};

export type EmailLog = {
  id: string;
  subject: string;
  recipient: string;
  status: "delivered" | "queued" | "failed";
  createdAt: string;
};

export type GrowthCampaign = {
  id: string;
  type: "gap_fill" | "winback" | "seasonal" | "new_service";
  name: string;
  audience: string;
  channel: "WhatsApp" | "E-Mail" | "Instagram";
  status: "draft" | "active" | "completed";
  sent: number;
  bookings: number;
  revenueCents: number;
  createdAt: string;
};

export type Referral = {
  id: string;
  referrerCustomerId: string;
  referredName: string;
  status: "invited" | "booked" | "completed";
  rewardPoints: number;
  createdAt: string;
};

export type ReviewRequest = {
  id: string;
  customerId: string;
  status: "queued" | "sent" | "received";
  rating?: number;
  createdAt: string;
};

export type WorkspaceData = {
  tenant: Tenant;
  locations: Location[];
  staff: Staff[];
  services: Service[];
  customers: Customer[];
  bookings: Booking[];
  bookingEvents: BookingEvent[];
  marketingPosts: MarketingPost[];
  emailLog: EmailLog[];
  growthCampaigns: GrowthCampaign[];
  referrals: Referral[];
  reviewRequests: ReviewRequest[];
  security: {
    trustedDevices: number;
    blockedAttempts: number;
    widgetKey: string;
  };
};
