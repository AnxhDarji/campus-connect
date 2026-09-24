import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getEventCompletion, retryReportGeneration, generateAIPoster, regeneratePoster1, regeneratePoster2, approveAIPoster } from "../../services/eventService";
import PosterOverlayPreview from "../../components/PosterOverlayPreview";

const BASE_URL = "http://localhost:5000";

export default function EventReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback((bust = false) => {
    getEventCompletion(id, bust)
      .then((res) => setData(res.data.data))
      .catch(() => setError("Failed to load report."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Poll while report or poster is generating
  useEffect(() => {
    if (data?.report?.generation_status === "GENERATING" || data?.completion?.ai_generation_status === "GENERATING") {
      const timer = setTimeout(() => {
        load(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [data, load]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await retryReportGeneration(id);
      setData((prev) => prev ? {
        ...prev,
        report: {
          ...(prev.report || {}),
          generation_status: "GENERATING",
          report_data: null,
        },
      } : prev);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || "Retry failed.");
    } finally {
      setRetrying(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-400">Loading...</div>;
  if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-red-500">{error}</div>;

  const { event, completion, report, lifecycle_status } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <button onClick={() => navigate("/events/my")} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
          ← My Events
        </button>

        {/* Success banner */}
        {lifecycle_status === "COMPLETED" && (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-green-500 text-xl">✓</span>
            <div>
              <p className="text-sm font-semibold text-green-800">Completion Submitted Successfully</p>
              <p className="text-xs text-green-600">Event Status: COMPLETED</p>
            </div>
          </div>
        )}

        {/* Original Event Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-2">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 pb-2">Event Details</h2>
          <p className="text-base font-bold text-gray-900">{event.title}</p>
          <p className="text-xs text-gray-500">{event.category} · {event.department?.name}</p>
          <p className="text-xs text-gray-500">📍 {event.venue} · 📅 {new Date(event.start_date).toLocaleDateString()}</p>
        </div>

        {/* Completion Summary */}
        {completion && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 pb-2">Event Completion</h2>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-medium">Actual Attendance</p>
                <p className="text-gray-800 font-semibold">{completion.actual_attendance}</p>
              </div>
              {completion.key_highlights && (
                <div className="col-span-2">
                  <p className="text-[10px] text-gray-400 uppercase font-medium">Key Highlights</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{completion.key_highlights}</p>
                </div>
              )}
              {completion.winners_achievements && (
                <div className="col-span-2">
                  <p className="text-[10px] text-gray-400 uppercase font-medium">Winners / Achievements</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{completion.winners_achievements}</p>
                </div>
              )}
              {completion.special_guests && (
                <div className="col-span-2">
                  <p className="text-[10px] text-gray-400 uppercase font-medium">Special Guests</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{completion.special_guests}</p>
                </div>
              )}
              {completion.event_outcomes && (
                <div className="col-span-2">
                  <p className="text-[10px] text-gray-400 uppercase font-medium">Event Outcomes</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{completion.event_outcomes}</p>
                </div>
              )}
            </div>
            {completion.photos?.length > 0 && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-medium mb-2">Event Photos</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {completion.photos.map((url, i) => (
                    <a key={i} href={`${BASE_URL}${url}`} target="_blank" rel="noreferrer">
                      <img src={`${BASE_URL}${url}`} alt={`photo-${i}`} className="w-full aspect-square object-cover rounded-lg border border-gray-100 hover:opacity-90 transition" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Report */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-50 pb-2">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">AI Event Report</h2>
            {report?.generation_status === "GENERATED" && (
              <span className="text-xs text-green-600 font-semibold">Generated ✓</span>
            )}
            {report?.generation_status === "GENERATING" && (
              <span className="text-xs text-amber-500 font-semibold animate-pulse">Generating...</span>
            )}
            {report?.generation_status === "FAILED" && (
              <span className="text-xs text-red-500 font-semibold">Generation Failed</span>
            )}
            {(!report || report.generation_status === "NOT_GENERATED") && (
              <span className="text-xs text-gray-400">Not generated</span>
            )}
          </div>

          {report?.generation_status === "GENERATING" && (
            <p className="text-xs text-gray-400">The AI report is being generated. This page will refresh automatically...</p>
          )}

          {report?.generation_status === "FAILED" && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">Report generation failed. You can retry below.</p>
              {report.error_message && (
                <p className="text-xs text-red-500 break-words">Reason: {report.error_message}</p>
              )}
              <button onClick={handleRetry} disabled={retrying}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition disabled:opacity-60">
                {retrying ? "Retrying..." : "Retry Report Generation"}
              </button>
            </div>
          )}

          {report?.generation_status === "GENERATED" && report.report_data && (
            <div className="space-y-5 text-sm">
              <Section title="Event Overview" content={report.report_data.eventOverview} />
              <Section title="Participation Summary" content={report.report_data.participationSummary} />
              <ListSection title="Key Highlights" items={report.report_data.keyHighlights} />
              <ListSection title="Achievements" items={report.report_data.achievements} />
              <ListSection title="Event Outcomes" items={report.report_data.eventOutcomes} />
              <Section title="Conclusion" content={report.report_data.conclusion} />
              <p className="text-[10px] text-gray-400">Generated on {new Date(report.generated_at).toLocaleString()}</p>
              <button onClick={handleRetry} disabled={retrying}
                className="text-xs text-blue-600 hover:underline disabled:opacity-60">
                {retrying ? "Regenerating..." : "Regenerate Report"}
              </button>
            </div>
          )}
        </div>

        {/* AI Poster Generation & Review Section */}
        <AIPosterSection event={event} completion={completion} onUpdate={() => load(true)} />
      </div>
    </div>
  );
}

function AIPosterSection({ event, completion, onUpdate }) {
  const [generating, setGenerating] = useState(false);
  const [generating1, setGenerating1] = useState(false);
  const [generating2, setGenerating2] = useState(false);
  const [approving, setApproving] = useState(false);
  const [activeTab, setActiveTab] = useState("official"); // "official" or "activity"
  const [msg, setMsg] = useState("");

  if (!completion) return null;

  const status = completion.ai_generation_status || "NOT_GENERATED";
  const rawPosterUrl = activeTab === "official"
    ? completion.generated_poster_url
    : (completion.generated_activity_poster_url || completion.generated_poster_url);

  const stamp = completion?.updatedAt || completion?.updated_at ? new Date(completion.updatedAt || completion.updated_at).getTime() : 1;
  const currentPosterUrl = rawPosterUrl
    ? `${rawPosterUrl}${rawPosterUrl.includes("?") ? "&" : "?"}_v=${stamp}`
    : null;

  const handleGenerateBoth = async () => {
    setGenerating(true);
    setMsg("");
    try {
      await generateAIPoster(event._id);
      setMsg("Both posters generated successfully!");
      onUpdate();
    } catch (err) {
      setMsg(err.response?.data?.message || err.message || "Failed to generate AI posters.");
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenPoster1 = async () => {
    setGenerating1(true);
    setMsg("");
    try {
      await regeneratePoster1(event._id);
      setMsg("Poster 1 (Official Announcement) regenerated successfully!");
      onUpdate();
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to regenerate Poster 1.");
    } finally {
      setGenerating1(false);
    }
  };

  const handleRegenPoster2 = async () => {
    setGenerating2(true);
    setMsg("");
    try {
      await regeneratePoster2(event._id);
      setMsg("Poster 2 (Event Action Scene) regenerated successfully!");
      onUpdate();
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to regenerate Poster 2.");
    } finally {
      setGenerating2(false);
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    setMsg("");
    try {
      await approveAIPoster(event._id);
      setMsg("Posters approved successfully!");
      onUpdate();
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to approve posters.");
    } finally {
      setApproving(false);
    }
  };

  const isBusy = generating || generating1 || generating2;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-gray-50 pb-3">
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">AI Generated Event Posters</h2>
          <p className="text-xs text-gray-500 mt-0.5">Automated 2-poster suite (Official Announcement + Event Action & Highlights) powered by AI.</p>
        </div>
        <div>
          {status === "APPROVED" && <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">APPROVED ✓</span>}
          {status === "GENERATED" && <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">READY FOR REVIEW</span>}
          {status === "GENERATING" && <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full animate-pulse">GENERATING...</span>}
          {status === "GENERATION_FAILED" && <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">FAILED</span>}
          {status === "NOT_GENERATED" && <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">NOT GENERATED</span>}
        </div>
      </div>

      {/* Poster Switcher Tabs */}
      <div className="flex justify-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("official")}
          className={`px-4 py-2 text-xs font-semibold rounded-xl border transition ${
            activeTab === "official"
              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
              : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
          }`}
        >
          📢 1. Official Event Poster
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("activity")}
          className={`px-4 py-2 text-xs font-semibold rounded-xl border transition ${
            activeTab === "activity"
              ? "bg-amber-600 text-white border-amber-600 shadow-sm"
              : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
          }`}
        >
          🔥 2. Event Action & Highlights Poster
        </button>
      </div>

      {msg && <p className={`text-xs ${msg.includes("failed") || msg.includes("Failed") ? "text-red-500" : "text-green-600"} font-medium text-center`}>{msg}</p>}

      {/* Poster Preview */}
      <div className="py-2">
        <PosterOverlayPreview event={event} completion={completion} posterUrl={currentPosterUrl} posterType={activeTab} />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-gray-50">
        {activeTab === "official" ? (
          <button
            onClick={handleRegenPoster1}
            disabled={isBusy}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition disabled:opacity-60 flex items-center gap-2"
          >
            {generating1 ? "Generating Poster 1..." : "🔄 Regenerate Poster 1 Only"}
          </button>
        ) : (
          <button
            onClick={handleRegenPoster2}
            disabled={isBusy}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-sm transition disabled:opacity-60 flex items-center gap-2"
          >
            {generating2 ? "Generating Poster 2..." : "🔄 Regenerate Poster 2 (New Action Scene)"}
          </button>
        )}

        <button
          onClick={handleGenerateBoth}
          disabled={isBusy}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition disabled:opacity-60 flex items-center gap-2"
        >
          {generating ? "Generating Both Posters..." : "✨ Regenerate Both Suite Posters"}
        </button>

        {status === "GENERATED" && (
          <button
            onClick={handleApprove}
            disabled={approving || isBusy}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition disabled:opacity-60 flex items-center gap-1.5"
          >
            {approving ? "Approving..." : "✓ Approve Posters"}
          </button>
        )}
      </div>
    </div>
  );
}

function Section({ title, content }) {
  if (!content) return null;
  return (
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
      <p className="text-gray-700 leading-relaxed">{content}</p>
    </div>
  );
}

function ListSection({ title, items }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
      <ul className="list-disc list-inside space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-gray-700">{item}</li>
        ))}
      </ul>
    </div>
  );
}
