import { useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { adminGetStats } from "../../services/eventService";
import ThemePreference from "../../components/ThemePreference";
import PageTransition from "../../components/PageTransition";
import { useSignOut } from "../../context/SignOutContext";
import LoadingState from "../../components/LoadingState";
import {
  WidgetIcon,
  ClockCircleIcon,
  CheckCircleIcon,
  CloseCircleIcon,
  GalleryIcon,
  NotesIcon,
  HamburgerMenuIcon,
} from "@solar-icons/react/linear";

const NAV = [
  { label: "Dashboard", path: "/admin", Icon: WidgetIcon },
  { label: "Pending", path: "/admin/pending", Icon: ClockCircleIcon },
  { label: "Approved", path: "/admin/approved", Icon: CheckCircleIcon },
  { label: "Rejected", path: "/admin/rejected", Icon: CloseCircleIcon },
  { label: "Completion & AI Posters", path: "/admin/completed", Icon: GalleryIcon },
  { label: "All Requests", path: "/admin/all", Icon: NotesIcon },
];

export default function AdminLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const requestSignOut = useSignOut();
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const applyDecisionToStats = useCallback((status) => {
    setStats((current) => {
      if (!current) return current;
      return {
        ...current,
        pending: Math.max(0, current.pending - 1),
        ...(status === "Approved"
          ? { approvedToday: current.approvedToday + 1 }
          : { rejected: current.rejected + 1 }),
      };
    });
  }, []);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError("");
    try {
      const response = await adminGetStats();
      const figures = response.data.data;
      const fields = ["pending", "approvedToday", "rejected", "total"];
      if (!figures || !fields.every((field) => Number.isFinite(figures[field]))) {
        throw new Error("Invalid dashboard statistics.");
      }
      setStats(figures);
    } catch {
      setStats(null);
      setStatsError("Dashboard figures could not be loaded.");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(loadStats, 0);
    return () => window.clearTimeout(timeout);
  }, [loadStats, location.pathname]);

  const isActive = (path) =>
    path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-[var(--cc-bg)] text-[var(--cc-text)] lg:flex">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[min(18rem,86vw)] flex-col border-r border-[var(--cc-border)] bg-[var(--cc-surface)] transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:self-start lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-[var(--cc-border)] px-4 py-4 flex items-center gap-3">
          <img src="/CampusConnect_logo.png" alt="CampusConnect" className="cc-brand-logo" />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--cc-muted)]">Administration</p>
          </div>
        </div>
        <nav aria-label="Administration" className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
          {NAV.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                aria-current={active ? "page" : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-[background-color,color] duration-150 cursor-pointer ${
                  active
                    ? "bg-[var(--cc-ice)] text-[var(--cc-ocean)] shadow-[inset_3px_0_0_var(--cc-ocean)]"
                    : "text-[var(--cc-muted)] hover:bg-[var(--cc-raised)] hover:text-[var(--cc-text)]"
                }`}
              >
                <item.Icon
                  size={18}
                  strokeWidth={1.8}
                  aria-hidden="true"
                  color={active ? "var(--cc-ocean)" : undefined}
                />
                <span className="min-w-0 flex-1">{item.label}</span>
                {item.path === "/admin/pending" && stats?.pending > 0 && (
                  <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                    {stats.pending}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="shrink-0 space-y-4 border-t border-[var(--cc-border)] p-4">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF2FB] dark:bg-[#253142] text-sm font-bold text-[#2078C0] dark:text-[#3894DC]">
              {user?.fullName?.charAt(0)?.toUpperCase() || "A"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-[var(--cc-text)]">{user?.fullName}</p>
              <p className="truncate text-[11px] text-[var(--cc-muted)]">{user?.role}</p>
            </div>
            <button onClick={requestSignOut} className="text-xs font-semibold text-red-600 dark:text-red-400 transition-colors hover:text-red-700 cursor-pointer">Sign out</button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[var(--cc-border)] bg-[var(--cc-surface)]/95 px-4 py-3 backdrop-blur sm:px-6 lg:justify-end">
          <div className="flex items-center gap-3 lg:hidden">
            <button
              aria-label="Open navigation"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--cc-border)] text-[var(--cc-muted)] hover:bg-[var(--cc-raised)] transition cursor-pointer"
            >
              <HamburgerMenuIcon size={20} strokeWidth={1.8} aria-hidden="true" />
            </button>
            <p className="text-sm font-semibold text-[var(--cc-text)]">Admin Panel</p>
          </div>
          <ThemePreference />
        </header>

        <main className="mx-auto w-full max-w-[1600px] flex-1 p-4 sm:p-6 lg:p-8">
          <PageTransition>
            <>
              {location.pathname === "/admin" && (
                <section className="mb-7">
                  <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Overview</p>
                      <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
                      <p className="mt-1 text-sm text-gray-500">A current snapshot of event requests.</p>
                    </div>
                    {stats && <p className="text-xs text-gray-400">Live request totals</p>}
                  </div>

                  {statsError ? (
                    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                      <p className="text-sm text-red-700">{statsError} No figures are shown until the service responds.</p>
                      <button onClick={loadStats} disabled={statsLoading} className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">
                        {statsLoading ? "Retrying..." : "Retry"}
                      </button>
                    </div>
                  ) : statsLoading && !stats ? (
                    <LoadingState message="Loading dashboard figures..." size={32} className="rounded-xl border border-gray-100 bg-white px-4 py-6" />
                  ) : stats ? (
                    <>
                      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                        {[
                          { label: "Pending review", value: stats.pending, tone: "text-amber-700", edge: "border-l-amber-400" },
                          { label: "Approved today", value: stats.approvedToday, tone: "text-green-700", edge: "border-l-green-500" },
                          { label: "Rejected", value: stats.rejected, tone: "text-red-700", edge: "border-l-red-400" },
                          { label: "All requests", value: stats.total, tone: "text-blue-700", edge: "border-l-blue-500" },
                        ].map((stat) => (
                          <article key={stat.label} className={`cc-stat-card rounded-xl border border-gray-100 border-l-4 ${stat.edge} bg-white p-4 shadow-sm`}>
                            <p className="text-xs font-medium text-gray-500">{stat.label}</p>
                            <p className={`mt-2 text-3xl font-bold tracking-tight ${stat.tone}`}>{stat.value}</p>
                          </article>
                        ))}
                      </div>
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Review queue</p>
                          <p className="mt-0.5 text-xs text-gray-500">{stats.pending} request{stats.pending === 1 ? "" : "s"} awaiting a decision</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => navigate("/admin/pending")} className="rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-blue-700">Open pending queue</button>
                          <button onClick={() => navigate("/admin/all")} className="rounded-lg border border-gray-200 px-3.5 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50">Browse all requests</button>
                        </div>
                      </div>
                    </>
                  ) : null}
                </section>
              )}
              <Outlet context={{ stats, refreshStats: loadStats, applyDecisionToStats }} />
            </>
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
