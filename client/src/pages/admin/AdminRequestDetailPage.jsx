import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { adminGetRequest, adminApproveRequest, adminRejectRequest, adminEditRequest, getEventCompletion } from "../../services/eventService";
import { ConfirmationModal } from "../../components/Modal";
import { formatTime12h } from "../../utils/timeFormatter";
import { audienceLabel } from "../../utils/charusatData";
import { mediaUrl } from "../../utils/mediaUrl";
import LoadingState from "../../components/LoadingState";

const Row = ({ label, value }) =>
  value ? (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  ) : null;

const STATUS_BADGE = {
  "Pending Approval": "bg-amber-100 text-amber-700",
  "Approved": "bg-green-100 text-green-700",
  "Rejected": "bg-red-100 text-red-700",
};

export default function AdminRequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshStats, applyDecisionToStats } = useOutletContext();
  const [data, setData] = useState(null);
  const [completionData, setCompletionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [completionError, setCompletionError] = useState("");

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editFields, setEditFields] = useState({});
  const [adminMetadata, setAdminMetadata] = useState({
    tier: "Low Tier",
    is_featured: false,
    priority: 0,
    badge: "",
    festival_name: "",
    festival_day: "",
  });
  const [actionLoading, setActionLoading] = useState(null);
  const actionInProgress = useRef(false);
  const [toast, setToast] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError("");
    setCompletionError("");
    setData(null);
    setCompletionData(null);
    adminGetRequest(id)
      .then((r) => {
        setData(r.data.data);
        setEditFields({
          title: r.data.data.title,
          venue: r.data.data.venue,
          building: r.data.data.building || "",
          room: r.data.data.room || "",
          description: r.data.data.description || "",
        });
        setAdminMetadata({
          tier: r.data.data.admin_metadata?.tier || "Low Tier",
          is_featured: r.data.data.admin_metadata?.is_featured || false,
          priority: r.data.data.admin_metadata?.priority || 0,
          badge: r.data.data.admin_metadata?.badge || "",
          festival_name: r.data.data.admin_metadata?.festival_name || "",
          festival_day: r.data.data.admin_metadata?.festival_day || "",
        });
      })
      .catch((e) => setLoadError(e.response?.data?.message || "This request could not be loaded. Please retry."))
      .finally(() => setLoading(false));
    getEventCompletion(id)
      .then((r) => setCompletionData(r.data.data))
      .catch((e) => setCompletionError(e.response?.data?.message || "Completion information could not be loaded."));
  }, [id]);

  const [showApproveConfirm, setShowApproveConfirm] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(load, 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApproveClick = () => {
    setShowApproveConfirm(true);
  };

  const handleConfirmApprove = async () => {
    if (actionInProgress.current) return;
    actionInProgress.current = true;
    setActionLoading("approve");
    try {
      const response = await adminApproveRequest(id, { admin_metadata: adminMetadata });
      applyDecisionToStats(response.data.data?.status || "Approved");
      await refreshStats();
      setShowApproveConfirm(false);
      showToast("Event request approved.");
      load();
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to approve.", "error");
    } finally {
      actionInProgress.current = false;
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim() || actionInProgress.current) return;
    actionInProgress.current = true;
    setActionLoading("reject");
    try {
      const response = await adminRejectRequest(id, rejectReason);
      applyDecisionToStats(response.data.data?.status || "Rejected");
      await refreshStats();
      showToast("Event request rejected.");
      setRejectOpen(false);
      setRejectReason("");
      load();
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to reject.", "error");
    } finally {
      actionInProgress.current = false;
      setActionLoading(null);
    }
  };

  const handleEdit = async () => {
    if (actionInProgress.current) return;
    actionInProgress.current = true;
    setActionLoading("edit");
    try {
      await adminEditRequest(id, { ...editFields, admin_metadata: adminMetadata });
      showToast("Changes saved.");
      setEditOpen(false);
      load();
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to save.", "error");
    } finally {
      actionInProgress.current = false;
      setActionLoading(null);
    }
  };

  if (loading && !data) return <LoadingState message="Loading request details..." />;
  if (!data) {
    return (
      <div role="alert" className="mx-auto max-w-xl rounded-xl border border-red-100 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-semibold text-gray-900">Request unavailable</p>
        <p className="mt-2 text-sm text-gray-500">{loadError || "This request could not be found."}</p>
        <div className="mt-4 flex justify-center gap-2">
          <button onClick={load} disabled={loading} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{loading ? "Retrying..." : "Retry"}</button>
          <button onClick={() => navigate("/admin/all")} className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">All requests</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg ${toast.type === "error" ? "bg-red-600 text-white" : "bg-green-600 text-white"}`}>
          {toast.msg}
        </div>
      )}

      {/* Reject Modal */}
      {rejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <p className="text-sm font-bold text-gray-900 mb-1">Reject Request</p>
            <p className="text-xs text-gray-500 mb-4 truncate">{data.title}</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Enter rejection reason (required)..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setRejectOpen(false); setRejectReason(""); }} className="flex-1 py-2 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleReject} disabled={!rejectReason.trim() || !!actionLoading} className="flex-1 py-2 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                {actionLoading === "reject" ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <p className="text-sm font-bold text-gray-900 mb-4">Edit Request</p>
            {[
              { key: "title", label: "Event Title" },
              { key: "venue", label: "Venue" },
              { key: "building", label: "Building" },
              { key: "room", label: "Room" },
            ].map(({ key, label }) => (
              <div key={key} className="mb-3">
                <label className="text-xs text-gray-500 font-medium block mb-1">{label}</label>
                <input
                  value={editFields[key] || ""}
                  onChange={(e) => setEditFields((p) => ({ ...p, [key]: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            ))}
            <div className="mb-3">
              <label className="text-xs text-gray-500 font-medium block mb-1">Description</label>
              <textarea
                value={editFields.description || ""}
                onChange={(e) => setEditFields((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setEditOpen(false)} className="flex-1 py-2 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleEdit} disabled={!!actionLoading} className="flex-1 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {actionLoading === "edit" ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 rounded-lg py-1 text-xs font-medium text-gray-500 hover:text-blue-700">
        Back to requests
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Event request</p>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">{data.title}</h1>
          <p className="mt-1 text-xs text-gray-500 font-mono">ID: {data.event_id}</p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${STATUS_BADGE[data.status] || "bg-gray-100 text-gray-500"}`}>
          {data.status}
        </span>
      </div>

      {/* Action Buttons */}
      {data.status === "Pending Approval" && (
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-2">
            <button
              onClick={handleApproveClick}
              disabled={!!actionLoading}
              className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition"
            >
              Approve Request
            </button>
            <button
              onClick={() => setRejectOpen(true)}
              disabled={!!actionLoading}
              className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition"
            >
              Reject Request
            </button>
          </div>
          <button onClick={() => setEditOpen(true)} className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50">
            Edit request
          </button>
        </div>
      )}

      {/* Rejection reason display */}
      {data.status === "Rejected" && data.rejection_reason && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-5">
          <p className="text-xs font-semibold text-red-700 mb-1">Rejection Reason</p>
          <p className="text-sm text-red-600">{data.rejection_reason}</p>
          <p className="text-xs text-gray-400 mt-1">
            Rejected by {data.rejected_by?.fullName} · {data.rejected_at ? new Date(data.rejected_at).toLocaleString() : ""}
          </p>
        </div>
      )}

      {data.status === "Approved" && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-5">
          <p className="text-xs font-semibold text-green-700 mb-1">Approved</p>
          <p className="text-xs text-gray-400">
            Approved by {data.approved_by?.fullName} · {data.approved_at ? new Date(data.approved_at).toLocaleString() : ""}
          </p>
        </div>
      )}

      {/* Administrative Settings Card */}
      <div className="space-y-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex justify-between items-center border-b border-gray-50 pb-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Administrative & Publishing Settings</p>
          {data.status !== "Pending Approval" && (
            <span className="text-[10px] bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded">Read-Only</span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] text-gray-400 font-semibold uppercase block mb-1">Event Tier</label>
            {data.status === "Pending Approval" ? (
              <select
                value={adminMetadata.tier}
                onChange={(e) => setAdminMetadata((prev) => ({ ...prev, tier: e.target.value }))}
                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="Top Tier">Top Tier</option>
                <option value="Medium Tier">Medium Tier</option>
                <option value="Low Tier">Low Tier</option>
              </select>
            ) : (
              <p className="text-xs font-medium text-gray-800">{adminMetadata.tier || "Low Tier"}</p>
            )}
          </div>

          <div>
            <label className="text-[10px] text-gray-400 font-semibold uppercase block mb-1">Badge (e.g. Trending)</label>
            {data.status === "Pending Approval" ? (
              <input
                type="text"
                placeholder="Trending, Special, etc."
                value={adminMetadata.badge}
                onChange={(e) => setAdminMetadata((prev) => ({ ...prev, badge: e.target.value }))}
                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            ) : (
              <p className="text-xs font-medium text-gray-800">{adminMetadata.badge || "—"}</p>
            )}
          </div>

          <div>
            <label className="text-[10px] text-gray-400 font-semibold uppercase block mb-1">Priority Ranking</label>
            {data.status === "Pending Approval" ? (
              <input
                type="number"
                value={adminMetadata.priority}
                onChange={(e) => setAdminMetadata((prev) => ({ ...prev, priority: Number(e.target.value) }))}
                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            ) : (
              <p className="text-xs font-medium text-gray-800">{adminMetadata.priority || 0}</p>
            )}
          </div>

          <div>
            <label className="text-[10px] text-gray-400 font-semibold uppercase block mb-1">Festival Name</label>
            {data.status === "Pending Approval" ? (
              <input
                type="text"
                placeholder="e.g. Sparsh"
                value={adminMetadata.festival_name}
                onChange={(e) => setAdminMetadata((prev) => ({ ...prev, festival_name: e.target.value }))}
                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            ) : (
              <p className="text-xs font-medium text-gray-800">{adminMetadata.festival_name || "—"}</p>
            )}
          </div>

          <div>
            <label className="text-[10px] text-gray-400 font-semibold uppercase block mb-1">Festival Day</label>
            {data.status === "Pending Approval" ? (
              <input
                type="number"
                placeholder="e.g. 1"
                value={adminMetadata.festival_day}
                onChange={(e) => setAdminMetadata((prev) => ({ ...prev, festival_day: e.target.value ? Number(e.target.value) : "" }))}
                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            ) : (
              <p className="text-xs font-medium text-gray-800">{adminMetadata.festival_day || "—"}</p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-4 sm:pt-2">
            {data.status === "Pending Approval" ? (
              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={adminMetadata.is_featured}
                  onChange={(e) => setAdminMetadata((prev) => ({ ...prev, is_featured: e.target.checked }))}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 border-gray-300"
                />
                Mark as Featured Event
              </label>
            ) : (
              <p className="text-xs font-semibold text-blue-700">{adminMetadata.is_featured ? "Featured event" : "Not featured"}</p>
            )}
          </div>
        </div>

        {data.status === "Approved" && (
          <div className="pt-2 border-t border-gray-50 flex justify-end">
            <button
              onClick={() => {
                setActionLoading("save_meta");
                adminEditRequest(id, { admin_metadata: adminMetadata })
                  .then(() => {
                    showToast("Publishing settings updated.");
                    load();
                  })
                  .catch(() => showToast("Failed to update settings.", "error"))
                  .finally(() => setActionLoading(null));
              }}
              disabled={!!actionLoading}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all cursor-pointer"
            >
              {actionLoading === "save_meta" ? "Saving..." : "Update Settings"}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Requester Info */}
        <div className="rounded-xl border border-gray-100 bg-white p-4 sm:p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Requester Information</p>
          <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
            <Row label="Name" value={data.requester_name} />
            <Row label="Role" value={data.requester_role === "Other" ? data.custom_role : data.requester_role} />
            <Row label="Organization Type" value={data.organization_type} />
            <Row label="Organization" value={data.organization_name} />
            <Row label="Contact" value={data.contact_number} />
            <Row label="Email" value={data.email} />
            <Row label="Submitted By" value={data.submitted_by?.fullName} />
          </div>
        </div>

        {/* Event Info */}
        <div className="rounded-xl border border-gray-100 bg-white p-4 sm:p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Event Information</p>
          <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
            <Row label="Category" value={data.category} />
            <Row label="Department" value={data.department_id?.name} />
            <Row label="Club" value={data.club_name} />
            <Row label="Start Date" value={new Date(data.start_date).toLocaleDateString()} />
            <Row label="End Date" value={new Date(data.end_date).toLocaleDateString()} />
            <Row label="Start Time" value={formatTime12h(data.start_time)} />
            <Row label="End Time" value={formatTime12h(data.end_time)} />
            <Row label="Venue" value={data.venue} />
            <Row label="Building" value={data.building} />
            <Row label="Room" value={data.room} />
          </div>
          {data.description && (
            <div className="mt-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{data.description}</p>
            </div>
          )}
        </div>

        {/* Media */}
        {(data.poster_url || data.qr_code_url || data.brochure_url) && (
          <div className="rounded-xl border border-gray-100 bg-white p-4 sm:p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Media</p>
            <div className="flex flex-wrap gap-4">
              {data.poster_url && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Poster</p>
                  <img src={mediaUrl(data.poster_url)} alt="poster" className="max-h-48 rounded-lg object-contain border border-gray-100" />
                </div>
              )}
              {data.qr_code_url && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">QR Code</p>
                  <img src={mediaUrl(data.qr_code_url)} alt="qr" className="h-32 w-32 rounded-lg object-contain border border-gray-100" />
                </div>
              )}
              {data.brochure_url && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Brochure</p>
                  <a href={mediaUrl(data.brochure_url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                    Download PDF
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Registration */}
        {data.registration_required && (
          <div className="rounded-xl border border-gray-100 bg-white p-4 sm:p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Registration</p>
            <div className="grid grid-cols-2 gap-4">
              <Row label="Required" value="Yes" />
              <Row label="Deadline" value={data.registration_deadline ? new Date(data.registration_deadline).toLocaleDateString() : null} />
            </div>
            {data.registration_link && (
              <a href={data.registration_link} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-blue-600 hover:underline break-all">
                {data.registration_link}
              </a>
            )}
          </div>
        )}

        {/* Social Links */}
        {[data.website_url, data.instagram_url, data.linkedin_url, data.facebook_url, data.whatsapp_url, data.google_map_url].some(Boolean) && (
          <div className="rounded-xl border border-gray-100 bg-white p-4 sm:p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Links</p>
            <div className="flex flex-col gap-1.5">
              {[
                { label: "Website", url: data.website_url },
                { label: "Instagram", url: data.instagram_url },
                { label: "LinkedIn", url: data.linkedin_url },
                { label: "Facebook", url: data.facebook_url },
                { label: "WhatsApp", url: data.whatsapp_url },
                { label: "Google Maps", url: data.google_map_url },
              ].filter((l) => l.url).map((l) => (
                <div key={l.label} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-20">{l.label}</span>
                  <a href={l.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline truncate max-w-xs">{l.url}</a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audience */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Target Audience</p>
          {data.audience?.length > 0 ? (
            <div className="flex flex-col gap-2">
              {data.audience.map((a, i) => {
                const label = a.audience_type === "OTHER"
                  ? (a.custom_audience || null)
                  : audienceLabel(a);
                if (!label) return null;
                return (
                  <div key={i} className="px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
                    <span className="text-xs font-medium text-blue-800">
                      {a.audience_type === "OTHER" ? `Other: ${label}` : label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">Target audience information unavailable.</p>
          )}
        </div>
      </div>

      {/* Event Completion (admin read-only view) */}
      {completionError ? (
        <div role="alert" className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          {completionError} Completion details are currently unavailable.
        </div>
      ) : completionData?.completion && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mt-4 space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-50 pb-2">Event Completion</p>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-medium">Actual Attendance</p>
              <p className="text-gray-800 font-semibold text-sm">{completionData.completion.actual_attendance}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-medium">Submitted At</p>
              <p className="text-gray-700">{new Date(completionData.completion.submitted_at).toLocaleString()}</p>
            </div>
            {completionData.completion.key_highlights && (
              <div className="col-span-2">
                <p className="text-[10px] text-gray-400 uppercase font-medium">Key Highlights</p>
                <p className="text-gray-700 whitespace-pre-wrap">{completionData.completion.key_highlights}</p>
              </div>
            )}
            {completionData.completion.winners_achievements && (
              <div className="col-span-2">
                <p className="text-[10px] text-gray-400 uppercase font-medium">Winners / Achievements</p>
                <p className="text-gray-700 whitespace-pre-wrap">{completionData.completion.winners_achievements}</p>
              </div>
            )}
            {completionData.completion.special_guests && (
              <div className="col-span-2">
                <p className="text-[10px] text-gray-400 uppercase font-medium">Special Guests</p>
                <p className="text-gray-700 whitespace-pre-wrap">{completionData.completion.special_guests}</p>
              </div>
            )}
            {completionData.completion.event_outcomes && (
              <div className="col-span-2">
                <p className="text-[10px] text-gray-400 uppercase font-medium">Event Outcomes</p>
                <p className="text-gray-700 whitespace-pre-wrap">{completionData.completion.event_outcomes}</p>
              </div>
            )}
          </div>
          {(completionData.completion.post_event_image_url || completionData.completion.photos?.length > 0) && (
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-medium mb-2">Post-Event Image</p>
              {completionData.completion.post_event_image_url && (
                <a href={mediaUrl(completionData.completion.post_event_image_url)} target="_blank" rel="noreferrer">
                  <img src={mediaUrl(completionData.completion.post_event_image_url)} alt="Post-event image" className="mb-2 max-h-48 max-w-40 rounded-lg border border-gray-100 object-contain" />
                </a>
              )}
              {completionData.completion.photos?.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {completionData.completion.photos.map((url, i) => (
                    <a key={i} href={mediaUrl(url)} target="_blank" rel="noreferrer">
                      <img src={mediaUrl(url)} alt={`photo-${i}`} className="w-full aspect-square object-cover rounded-lg border border-gray-100 hover:opacity-90 transition" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* AI Event Report (admin read-only view) */}
      {completionData?.report && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mt-4 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-50 pb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">AI Event Report</p>
            {completionData.report.generation_status === "GENERATED" && <span className="text-xs text-green-600 font-semibold">Report generated</span>}
            {completionData.report.generation_status === "GENERATING" && <span className="text-xs text-amber-500 font-semibold">Generating...</span>}
            {completionData.report.generation_status === "FAILED" && <span className="text-xs text-red-500 font-semibold">Failed</span>}
          </div>
          {completionData.report.generation_status === "GENERATED" && completionData.report.report_data && (
            <div className="space-y-3 text-xs">
              {completionData.report.report_data.eventOverview && (
                <div><p className="text-[10px] text-gray-400 uppercase font-medium mb-0.5">Event Overview</p><p className="text-gray-700">{completionData.report.report_data.eventOverview}</p></div>
              )}
              {completionData.report.report_data.participationSummary && (
                <div><p className="text-[10px] text-gray-400 uppercase font-medium mb-0.5">Participation Summary</p><p className="text-gray-700">{completionData.report.report_data.participationSummary}</p></div>
              )}
              {completionData.report.report_data.keyHighlights?.length > 0 && (
                <div><p className="text-[10px] text-gray-400 uppercase font-medium mb-0.5">Key Highlights</p><ul className="list-disc list-inside space-y-0.5">{completionData.report.report_data.keyHighlights.map((h, i) => <li key={i} className="text-gray-700">{h}</li>)}</ul></div>
              )}
              {completionData.report.report_data.achievements?.length > 0 && (
                <div><p className="text-[10px] text-gray-400 uppercase font-medium mb-0.5">Achievements</p><ul className="list-disc list-inside space-y-0.5">{completionData.report.report_data.achievements.map((a, i) => <li key={i} className="text-gray-700">{a}</li>)}</ul></div>
              )}
              {completionData.report.report_data.eventOutcomes?.length > 0 && (
                <div><p className="text-[10px] text-gray-400 uppercase font-medium mb-0.5">Event Outcomes</p><ul className="list-disc list-inside space-y-0.5">{completionData.report.report_data.eventOutcomes.map((o, i) => <li key={i} className="text-gray-700">{o}</li>)}</ul></div>
              )}
              {completionData.report.report_data.conclusion && (
                <div><p className="text-[10px] text-gray-400 uppercase font-medium mb-0.5">Conclusion</p><p className="text-gray-700">{completionData.report.report_data.conclusion}</p></div>
              )}
              <p className="text-[10px] text-gray-400">Generated on {new Date(completionData.report.generated_at).toLocaleString()}</p>
            </div>
          )}
          {completionData.report.generation_status === "GENERATING" && (
            <p className="text-xs text-gray-400">Report is being generated...</p>
          )}
          {completionData.report.generation_status === "FAILED" && (
            <p className="text-xs text-red-500">Report generation failed. The organizer can retry from their event page.</p>
          )}
        </div>
      )}

      <ConfirmationModal
        isOpen={showApproveConfirm}
        onClose={() => setShowApproveConfirm(false)}
        onConfirm={handleConfirmApprove}
        title="Approve Request"
        message="Are you sure you want to approve this event request? It will be visible to students."
        confirmText={actionLoading === "approve" ? "Approving..." : "Approve"}
        type="warning"
        confirmDisabled={!!actionLoading}
        cancelDisabled={!!actionLoading}
      />
    </div>
  );
}
