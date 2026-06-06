export type TourPlacement = "center" | "right" | "left" | "top" | "bottom";

export interface TourStep {
  id: string;
  title: string;
  body: string;
  tips?: string[];
  placement: TourPlacement;
  target?: string | string[];
  route?: string;
}

/**
 * Story order: add a company → log post-call notes → see the brief →
 * track everything on dashboard / memory → research → set thesis.
 */
export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Conviction",
    body: "This is where you track deals and turn messy post-call notes into clear deal briefs. We'll show you the exact steps — starting with adding a company.",
    tips: ["About 2 minutes", "Skip anytime — replay from Settings"],
    placement: "center",
    route: "/companies",
  },
  {
    id: "add-company",
    title: "Step 1 — Add a company",
    body: "Start here. Every founder you're talking to gets a company card. Click Add company, enter the name, and you're ready to log calls.",
    tips: ["One card per company you're tracking"],
    placement: "bottom",
    target: "tour-pipeline-add",
    route: "/companies",
  },
  {
    id: "pipeline",
    title: "Your pipeline",
    body: "All your companies show up here. Search, filter by status, and click any card to open the full deal history.",
    placement: "top",
    target: ["tour-pipeline-list", "tour-pipeline-card"],
    route: "/companies",
  },
  {
    id: "log-call-nav",
    title: "Step 2 — Log a call",
    body: "After every founder call, come here. This is the most important button in the app — always one click away.",
    placement: "right",
    target: "tour-log-call",
    route: "/companies",
  },
  {
    id: "log-call-modes",
    title: "Three ways to capture notes",
    body: "Pick what works for you after a call: type a quick brain dump, record a short voice memo, or upload the full meeting audio from Zoom or Otter.",
    placement: "bottom",
    target: "tour-log-call-modes",
    route: "/calls/new",
  },
  {
    id: "log-call-company",
    title: "Pick the company",
    body: "Select which company the call was with. Then add your raw notes or recording below — messy is fine, that's the point.",
    placement: "top",
    target: "tour-log-call-company",
    route: "/calls/new",
  },
  {
    id: "log-call-process",
    title: "Get your deal brief",
    body: "Hit Process when you're done. Conviction pulls out strengths, concerns, thesis fit, follow-ups, and a draft email — ready in under a minute.",
    placement: "top",
    target: "tour-log-call-flow",
    route: "/calls/new",
  },
  {
    id: "company-detail",
    title: "See everything in one place",
    body: "Open any company to see the full picture — latest recommendation, call history, memory, and follow-ups. This is your deal room.",
    placement: "bottom",
    target: ["tour-company-decision", "tour-company-header"],
    route: "/companies/__first__",
  },
  {
    id: "dashboard-kpis",
    title: "Your home base",
    body: "The dashboard shows your deal flow at a glance — how many companies you're tracking, calls logged, and open decisions.",
    placement: "bottom",
    target: "tour-dashboard-kpis",
    route: "/dashboard",
  },
  {
    id: "dashboard-followups",
    title: "Follow-ups you can't miss",
    body: "After each call, action items land here automatically. Overdue ones show in red so nothing slips before your next partner meeting.",
    placement: "top",
    target: "tour-dashboard-followups",
    route: "/dashboard",
  },
  {
    id: "memory",
    title: "Nothing gets forgotten",
    body: "Every insight and decision is saved on a timeline. Come back months later and know exactly what you thought and why.",
    placement: "top",
    target: ["tour-memory-timeline", "tour-memory-page"],
    route: "/memory",
  },
  {
    id: "research",
    title: "Research before you meet",
    body: "Haven't spoken to the founder yet? Enter a name and website to get a full brief. Past reports stay in the list on the left.",
    placement: "right",
    target: ["tour-research-form", "tour-research-history"],
    route: "/startup-intelligence",
  },
  {
    id: "settings-thesis",
    title: "Tell us how you invest",
    body: "Set your fund name, sectors, and thesis. Every company gets scored against how you actually invest — not a generic checklist.",
    placement: "top",
    target: "tour-settings-thesis",
    route: "/settings",
  },
  {
    id: "finish",
    title: "You're all set",
    body: "That's the full loop: add a company, log your post-call dump, get a brief. Explore the sample data or sign in to use your own workspace.",
    tips: ["Replay this tour anytime in Settings"],
    placement: "center",
    route: "/dashboard",
  },
];
