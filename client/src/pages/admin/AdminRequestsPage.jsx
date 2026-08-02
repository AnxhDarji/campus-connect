import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { adminListRequests, adminApproveRequest, adminRejectRequest, getDepartments } from "../../services/eventService";

const STATUS_BADGE = {
  "Pending Approval": "bg-amber-100 text-amber-700",
  "Approved": "bg-green-100 text-green-700",
  "Rejected": "bg-red-100 text-red-700",
  "Returned for Changes": "bg-blue-100 text-blue-700",
  "Published": "bg-purple-100 text-purple-700",
  "Archived": "bg-gray-100 text-gray-500",
};

const CATEGORIES = ["Technical", "Non-Technical", "Workshop", "Seminar", "Sports", "Cultural", "Competition", "Placement", "Festival", "Other"];
const ORG_TYPES = ["Department", "Student Club", "College Committee", "Faculty", "External College", "Student Group", "Other"];
const REQUESTER_ROLES = ["Event Manager", "Club Representative", "Volunteer Lead", "Media Team Member", "Faculty Coordinator", "Student Coordinator", "Department Representative", "External College Representative", "Student", "Other"];

export default function AdminRequestsPage({ statusFilter, title }) {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);

  const [filters, setFilters] = useState({ search: "", department: "", category: "", organization_type: "", requester_role: "" });
  const [page, setPage] = useState(1);

  const [rejectModal, setRejectModal] = useState(null); // { id, title }
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    getDepartments().then((r) => setDepartments(r.data.data || [])).catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 15, ...filters };
    if (statusFilter) params.status = statusFilter;
    Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });
    adminListRequests(params)
      .then((r) => { setRequests(r.data.data); setTotal(r.data.total); setPages(r.data.pages); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, filters, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this event request?")) return;
    setActionLoading(id + "_approve");
    try {
      await adminApproveRequest(id);
      showToast("Event request approved.");
      load();
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to approve.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setActionLoading(rejectModal.id + "_reject");
    try {
      await adminRejectRequest(rejectModal.id, rejectReason);
      showToast("Event request rejected.");
      setRejectModal(null);
      setRejectReason("");
      load();
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to reject.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const setFilter = (key, val) => { setFilters((p) => ({ ...p, [key]: val })); setPage(1); };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg ${toast.type === "error" ? "bg-red-600 text-white" : "bg-green-600 text-white"}`}>
          {toast.msg}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <p className="text-sm font-bold text-gray-900 mb-1">Reject Request</p>
            <p className="text-xs text-gray-500 mb-4 truncate">{rejectModal.title}</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Enter rejection reason (required)..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(""); }}
                className="flex-1 py-2 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || !!actionLoading}
                className="flex-1 py-2 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{total} request{total !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 grid grid-cols-2 lg:grid-cols-5 gap-3">
        <input
          value={filters.search}
          onChange={(e) => setFilter("search", e.target.value)}
          placeholder="Search title, requester..."
          className="col-span-2 lg:col-span-2 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <select value={filters.department} onChange={(e) => setFilter("department", e.target.value)} className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
        <select value={filters.category} onChange={(e) => setFilter("category", e.target.value)} className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={filters.organization_type} onChange={(e) => setFilter("organization_type", e.target.value)} className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option value="">All Org Types</option>
          {ORG_TYPES.map((o) => <option key={o}>{o}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">No requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["Event Title", "Department", "Requester", "Role", "Organization", "Event Date", "Submitted", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r._id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[160px] truncate">{r.title}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{r.department_id?.name || "—"}</td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{r.requester_name}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{r.requester_role === "Other" ? r.custom_role : r.requester_role}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{r.organization_name || r.organization_type}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(r.start_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${STATUS_BADGE[r.status] || "bg-gray-100 text-gray-500"}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/admin/requests/${r._id}`)}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View
                        </button>
                        {r.status === "Pending Approval" && (
                          <>
                            <span className="text-gray-200">|</span>
                            <button
                              onClick={() => handleApprove(r._id)}
                              disabled={!!actionLoading}
                              className="text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <span className="text-gray-200">|</span>
                            <button
                              onClick={() => setRejectModal({ id: r._id, title: r.title })}
                              disabled={!!actionLoading}
                              className="text-red-500 hover:text-red-600 font-medium disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">Page {page} of {pages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
