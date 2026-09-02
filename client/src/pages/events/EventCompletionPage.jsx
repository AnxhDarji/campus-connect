import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getEventCompletion, submitEventCompletion } from "../../services/eventService";
import { formatTime12h } from "../../utils/timeFormatter";

export default function EventCompletionPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    actual_attendance: "",
    key_highlights: "",
    winners_achievements: "",
    special_guests: "",
    event_outcomes: "",
  });
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const photoInputRef = useRef();

  useEffect(() => {
    getEventCompletion(id)
      .then((res) => setData(res.data.data))
      .catch(() => setError("Failed to load event details."))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    const combined = [...photos, ...files].slice(0, 10);
    setPhotos(combined);
    setPhotoPreviews(combined.map((f) => URL.createObjectURL(f)));
  };

  const removePhoto = (idx) => {
    const updated = photos.filter((_, i) => i !== idx);
    setPhotos(updated);
    setPhotoPreviews(updated.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const attendance = parseInt(form.actual_attendance, 10);
    if (isNaN(attendance) || attendance < 0) {
      setError("Actual attendance must be a non-negative number.");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("actual_attendance", attendance);
      if (form.key_highlights.trim()) fd.append("key_highlights", form.key_highlights.trim());
      if (form.winners_achievements.trim()) fd.append("winners_achievements", form.winners_achievements.trim());
      if (form.special_guests.trim()) fd.append("special_guests", form.special_guests.trim());
      if (form.event_outcomes.trim()) fd.append("event_outcomes", form.event_outcomes.trim());
      photos.forEach((f) => fd.append("photos", f));
      await submitEventCompletion(id, fd);
      navigate(`/events/${id}/report`);
    } catch (err) {
      setError(err.response?.data?.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-400">Loading...</div>;
  if (error && !data) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-red-500">{error}</div>;

  const { event, lifecycle_status } = data;

  if (lifecycle_status !== "AWAITING_COMPLETION") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-sm text-center">
          <p className="text-sm font-semibold text-gray-700 mb-2">Not eligible for completion</p>
          <p className="text-xs text-gray-400 mb-4">Current status: <span className="font-medium">{lifecycle_status}</span></p>
          <button onClick={() => navigate(-1)} className="text-xs text-blue-600 hover:underline">← Go back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="text-xs text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-1">
          ← Back
        </button>

        <h1 className="text-xl font-bold text-gray-900 mb-1">Event Completion</h1>
        <p className="text-xs text-gray-400 mb-6">Submit the actual details of what happened at the event.</p>

        {/* Read-only event context */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 pb-2">Original Event</h2>
          <p className="text-base font-bold text-gray-900">{event.title}</p>
          <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-medium">Date</p>
              <p>{new Date(event.start_date).toLocaleDateString()} – {new Date(event.end_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-medium">Time</p>
              <p>{formatTime12h(event.start_time)} – {formatTime12h(event.end_time)}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-medium">Venue</p>
              <p>{event.venue}{event.building ? `, ${event.building}` : ""}{event.room ? `, Room ${event.room}` : ""}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-medium">Organizer</p>
              <p>{event.requester_name}{event.organization_name ? ` · ${event.organization_name}` : ""}</p>
            </div>
          </div>
        </div>

        {/* Completion Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 pb-2">Completion Details</h2>

            <div>
              <label className="text-xs font-medium text-gray-700 uppercase tracking-wide block mb-1">
                Actual Attendance <span className="text-red-500">*</span>
              </label>
              <input
                type="number" min="0" max="100000" required
                value={form.actual_attendance}
                onChange={(e) => setForm((p) => ({ ...p, actual_attendance: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 184"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 uppercase tracking-wide block mb-1">Key Highlights</label>
              <textarea rows={3} value={form.key_highlights} maxLength={2000}
                onChange={(e) => setForm((p) => ({ ...p, key_highlights: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Describe what actually happened at the event..."
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 uppercase tracking-wide block mb-1">Winners / Achievements</label>
              <textarea rows={3} value={form.winners_achievements} maxLength={2000}
                onChange={(e) => setForm((p) => ({ ...p, winners_achievements: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="List winners, awards, or achievements. Write 'No winners / Not applicable' if none."
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 uppercase tracking-wide block mb-1">Special Guests</label>
              <textarea rows={3} value={form.special_guests} maxLength={1000}
                onChange={(e) => setForm((p) => ({ ...p, special_guests: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="e.g. Dr. ABC, Director XYZ Technologies"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 uppercase tracking-wide block mb-1">Event Outcomes</label>
              <textarea rows={3} value={form.event_outcomes} maxLength={2000}
                onChange={(e) => setForm((p) => ({ ...p, event_outcomes: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Describe the actual outcomes and impact of the event..."
              />
            </div>
          </div>

          {/* Photo Upload */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 pb-2">
              Event Photos <span className="font-normal">(up to 10, max 10MB each)</span>
            </h2>
            <div
              className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition"
              onClick={() => photoInputRef.current.click()}
            >
              <p className="text-xs text-gray-400">Click to add photos · JPG, PNG, WebP</p>
              <input ref={photoInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple className="hidden" onChange={handlePhotoChange} />
            </div>
            {photoPreviews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-2">
                {photoPreviews.map((src, i) => (
                  <div key={i} className="relative group">
                    <img src={src} alt={`photo-${i}`} className="w-full aspect-square object-cover rounded-lg border border-gray-100" />
                    <button type="button" onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button type="submit" disabled={submitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition disabled:opacity-60">
            {submitting ? "Submitting..." : "Submit Completion"}
          </button>
        </form>
      </div>
    </div>
  );
}
