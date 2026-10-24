import { useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { adminGetStats } from "../../services/eventService";
import ThemePreference from "../../components/ThemePreference";
import PageTransition from "../../components/PageTransition";
import { useSignOut } from "../../context/SignOutContext";
import LoadingState from "../../components/LoadingState";

const NAV = [
  { label: "Dashboard", path: "/admin", icon: "grid" },
  { label: "Pending", path: "/admin/pending", icon: "clock" },
  { label: "Approved", path: "/admin/approved", icon: "check" },
  { label: "Rejected", path: "/admin/rejected", icon: "minus" },
  { label: "Completion & AI Posters", path: "/admin/completed", icon: "image" },
  { label: "All Requests", path: "/admin/all", icon: "list" },
];

function NavIcon({ name }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
    minus: <><circle cx="12" cy="12" r="9" /><path d="M8 12h8" /></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="m21 15-5-5L5 20" /></>,
    list: <><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0">{paths[name]}</svg>;
}

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
    <div className="min-h-screen bg-gray-50 text-gray-900 lg:flex">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[min(18rem,86vw)] flex-col border-r border-gray-100 bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:self-start lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-gray-100 px-5 py-5">
          <p className="text-base font-bold tracking-tight text-gray-900">CampusConnect</p>
          <p className="mt-1 text-xs font-medium text-gray-400">Administration</p>
        </div>
        <nav aria-label="Administration" className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {NAV.map((item) => (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); setSidebarOpen(false); }}
              aria-current={isActive(item.path) ? "page" : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                isActive(item.path)
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <NavIcon name={item.icon} />
              <span className="min-w-0 flex-1">{item.label}</span>
              {item.path === "/admin/pending" && stats?.pending > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                  {stats.pending}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="shrink-0 space-y-4 border-t border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
              {user?.fullName?.charAt(0)?.toUpperCase() || "A"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-gray-800">{user?.fullName}</p>
              <p className="truncate text-[11px] text-gray-400">{user?.role}</p>
            </div>
            <button onClick={requestSignOut} className="text-xs font-medium text-red-600 transition-colors hover:text-red-700">Sign out</button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-gray-950/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-gray-100 bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:justify-end">
          <div className="flex items-center gap-3 lg:hidden">
            <button
              aria-label="Open navigation"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </button>
            <p className="text-sm font-semibold text-gray-900">Admin Panel</p>
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
