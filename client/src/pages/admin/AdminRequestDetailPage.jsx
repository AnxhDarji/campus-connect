import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adminGetRequest, adminApproveRequest, adminRejectRequest, adminEditRequest } from "../../services/eventService";

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
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  const load = () => {
    setLoading(true);
    adminGetRequest(id)
      .then((r) => { setData(r.data.data); setEditFields({ title: r.data.data.title, venue: r.data.data.venue, building: r.data.data.building || "", room: r.data.data.room || "", description: r.data.data.description || "" }); })
      .catch(() => navigate("/admin/all"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = async () => {
    if (!window.confirm("Approve this event request?")) return;
    setActionLoading("approve");
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
      await adminEditRequest(id, editFields);
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
          <button onClick={handleApprove} disabled={!!actionLoading} className="px-4 py-2 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition">
            {actionLoading === "approve" ? "Approving..." : "✓ Approve"}
          </button>
          <button onClick={() => setRejectOpen(true)} disabled={!!actionLoading} className="px-4 py-2 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition">
            ✗ Reject
          </button>
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
            <Row label="Start Time" value={data.start_time} />
            <Row label="End Time" value={data.end_time} />
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
    </div>
  );
}
