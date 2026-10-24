import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMyRequests, deleteEventRequest } from "../../services/eventService";
import { ConfirmationModal, AlertModal } from "../../components/Modal";
import LoadingState from "../../components/LoadingState";

const STATUS_COLORS = {
  "Pending Approval": "bg-amber-100 text-amber-700",
  "Approved": "bg-green-100 text-green-700",
  "Rejected": "bg-red-100 text-red-700",
  "Returned for Changes": "bg-blue-100 text-blue-700",
  "Published": "bg-purple-100 text-purple-700",
  "Archived": "bg-gray-100 text-gray-500",
};

const LIFECYCLE_COLORS = {
  UPCOMING: "bg-sky-100 text-sky-700",
  ONGOING: "bg-emerald-100 text-emerald-700",
  AWAITING_COMPLETION: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-green-100 text-green-700",
};

export default function MyRequestsPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loadedRequestKey, setLoadedRequestKey] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  
  // Custom Modal States
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [alertInfo, setAlertInfo] = useState({ isOpen: false, title: "", message: "" });
  const loading = loadedRequestKey !== String(reloadKey);

  useEffect(() => {
    let current = true;
    getMyRequests()
      .then((r) => { if (current) setRequests(r.data.data || []); })
      .catch((err) => {
        if (current) setError(err.response?.data?.message || "Unable to load your event requests. Please try again.");
      })
      .finally(() => { if (current) setLoadedRequestKey(String(reloadKey)); });
    return () => { current = false; };
  }, [reloadKey]);

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
      <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <button onClick={() => navigate("/dashboard")} className="mb-2 inline-flex items-center text-xs text-gray-500 transition hover:text-gray-800">
              Back to dashboard
            </button>
            <h1 className="text-xl font-bold text-gray-900">My Event Requests</h1>
          </div>
          <button
            onClick={() => navigate("/events/create")}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700"
          >
            New request
          </button>
        </div>

        {error ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            <p className="font-semibold">Requests could not be loaded</p>
            <p className="mt-1 text-xs">{error}</p>
            <button type="button" onClick={() => { setError(""); setReloadKey((key) => key + 1); }} className="mt-3 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold transition hover:bg-red-100">Try again</button>
          </div>
        ) : loading ? (
          <LoadingState message="Loading requests..." size={32} />
        ) : requests.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-14 text-center shadow-sm">
            <p className="mb-4 text-sm text-gray-500">No event requests yet.</p>
            <button onClick={() => navigate("/events/create")} className="text-xs font-semibold text-blue-600 hover:underline">Create your first request</button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {requests.map((r) => (
              <div key={r._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{r.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {r.category} · {r.department_id?.name || "—"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Submitted: {new Date(r.created_at).toLocaleDateString()} · Updated: {new Date(r.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_COLORS[r.status] || "bg-gray-100 text-gray-500"}`}>
                      {r.status}
                    </span>
                    {r.lifecycle_status && (
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${LIFECYCLE_COLORS[r.lifecycle_status] || "bg-gray-100 text-gray-500"}`}>
                        {r.lifecycle_status.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-gray-100 pt-3">
                  <button
                    onClick={() => navigate(`/events/${r._id}`)}
                    className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                  >
                    View
                  </button>
                  {(r.status === "Pending Approval" || r.status === "Rejected" || r.status === "Returned for Changes") && (
                    <>
                      <button
                        onClick={() => navigate(`/events/${r._id}/edit`)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(r._id)}
                        disabled={deletingId === r._id}
                        className="text-xs text-red-500 hover:text-red-600 font-medium disabled:opacity-50"
                      >
                        {deletingId === r._id ? "Deleting..." : "Delete"}
                      </button>
                    </>
                  )}
                  {r.lifecycle_status === "AWAITING_COMPLETION" && (
                    <>
                      <button
                        onClick={() => navigate(`/events/${r._id}/complete`)}
                        className="text-xs text-orange-600 hover:text-orange-700 font-semibold"
                      >
                        Complete Event
                      </button>
                    </>
                  )}
                  {r.lifecycle_status === "COMPLETED" && (
                    <>
                      <button
                        onClick={() => navigate(`/events/${r._id}/report`)}
                        className="text-xs text-green-600 hover:text-green-700 font-semibold"
                      >
                        View Report
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
