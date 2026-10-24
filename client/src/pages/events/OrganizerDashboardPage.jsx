import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getEventRequest,
  getAttendanceStats,
  getAttendanceList,
  getReportCSVUrl,
  getReportXLSXUrl,
} from "../../services/eventService";
import QRScanner from "../../components/QRScanner";
import LoadingState from "../../components/LoadingState";
import api from "../../services/api";

const TABS = [
  { id: "scanner", label: "Scan QR" },
  { id: "attendance", label: "Attendance" },
  { id: "report", label: "Report" },
];

export default function OrganizerDashboardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [eventError, setEventError] = useState("");
  const [activeTab, setActiveTab] = useState("scanner");

  // Stats
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");

  // Attendance list
  const [rows, setRows] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Report
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");

  // Load event
  useEffect(() => {
    let active = true;
    setEventLoading(true);
    getEventRequest(id)
      .then((res) => {
        if (!active) return;
        const ev = res.data.data;
        const currentUserId = user?._id || user?.id;
        const ownerId =
          typeof ev.submitted_by === "object"
            ? ev.submitted_by?._id?.toString()
            : ev.submitted_by?.toString();
        if (ownerId !== currentUserId?.toString()) {
          setEventError("You are not authorised to manage this event.");
          return;
        }
        setEvent(ev);
      })
      .catch((err) => {
        if (active) setEventError(err.response?.data?.message || "Event not found.");
      })
      .finally(() => { if (active) setEventLoading(false); });
    return () => { active = false; };
  }, [id, user]);

  const loadStats = useCallback(async () => {
    if (!event) return;
    setStatsLoading(true);
    setStatsError("");
    try {
      const res = await getAttendanceStats(id);
      setStats(res.data.data);
    } catch (err) {
      setStatsError(err.response?.data?.message || "Could not load attendance stats.");
    } finally {
      setStatsLoading(false);
    }
  }, [id, event]);

  const loadList = useCallback(async () => {
    if (!event) return;
    setListLoading(true);
    setListError("");
    try {
      const res = await getAttendanceList(id, { page, limit: 50, search });
      setRows(res.data.rows || []);
      setPages(res.data.pages || 1);
      setTotal(res.data.total || 0);
    } catch (err) {
      setListError(err.response?.data?.message || "Could not load attendance list.");
    } finally {
      setListLoading(false);
    }
  }, [id, event, page, search]);

  useEffect(() => {
    if (activeTab === "attendance" || activeTab === "report") {
      loadStats();
      loadList();
    }
    if (activeTab === "scanner") {
      loadStats();
    }
  }, [activeTab, loadStats, loadList]);

  const handleDownload = async (format) => {
    setReportLoading(true);
    setReportError("");
    try {
      const url = format === "csv" ? getReportCSVUrl(id) : getReportXLSXUrl(id);
      // Use axios to get the file with auth cookies, then trigger download
      const res = await api.get(url, { responseType: "blob" });
      const blob = new Blob([res.data], {
        type: format === "csv" ? "text/csv" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `attendance_${id}_${Date.now()}.${format}`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      setReportError(err.response?.data?.message || `Failed to download ${format.toUpperCase()} report.`);
    } finally {
      setReportLoading(false);
    }
  };

  if (eventLoading) return <LoadingState message="Loading organizer dashboard..." />;

  if (eventError) return (
    <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <p className="text-sm font-semibold text-red-800">{eventError}</p>
      <button onClick={() => navigate(`/events/${id}`)} className="mt-4 rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-white transition">
        Back to event
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div>
          <button onClick={() => navigate(`/events/${id}`)} className="text-xs text-gray-400 hover:text-gray-600 transition mb-1">
            ← Back to event
          </button>
          <h1 className="text-lg font-bold text-gray-900">{event?.title}</h1>
          <p className="text-xs text-gray-500 mt-0.5">Organizer Dashboard</p>
        </div>
        <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700">
          {event?.status}
        </span>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Registered", value: stats.confirmed, color: "text-gray-900" },
            { label: "Present", value: stats.present, color: "text-green-700" },
            { label: "Absent", value: stats.absent, color: "text-red-700" },
            { label: "Attendance", value: `${stats.percentage}%`, color: "text-blue-700" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}
      {statsLoading && <LoadingState message="Loading stats..." size={20} className="min-h-0 py-2" />}
      {statsError && <p className="text-xs text-red-600">{statsError}</p>}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 pb-px">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scanner Tab */}
      {activeTab === "scanner" && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900">QR Attendance Scanner</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Point the camera at a student's QR pass to mark attendance.
            </p>
          </div>
          <QRScanner
            eventId={id}
            onStatsRefresh={loadStats}
          />
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === "attendance" && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">
              Registrations ({total})
            </h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or roll no..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-3 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
              />
              <svg className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" strokeWidth="2" />
                <path d="m16 16 4 4" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {listLoading ? (
            <LoadingState message="Loading registrations..." size={24} className="min-h-0 py-6" />
          ) : listError ? (
            <p className="p-4 text-xs text-red-600">{listError}</p>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">No registrations found.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-left">
                      <th className="px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide">Student</th>
                      <th className="px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide">Roll No</th>
                      <th className="px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide">Reg. Status</th>
                      <th className="px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide">Attendance</th>
                      <th className="px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide">Checked In</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {rows.map((row) => (
                      <tr key={row.registration_id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-medium text-gray-900">{row.student?.fullName || "—"}</td>
                        <td className="px-4 py-3 font-mono text-gray-600">{row.student?.institutionId || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 font-semibold ${
                            row.registration_status === "confirmed"
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}>
                            {row.registration_status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 font-semibold ${
                            row.attendance_status === "present"
                              ? "bg-green-50 text-green-700"
                              : row.attendance_status === "absent"
                              ? "bg-red-50 text-red-700"
                              : "bg-gray-100 text-gray-500"
                          }`}>
                            {row.attendance_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {row.checked_in_at ? new Date(row.checked_in_at).toLocaleTimeString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-gray-500">Page {page} of {pages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    disabled={page >= pages}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Report Tab */}
      {activeTab === "report" && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-5">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Attendance Report</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Download the full attendance report including all registered students.
            </p>
          </div>

          {stats && (
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-xs space-y-1.5">
              <div className="flex justify-between"><span className="text-gray-500">Total Registered</span><span className="font-semibold">{stats.confirmed}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Present</span><span className="font-semibold text-green-700">{stats.present}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Absent</span><span className="font-semibold text-red-700">{stats.absent}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Cancelled</span><span className="font-semibold text-gray-500">{stats.cancelled}</span></div>
              <div className="flex justify-between border-t border-gray-200 pt-1.5 mt-1.5"><span className="text-gray-500">Attendance Rate</span><span className="font-bold text-blue-700">{stats.percentage}%</span></div>
            </div>
          )}

          {reportError && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{reportError}</p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleDownload("csv")}
              disabled={reportLoading}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-gray-700 transition shadow-sm"
            >
              {reportLoading ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-90" fill="currentColor" d="M12 3a9 9 0 0 0-9 9h3a6 6 0 0 1 6-6V3Z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              Download CSV
            </button>

            <button
              onClick={() => handleDownload("xlsx")}
              disabled={reportLoading}
              className="flex items-center gap-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-white transition shadow-sm"
            >
              {reportLoading ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-90" fill="currentColor" d="M12 3a9 9 0 0 0-9 9h3a6 6 0 0 1 6-6V3Z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              Download Excel (.xlsx)
            </button>
          </div>

          <p className="text-[10px] text-gray-400">
            Reports include all registered students (Present, Absent, and Cancelled). Downloading does not modify attendance records.
          </p>
        </div>
      )}
    </div>
  );
}
