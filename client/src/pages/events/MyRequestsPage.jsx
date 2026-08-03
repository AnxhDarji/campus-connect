import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMyRequests, deleteEventRequest } from "../../services/eventService";
import { ConfirmationModal, AlertModal } from "../../components/Modal";

const STATUS_COLORS = {
  "Pending Approval": "bg-amber-100 text-amber-700",
  "Approved": "bg-green-100 text-green-700",
  "Rejected": "bg-red-100 text-red-700",
  "Returned for Changes": "bg-blue-100 text-blue-700",
  "Published": "bg-purple-100 text-purple-700",
  "Archived": "bg-gray-100 text-gray-500",
};

export default function MyRequestsPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  
  // Custom Modal States
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [alertInfo, setAlertInfo] = useState({ isOpen: false, title: "", message: "" });

  const load = () => {
    setLoading(true);
    getMyRequests()
      .then((r) => setRequests(r.data.data))
      .catch(() => setError("Failed to load requests."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDeleteClick = (id) => {
    setConfirmTarget(id);
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmTarget) return;
    setShowConfirm(false);
    setDeletingId(confirmTarget);
    try {
      await deleteEventRequest(confirmTarget);
      setRequests((prev) => prev.filter((r) => r._id !== confirmTarget));
    } catch (e) {
      setAlertInfo({
        isOpen: true,
        title: "Delete Failed",
        message: e.response?.data?.message || "Delete failed."
      });
    } finally {
      setDeletingId(null);
      setConfirmTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button onClick={() => navigate("/dashboard")} className="text-xs text-gray-400 hover:text-gray-600 mb-2 flex items-center gap-1">
              ← Back to Dashboard
            </button>
            <h1 className="text-xl font-bold text-gray-900">My Event Requests</h1>
          </div>
          <button
            onClick={() => navigate("/events/create")}
            className="px-4 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            + New Request
          </button>
        </div>

        {error && <p className="text-xs text-red-500 mb-4">{error}</p>}

        {loading ? (
          <div className="text-center py-16 text-sm text-gray-400">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-gray-400 mb-4">No event requests yet.</p>
            <button onClick={() => navigate("/events/create")} className="text-xs text-blue-600 hover:underline">Create your first request →</button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {requests.map((r) => (
              <div key={r._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{r.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {r.category} · {r.department_id?.name || "—"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Submitted: {new Date(r.created_at).toLocaleDateString()} · Updated: {new Date(r.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_COLORS[r.status] || "bg-gray-100 text-gray-500"}`}>
                    {r.status}
                  </span>
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-50">
                  <button
                    onClick={() => navigate(`/events/${r._id}`)}
                    className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                  >
                    View
                  </button>
                  {(r.status === "Pending Approval" || r.status === "Rejected" || r.status === "Returned for Changes") && (
                    <>
                      <span className="text-gray-200">|</span>
                      <button
                        onClick={() => navigate(`/events/${r._id}/edit`)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Edit
                      </button>
                      <span className="text-gray-200">|</span>
                      <button
                        onClick={() => handleDeleteClick(r._id)}
                        disabled={deletingId === r._id}
                        className="text-xs text-red-500 hover:text-red-600 font-medium disabled:opacity-50"
                      >
                        {deletingId === r._id ? "Deleting..." : "Delete"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={showConfirm}
        onClose={() => { setShowConfirm(false); setConfirmTarget(null); }}
        onConfirm={handleConfirmDelete}
        title="Delete Request"
        message="Are you sure you want to delete this event request? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />

      <AlertModal
        isOpen={alertInfo.isOpen}
        onClose={() => setAlertInfo({ isOpen: false, title: "", message: "" })}
        title={alertInfo.title}
        message={alertInfo.message}
      />
    </div>
  );
}
