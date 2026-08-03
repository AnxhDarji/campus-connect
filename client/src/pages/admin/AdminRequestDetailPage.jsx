import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adminGetRequest, adminApproveRequest, adminRejectRequest, adminEditRequest } from "../../services/eventService";
import { ConfirmationModal } from "../../components/Modal";
import { formatTime12h } from "../../utils/timeFormatter";

const BASE_URL = "http://localhost:5000";

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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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
  const [toast, setToast] = useState(null);

  const load = () => {
    setLoading(true);
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
      .catch(() => navigate("/admin/all"))
      .finally(() => setLoading(false));
  };

  const [showApproveConfirm, setShowApproveConfirm] = useState(false);

  useEffect(() => { load(); }, [id]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApproveClick = () => {
    setShowApproveConfirm(true);
  };

  const handleConfirmApprove = async () => {
    setShowApproveConfirm(false);
    setActionLoading("approve");
    try {
      await adminApproveRequest(id, { admin_metadata: adminMetadata });
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
    setActionLoading("reject");
    try {
      await adminRejectRequest(id, rejectReason);
      showToast("Event request rejected.");
      setRejectOpen(false);
      setRejectReason("");
      load();
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to reject.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = async () => {
    setActionLoading("edit");
    try {
      await adminEditRequest(id, { ...editFields, admin_metadata: adminMetadata });
      showToast("Changes saved.");
      setEditOpen(false);
      load();
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to save.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="py-16 text-center text-sm text-gray-400">Loading...</div>;
  if (!data) return null;

  return (
    <div className="max-w-3xl">
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

      <button onClick={() => navigate(-1)} className="text-xs text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1">
        ← Back
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-lg font-bold text-gray-900">{data.title}</h1>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">ID: {data.event_id}</p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${STATUS_BADGE[data.status] || "bg-gray-100 text-gray-500"}`}>
          {data.status}
        </span>
      </div>

      {/* Action Buttons */}
      {data.status === "Pending Approval" && (
        <div className="flex flex-wrap gap-2 mb-5">
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
          <button onClick={() => setEditOpen(true)} className="px-4 py-2 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition">
            ✎ Edit
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
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5 space-y-4 shadow-sm">
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
                <option value="Top Tier">⭐ Top Tier</option>
                <option value="Medium Tier">⭐⭐ Medium Tier</option>
                <option value="Low Tier">⭐⭐⭐ Low Tier</option>
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
              <p className="text-xs font-semibold text-blue-600">{adminMetadata.is_featured ? "⭐ Featured Event" : "Not Featured"}</p>
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

      <div className="flex flex-col gap-4">
        {/* Requester Info */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Requester Information</p>
          <div className="grid grid-cols-2 gap-4">
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
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Event Information</p>
          <div className="grid grid-cols-2 gap-4">
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
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Media</p>
            <div className="flex flex-wrap gap-4">
              {data.poster_url && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Poster</p>
                  <img src={`${BASE_URL}${data.poster_url}`} alt="poster" className="max-h-48 rounded-lg object-contain border border-gray-100" />
                </div>
              )}
              {data.qr_code_url && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">QR Code</p>
                  <img src={`${BASE_URL}${data.qr_code_url}`} alt="qr" className="h-32 w-32 rounded-lg object-contain border border-gray-100" />
                </div>
              )}
              {data.brochure_url && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Brochure</p>
                  <a href={`${BASE_URL}${data.brochure_url}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                    📄 Download PDF
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Registration */}
        {data.registration_required && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
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
          <div className="bg-white rounded-xl border border-gray-100 p-5">
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
        {data.audience?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Target Audience</p>
            <div className="flex flex-wrap gap-2">
              {data.audience.map((a, i) => (
                <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                  {a.audience_type}: {a.audience_value}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={showApproveConfirm}
        onClose={() => setShowApproveConfirm(false)}
        onConfirm={handleConfirmApprove}
        title="Approve Request"
        message="Are you sure you want to approve this event request? It will be visible to students."
        confirmText="Approve"
        type="warning"
      />
    </div>
  );
}
