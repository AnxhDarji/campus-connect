import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { adminListRequests, adminApproveRequest, adminRejectRequest, getDepartments } from "../../services/eventService";
import { ConfirmationModal } from "../../components/Modal";
import LoadingState from "../../components/LoadingState";

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
export default function AdminRequestsPage({ statusFilter, completionFilter, title }) {
  const navigate = useNavigate();
  const { refreshStats, applyDecisionToStats } = useOutletContext();
  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [departments, setDepartments] = useState([]);
  const [departmentsError, setDepartmentsError] = useState("");

  const [filters, setFilters] = useState({ search: "", department: "", category: "", organization_type: "", requester_role: "", sortBy: "created_at", sortOrder: "desc" });
  const [page, setPage] = useState(1);

  const [rejectModal, setRejectModal] = useState(null); // { id, title }
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const actionInProgress = useRef(false);
  const [toast, setToast] = useState(null);

  // Custom Modal States
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [approveTargetId, setApproveTargetId] = useState(null);

  const loadDepartments = useCallback(async () => {
    setDepartmentsError("");
    try {
      const response = await getDepartments();
      setDepartments(response.data.data || []);
    } catch {
      setDepartmentsError("Department options could not be loaded.");
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(loadDepartments, 0);
    return () => window.clearTimeout(timeout);
  }, [loadDepartments]);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError("");
    const params = { page, limit: 15, ...filters };
    if (statusFilter) params.status = statusFilter;
    if (completionFilter) params.completion_status = completionFilter;
    Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });
    adminListRequests(params)
      .then((response) => {
        if (!Array.isArray(response.data.data) || !Number.isFinite(response.data.total) || !Number.isFinite(response.data.pages)) {
          throw new Error("The request service returned an invalid response.");
        }
        setRequests(response.data.data);
        setTotal(response.data.total);
        setPages(response.data.pages);
      })
      .catch((e) => { setLoadError(e.response?.data?.message || e.message || "Requests could not be loaded. Please retry."); })
      .finally(() => setLoading(false));
  }, [page, filters, statusFilter, completionFilter]);

  useEffect(() => {
    const timeout = window.setTimeout(load, 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApproveClick = (id) => {
    setApproveTargetId(id);
    setShowApproveConfirm(true);
  };

  const handleConfirmApprove = async () => {
    if (!approveTargetId || actionInProgress.current) return;
    const requestId = approveTargetId;
    actionInProgress.current = true;
    setActionLoading(requestId + "_approve");
    try {
      const response = await adminApproveRequest(requestId, {});
      const status = response.data.data?.status || "Approved";
      applyDecision(requestId, status);
      applyDecisionToStats(status);
      await refreshStats();
      setShowApproveConfirm(false);
      setApproveTargetId(null);
      showToast("Event request approved.");
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to approve.", "error");
    } finally {
      actionInProgress.current = false;
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim() || !rejectModal || actionInProgress.current) return;
    const requestId = rejectModal.id;
    actionInProgress.current = true;
    setActionLoading(requestId + "_reject");
    try {
      const response = await adminRejectRequest(requestId, rejectReason);
      const status = response.data.data?.status || "Rejected";
      applyDecision(requestId, status);
      applyDecisionToStats(status);
      await refreshStats();
      showToast("Event request rejected.");
      setRejectModal(null);
      setRejectReason("");
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to reject.", "error");
    } finally {
      actionInProgress.current = false;
      setActionLoading(null);
    }
  };

  const applyDecision = (requestId, status) => {
    if (statusFilter === "Pending Approval") {
      setRequests((current) => current.filter((request) => request._id !== requestId));
      setTotal((current) => Math.max(0, current - 1));
      if (requests.length === 1 && page > 1) {
        setLoading(true);
        setPage((current) => Math.max(1, current - 1));
      }
      return;
    }
    setRequests((current) => current.map((request) => (
      request._id === requestId ? { ...request, status } : request
    )));
  };

  const setFilter = (key, val) => { setFilters((p) => ({ ...p, [key]: val })); setPage(1); };

  return (
    <div className="space-y-4">
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
                disabled={!!actionLoading}
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

      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Request management</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-gray-900">{title}</h2>
          {!loadError && <p className="mt-1 text-xs text-gray-500">{total} request{total !== 1 ? "s" : ""}</p>}
        </div>
      </div>

      {/* Filters */}
      {departmentsError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
          <p className="text-xs text-amber-800">{departmentsError} The department filter may be incomplete.</p>
          <button onClick={loadDepartments} className="text-xs font-semibold text-amber-800 underline underline-offset-2">Retry departments</button>
        </div>
      )}
      <div className="grid grid-cols-1 gap-2.5 rounded-xl border border-gray-100 bg-white p-3 shadow-sm sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <input
          aria-label="Search event requests"
          value={filters.search}
          onChange={(e) => setFilter("search", e.target.value)}
          placeholder="Search title, requester..."
          className="min-w-0 rounded-lg border border-gray-200 px-3 py-2.5 text-xs outline-none transition focus:ring-2 focus:ring-blue-400 sm:col-span-2 xl:col-span-2"
        />
        <select aria-label="Filter by department" value={filters.department} onChange={(e) => setFilter("department", e.target.value)} className="min-w-0 rounded-lg border border-gray-200 px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-400">
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
        <select aria-label="Filter by category" value={filters.category} onChange={(e) => setFilter("category", e.target.value)} className="min-w-0 rounded-lg border border-gray-200 px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-400">
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select aria-label="Filter by organization type" value={filters.organization_type} onChange={(e) => setFilter("organization_type", e.target.value)} className="min-w-0 rounded-lg border border-gray-200 px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-400">
          <option value="">All Org Types</option>
          {ORG_TYPES.map((o) => <option key={o}>{o}</option>)}
        </select>
        <select aria-label="Sort requests by" value={filters.sortBy} onChange={(e) => setFilter("sortBy", e.target.value)} className="min-w-0 rounded-lg border border-gray-200 px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-400">
          <option value="created_at">Sort: Request Date</option>
          <option value="start_date">Sort: Event Date</option>
          <option value="title">Sort: Event Title</option>
          <option value="category">Sort: Category</option>
        </select>
        <select aria-label="Sort direction" value={filters.sortOrder} onChange={(e) => setFilter("sortOrder", e.target.value)} className="min-w-0 rounded-lg border border-gray-200 px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-400">
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        {loadError ? (
          <div role="alert" className="flex flex-col items-start justify-between gap-3 p-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-gray-900">Unable to load requests</p>
              <p className="mt-1 text-xs text-gray-500">{loadError}</p>
            </div>
            <button onClick={load} disabled={loading} className="rounded-lg border border-blue-200 px-3.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50">
              {loading ? "Retrying..." : "Retry"}
            </button>
          </div>
        ) : loading ? (
          <LoadingState message="Loading requests..." size={32} />
        ) : requests.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">No requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["Event Title", "Department", "Requester", "Role", "Organization", "Event Date", "Submitted", "Status", "Actions"].map((h) => (
                    <th key={h} scope="col" className="whitespace-nowrap px-3 py-3 text-left font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r._id} className="border-b border-gray-50 transition hover:bg-gray-50">
                    <td className="max-w-[200px] truncate px-3 py-3 font-semibold text-gray-900">{r.title}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-gray-500">{r.department_id?.name || "—"}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-gray-700">{r.requester_name}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-gray-500">{r.requester_role === "Other" ? r.custom_role : r.requester_role}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-gray-500">{r.organization_name || r.organization_type}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-gray-500">{new Date(r.start_date).toLocaleDateString()}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-gray-400">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-3 py-3">
                      <span className={`whitespace-nowrap rounded-full px-2 py-1 font-medium ${STATUS_BADGE[r.status] || "bg-gray-100 text-gray-500"}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/admin/requests/${r._id}`)}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View
                        </button>
                        {r.completion_status === "COMPLETED" && (
                          <>
                            <button
                              onClick={() => navigate(`/events/${r._id}/report`)}
                              className="text-indigo-600 hover:text-indigo-700 font-semibold"
                            >
                              AI Poster & Report
                            </button>
                          </>
                        )}
                        {r.status === "Pending Approval" && (
                          <>
                            <button
                              onClick={() => handleApproveClick(r._id)}
                              disabled={!!actionLoading}
                              className="text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
                            >
                              Approve
                            </button>
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
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={showApproveConfirm}
        onClose={() => { setShowApproveConfirm(false); setApproveTargetId(null); }}
        onConfirm={handleConfirmApprove}
        title="Approve Request"
        message="Are you sure you want to approve this event request? It will be visible to students."
        confirmText={actionLoading?.endsWith("_approve") ? "Approving..." : "Approve"}
        type="warning"
        confirmDisabled={!!actionLoading}
        cancelDisabled={!!actionLoading}
      />
    </div>
  );
}
