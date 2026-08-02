import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getEventRequest } from "../../services/eventService";

const Row = ({ label, value }) =>
  value ? (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  ) : null;

export default function ViewEventPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEventRequest(id)
      .then((r) => setData(r.data.data))
      .catch(() => navigate("/events/my"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-400">Loading...</div>;
  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => navigate("/events/my")} className="text-xs text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1">
          ← My Requests
        </button>

        <div className="flex items-start justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">{data.title}</h1>
          {data.status === "Pending Approval" && (
            <button
              onClick={() => navigate(`/events/${id}/edit`)}
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Edit
            </button>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 grid grid-cols-2 gap-4">
            <Row label="Requester" value={data.requester_name} />
            <Row label="Role" value={data.requester_role === "Other" ? data.custom_role : data.requester_role} />
            <Row label="Organization Type" value={data.organization_type} />
            <Row label="Organization" value={data.organization_name} />
            <Row label="Contact" value={data.contact_number} />
            <Row label="Email" value={data.email} />
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 grid grid-cols-2 gap-4">
            <Row label="Category" value={data.category} />
            <Row label="Department" value={data.department_id?.name} />
            <Row label="Club" value={data.club_name} />
          </div>

          {data.description && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Description</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{data.description}</p>
            </div>
          )}

          {data.poster_url && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Poster</p>
              <img src={`http://localhost:5000${data.poster_url}`} alt="poster" className="max-h-64 rounded object-contain" />
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 grid grid-cols-2 gap-4">
            <Row label="Start Date" value={new Date(data.start_date).toLocaleDateString()} />
            <Row label="End Date" value={new Date(data.end_date).toLocaleDateString()} />
            <Row label="Start Time" value={data.start_time} />
            <Row label="End Time" value={data.end_time} />
            <Row label="Venue" value={data.venue} />
            <Row label="Building" value={data.building} />
            <Row label="Room" value={data.room} />
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Status</p>
            <p className="text-sm font-semibold text-blue-600">{data.status}</p>
            <p className="text-xs text-gray-400 mt-1 font-mono">ID: {data.event_id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
