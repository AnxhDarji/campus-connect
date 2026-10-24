import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getEventCompletion, retryReportGeneration } from "../../services/eventService";
import InstagramPostPanel from "../../components/InstagramPostPanel";
import { mediaUrl } from "../../utils/mediaUrl";
import LoadingState from "../../components/LoadingState";

export default function EventReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback((bust = false) => {
    getEventCompletion(id, bust)
      .then((res) => {
        setData(res.data.data);
        setError("");
      })
      .catch(() => setError("Failed to load report."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (data?.report?.generation_status === "GENERATING") {
      const timer = setTimeout(() => load(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [data, load]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await retryReportGeneration(id);
      setData((prev) => prev ? {
        ...prev,
        report: { ...(prev.report || {}), generation_status: "GENERATING", report_data: null },
      } : prev);
      setLoading(false);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Retry failed.");
    } finally {
      setRetrying(false);
    }
  };

  if (loading) return <LoadingState message="Loading event report..." />;
  if (error && !data) return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center" role="alert">
      <h1 className="text-base font-semibold text-red-800">Report unavailable</h1>
      <p className="mt-2 text-sm text-red-700">{error}</p>
      <div className="mt-4 flex justify-center gap-2">
        <button type="button" onClick={() => navigate("/events/my")} className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-white">Back to my events</button>
        <button type="button" onClick={() => { setLoading(true); setError(""); load(true); }} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700">Try again</button>
      </div>
    </div>
  );

  const { event, completion, report, lifecycle_status: lifecycleStatus } = data;
  const postEventImage = mediaUrl(completion?.post_event_image_url);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:py-8">
      <div className="mx-auto max-w-4xl space-y-4">
        <button onClick={() => navigate("/events/my")} className="text-xs text-gray-500 transition hover:text-gray-800">
          Back to my events
        </button>

        {lifecycleStatus === "COMPLETED" && (
          <div className="flex items-center gap-3 rounded-xl border border-green-100 bg-green-50 p-3">
            <div>
              <p className="text-sm font-semibold text-green-800">Completion submitted successfully</p>
              <p className="text-xs text-green-700">Event status: COMPLETED</p>
            </div>
          </div>
        )}

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-semibold text-gray-800">{event.title}</h2>
          <p className="mt-1 text-xs text-gray-500">
            {event.category}{event.department?.name ? ` · ${event.department.name}` : ""} · {event.venue} · {new Date(event.start_date).toLocaleDateString()}
          </p>
        </section>

        {completion && (
          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-3 border-b border-gray-100 pb-2 text-sm font-semibold text-gray-800">Completion Report</h2>
            <dl className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
              <SummaryItem label="Actual attendance" value={completion.actual_attendance} />
              <SummaryItem label="Special guests" value={completion.special_guests} />
              <SummaryItem label="Key highlights" value={completion.key_highlights} />
              <SummaryItem label="Winners / achievements" value={completion.winners_achievements} />
              <SummaryItem label="Event outcomes" value={completion.event_outcomes} />
            </dl>
          </section>
        )}

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="mb-3 border-b border-gray-100 pb-2 text-sm font-semibold text-gray-800">Post-Event Image</h2>
          {postEventImage
            ? <img src={postEventImage} alt={`Post-event image for ${event.title}`} className="max-h-72 max-w-48 rounded-lg border border-gray-100 object-contain" />
            : <p className="text-xs text-gray-500">No post-event image was added.</p>}
        </section>

        <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-2">
            <h2 className="text-sm font-semibold text-gray-800">AI Event Report</h2>
            <ReportStatus status={report?.generation_status} />
          </div>

          {report?.generation_status === "GENERATING" && (
            <p className="text-xs text-gray-500">The report is being generated and this page will refresh automatically.</p>
          )}
          {report?.generation_status === "FAILED" && (
            <div className="space-y-2">
              <p className="text-xs text-red-600">{report.error_message || "Report generation failed."}</p>
              <button type="button" onClick={handleRetry} disabled={retrying}
                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">
                {retrying ? "Retrying..." : "Retry report generation"}
              </button>
            </div>
          )}
          {report?.generation_status === "GENERATED" && report.report_data && (
            <div className="space-y-4 text-sm">
              <SummaryItem label="Event overview" value={report.report_data.eventOverview} />
              <SummaryItem label="Participation summary" value={report.report_data.participationSummary} />
              <SummaryList label="Key highlights" values={report.report_data.keyHighlights} />
              <SummaryList label="Achievements" values={report.report_data.achievements} />
              <SummaryList label="Event outcomes" values={report.report_data.eventOutcomes} />
              <SummaryItem label="Conclusion" value={report.report_data.conclusion} />
              {report.generated_at && <p className="text-[10px] text-gray-400">Generated on {new Date(report.generated_at).toLocaleString()}</p>}
              <button type="button" onClick={handleRetry} disabled={retrying} className="text-xs text-blue-600 hover:underline disabled:opacity-60">
                {retrying ? "Regenerating..." : "Regenerate report"}
              </button>
            </div>
          )}
          {error && data && <p role="alert" className="mt-3 text-xs text-red-600">{error}</p>}
        </section>

        {completion && completion.post_to_instagram !== false && (
          <InstagramPostPanel
            eventId={event._id}
            postType="EVENT_RESULT"
            postEventImageUrl={completion.post_event_image_url || null}
            title="Instagram Event Result"
          />
        )}
      </div>
    </div>
  );
}

function SummaryItem({ label, value }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="sm:col-span-2">
      <dt className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="whitespace-pre-wrap text-gray-700">{value}</dd>
    </div>
  );
}

function SummaryList({ label, values }) {
  if (!values?.length) return null;
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <ul className="list-inside list-disc space-y-1 text-gray-700">
        {values.map((value, index) => <li key={`${label}-${index}`}>{value}</li>)}
      </ul>
    </div>
  );
}

function ReportStatus({ status }) {
  const display = {
    GENERATED: ["Generated", "text-green-700"],
    GENERATING: ["Generating...", "text-amber-600"],
    FAILED: ["Failed", "text-red-600"],
    NOT_GENERATED: ["Not generated", "text-gray-500"],
  }[status || "NOT_GENERATED"];
  return <span className={`text-xs font-medium ${display[1]}`}>{display[0]}</span>;
}
