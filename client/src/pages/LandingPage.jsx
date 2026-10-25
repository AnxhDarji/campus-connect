import { Link } from "react-router-dom";
import ThemePreference from "../components/ThemePreference";
import PageTransition from "../components/PageTransition";
import {
  CalendarIcon,
  DocumentAddIcon,
  UserIcon,
} from "@solar-icons/react/linear";


const FEATURES = [
  {
    Icon: CalendarIcon,
    label: "Campus Events",
    desc: "Explore upcoming and past events published through the portal.",
  },
  {
    Icon: DocumentAddIcon,
    label: "Event Requests",
    desc: "Submit new event requests and track their approval status.",
  },
  {
    Icon: UserIcon,
    label: "Your Account",
    desc: "Manage your profile and university account information.",
  },
];

const TEAM = [
  { name: "Kalp Patel",       role: "Backend / API Developer" },
  { name: "Anshkumar Darji",  role: "Full-Stack Developer (AI Integration)" },
  { name: "Krrish Bardwaj",   role: "Backend / Authentication Developer" },
  { name: "Jash Baldha",      role: "Full-Stack Developer" },
];

export default function LandingPage() {
  return (
    <PageTransition>
      <main className="min-h-dvh overflow-x-clip bg-[var(--cc-bg)] text-[var(--cc-text)]">
        {/* ── Header ─────────────────────────────────────────────── */}
        <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-4 py-4 sm:gap-4 sm:px-8 lg:px-12">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src="/CampusConnect_logo.png"
              alt="CampusConnect"
              className="cc-brand-logo"
            />
          </Link>
          <div className="flex items-center gap-3 sm:gap-5">
            <ThemePreference />
            <Link
              to="/login"
              className="max-[360px]:hidden rounded-lg bg-[#2078C0] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] duration-200 hover:bg-[#1a68a8] hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2078C0] focus-visible:ring-offset-2"
            >
              Sign in
            </Link>
          </div>
        </header>

        {/* ── Hero ───────────────────────────────────────────────── */}
        <section className="relative mx-auto grid min-h-[calc(100svh-80px)] w-full max-w-7xl items-center gap-12 px-5 pb-16 pt-10 sm:px-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(19rem,0.88fr)] lg:gap-14 lg:px-12 lg:pb-20 lg:pt-12 xl:gap-20">
          {/* Decorative blobs */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-48 -top-48 h-[520px] w-[520px] rounded-full bg-[#2078C0]/6 blur-3xl dark:bg-[#2078C0]/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-[#48A090]/8 blur-3xl dark:bg-[#48A090]/12"
          />

          {/* Copy */}
          <div className="relative max-w-2xl">
            <span className="inline-flex items-center rounded-full border border-[#2078C0]/20 bg-[#EAF2FB] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2078C0] dark:bg-[#1e3554] dark:border-[#2078C0]/30 dark:text-[#5ab0f0]">
              CHARUSAT Campus Portal
            </span>
            <h1 className="mt-5 font-heading text-4xl font-bold leading-[1.12] tracking-tight text-[var(--cc-text)] sm:text-5xl lg:text-6xl">
              Campus activities,
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-[#2078C0] to-[#48A090] bg-clip-text text-transparent">
                connected in one place.
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-[var(--cc-muted)]">
              Browse campus events, submit an event request, and keep track of
              your submissions — all with your university account.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/signup"
                className="rounded-lg bg-[#2078C0] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] duration-200 hover:bg-[#1a68a8] hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2078C0] focus-visible:ring-offset-2"
              >
                Create an account
              </Link>
              <Link
                to="/login"
                className="rounded-lg border border-[var(--cc-border)] bg-[var(--cc-surface)] px-6 py-3 text-sm font-semibold text-[var(--cc-text)] shadow-sm transition-[background-color,border-color,box-shadow,transform] duration-200 hover:border-[#2078C0]/40 hover:bg-[var(--cc-raised)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2078C0] focus-visible:ring-offset-2"
              >
                Sign in
              </Link>
            </div>
          </div>

          {/* Feature cards */}
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--cc-muted)]">
              On CampusConnect
            </p>
            <ul className="mt-4 space-y-3">
              {FEATURES.map(({ Icon, label, desc }) => (
                <li
                  key={label}
                  className="flex items-start gap-4 rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <span className="cc-landing-feature-icon" aria-hidden="true">
                    <Icon size={18} strokeWidth={1.8} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[var(--cc-text)]">
                      {label}
                    </p>
                    <p className="mt-0.5 text-xs leading-5 text-[var(--cc-muted)]">
                      {desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-[var(--cc-muted)]">
              For CHARUSAT students and faculty.
            </p>
          </div>
        </section>

        {/* ── Video Section ───────────────────────────────────────── */}
        <section className="relative w-full overflow-hidden" style={{ height: "100svh" }}>
          <video
            src="/Generated Video October 25, 2026 - 5_52PM.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
          <div className="relative flex h-full items-end justify-center pb-12">
            <p className="text-center text-sm font-medium tracking-widest text-white/70 uppercase">
              CampusConnect — Where Campus Life Connects
            </p>
          </div>
        </section>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <footer className="border-t border-[var(--cc-border)] bg-[var(--cc-surface)] px-6 py-10">
          <div className="mx-auto max-w-4xl">
            <p className="mb-6 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--cc-muted)]">
              Built by the Team
            </p>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              {TEAM.map(({ name, role }) => (
                <div key={name} className="flex flex-col items-center gap-1.5 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2078C0]/10 text-sm font-bold text-[#2078C0]">
                    {name.charAt(0)}
                  </div>
                  <p className="text-sm font-semibold text-[var(--cc-text)]">{name}</p>
                  <p className="text-[11px] leading-4 text-[var(--cc-muted)]">{role}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-center text-[11px] text-[var(--cc-muted)]">
              © {new Date().getFullYear()} CampusConnect · CHARUSAT
            </p>
          </div>
        </footer>
      </main>
    </PageTransition>
  );
}
