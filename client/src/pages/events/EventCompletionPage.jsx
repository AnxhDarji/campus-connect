import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { generatePostEventImage, getEventCompletion, submitEventCompletion, uploadPoster } from "../../services/eventService";
import { formatTime12h } from "../../utils/timeFormatter";
import EventImageSelector from "../../components/EventImageSelector";
import LoadingState from "../../components/LoadingState";

const INITIAL_FORM = {
  actual_attendance: "",
  key_highlights: "",
  winners_achievements: "",
  special_guests: "",
  event_outcomes: "",
  post_to_instagram: "no",
};

export default function EventCompletionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loadedRequestKey, setLoadedRequestKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [form, setForm] = useState(INITIAL_FORM);
  const [postEventImageUrl, setPostEventImageUrl] = useState("");
  const requestKey = `${id}:${reloadKey}`;
  const loading = loadedRequestKey !== requestKey;

  useEffect(() => {
    let current = true;
    getEventCompletion(id)
      .then((res) => {
        if (current) {
          setData(res.data.data);
          setError("");
        }
      })
      .catch((err) => {
        if (current) setError(err.response?.data?.message || "Failed to load event details.");
      })
      .finally(() => { if (current) setLoadedRequestKey(requestKey); });
    return () => { current = false; };
  }, [id, requestKey]);

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const attendance = Number(form.actual_attendance);
    if (!Number.isInteger(attendance) || attendance < 0 || attendance > 100000) {
      setError("Actual attendance must be a whole number between 0 and 100,000.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("actual_attendance", String(attendance));
      for (const field of ["key_highlights", "winners_achievements", "special_guests", "event_outcomes"]) {
        const value = form[field].trim();
        if (value) formData.append(field, value);
      }
      if (postEventImageUrl) formData.append("post_event_image_url", postEventImageUrl);
      formData.append("post_to_instagram", String(form.post_to_instagram === "yes"));

      await submitEventCompletion(id, formData);
      navigate(`/events/${id}/report`);
    } catch (err) {
      setError(err.response?.data?.message || "Submission failed. Your entered details are still available; please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading event details..." />;
  if (error && !data) return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center" role="alert">
      <h1 className="text-base font-semibold text-red-800">Event details unavailable</h1>
      <p className="mt-2 text-sm text-red-700">{error}</p>
      <div className="mt-4 flex justify-center gap-2">
        <button type="button" onClick={() => navigate(-1)} className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-white">Go back</button>
        <button type="button" onClick={() => { setError(""); setReloadKey((key) => key + 1); }} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700">Try again</button>
      </div>
    </div>
  );

  const { event, lifecycle_status: lifecycleStatus } = data;

  if (lifecycleStatus !== "AWAITING_COMPLETION") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-sm rounded-xl border border-gray-100 bg-white p-6 text-center shadow-sm">
          <p className="mb-2 text-sm font-semibold text-gray-700">Not eligible for completion</p>
          <p className="mb-4 text-xs text-gray-500">Current status: <span className="font-medium">{lifecycleStatus}</span></p>
          <button onClick={() => navigate(-1)} className="text-xs text-blue-600 hover:underline">Go back</button>
        </div>
      </div>
    );
  }

  const compactInput = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const textArea = `${compactInput} resize-y`;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <header>
          <button onClick={() => navigate(-1)} className="mb-2 text-xs text-gray-500 transition hover:text-gray-800">Back</button>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Event completion report</h1>
          <p className="mt-1 text-xs text-gray-500">Record what happened and preview the post-event image before submitting.</p>
        </header>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="text-base font-semibold text-gray-900">{event.title}</h2>
            <p className="text-xs text-gray-500">{event.category}{event.department?.name ? ` · ${event.department.name}` : ""}</p>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-gray-600 sm:grid-cols-2 lg:grid-cols-4">
            <p><span className="font-medium text-gray-400">Date</span><br />{new Date(event.start_date).toLocaleDateString()} – {new Date(event.end_date).toLocaleDateString()}</p>
            <p><span className="font-medium text-gray-400">Time</span><br />{formatTime12h(event.start_time)} – {formatTime12h(event.end_time)}</p>
            <p><span className="font-medium text-gray-400">Venue</span><br />{event.venue}{event.building ? `, ${event.building}` : ""}{event.room ? `, Room ${event.room}` : ""}</p>
            <p><span className="font-medium text-gray-400">Organizer</span><br />{event.requester_name}{event.organization_name ? ` · ${event.organization_name}` : ""}</p>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-4">
          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-3 border-b border-gray-100 pb-2 text-sm font-semibold text-gray-800">Completion Details</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs font-medium text-gray-700">
                Actual attendance <span className="text-red-500">*</span>
                <input
                  type="number"
                  min="0"
                  max="100000"
                  step="1"
                  required
                  value={form.actual_attendance}
                  onChange={(e) => setField("actual_attendance", e.target.value)}
                  className={compactInput}
                  placeholder="Enter the actual count"
                />
              </label>
              <label className="space-y-1 text-xs font-medium text-gray-700">
                Special guests
                <textarea rows={2} maxLength={1000} value={form.special_guests}
                  onChange={(e) => setField("special_guests", e.target.value)}
                  className={textArea} placeholder="Names, if applicable" />
              </label>
              <label className="space-y-1 text-xs font-medium text-gray-700">
                Key highlights
                <textarea rows={3} maxLength={2000} value={form.key_highlights}
                  onChange={(e) => setField("key_highlights", e.target.value)}
                  className={textArea} placeholder="Describe the actual highlights" />
              </label>
              <label className="space-y-1 text-xs font-medium text-gray-700">
                Winners / achievements
                <textarea rows={3} maxLength={2000} value={form.winners_achievements}
                  onChange={(e) => setField("winners_achievements", e.target.value)}
                  className={textArea} placeholder="Include only confirmed results" />
              </label>
              <label className="space-y-1 text-xs font-medium text-gray-700 sm:col-span-2">
                Event outcomes
                <textarea rows={3} maxLength={2000} value={form.event_outcomes}
                  onChange={(e) => setField("event_outcomes", e.target.value)}
                  className={textArea} placeholder="Summarize the actual outcomes" />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <EventImageSelector
              label="Post-Event Image"
              value={postEventImageUrl}
              onChange={setPostEventImageUrl}
              uploadFn={uploadPoster}
              generateFn={() => generatePostEventImage(id, {
                key_highlights: form.key_highlights,
                winners_achievements: form.winners_achievements,
                special_guests: form.special_guests,
                event_outcomes: form.event_outcomes,
              })}
            />
          </section>

          <fieldset className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <legend className="px-1 text-sm font-semibold text-gray-800">Would you like to post this event announcement on Instagram?</legend>
            <div className="mt-2 flex gap-3">
              {["yes", "no"].map((option) => (
                <label key={option} className={`flex min-w-24 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${form.post_to_instagram === option ? "border-purple-500 bg-purple-50 text-purple-800" : "border-gray-200 text-gray-600"}`}>
                  <input type="radio" name="post_to_instagram" value={option}
                    checked={form.post_to_instagram === option}
                    onChange={(e) => setField("post_to_instagram", e.target.value)}
                    className="accent-purple-600" />
                  {option === "yes" ? "Yes" : "No"}
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">Choosing Yes enables the existing Instagram draft and review workflow after the report is saved. No post is started when you choose No.</p>
          </fieldset>

          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

          <button type="submit" disabled={submitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">
            {submitting ? "Submitting report..." : "Submit Completion Report"}
          </button>
        </form>
      </div>
    </div>
  );
}
