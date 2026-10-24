import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getEventRequest, getPublishedEvents, toggleBookmark, getBookmarks, getEventCompletion, registerForEvent, getMyRegistration } from "../../services/eventService";
import { formatTime12h } from "../../utils/timeFormatter";
import { audienceLabel } from "../../utils/charusatData";
import { useAuth } from "../../context/AuthContext";
import { mediaUrl } from "../../utils/mediaUrl";
import LoadingState from "../../components/LoadingState";

const LIFECYCLE_COLORS = {
  UPCOMING: "bg-sky-100 text-sky-700",
  ONGOING: "bg-emerald-100 text-emerald-700",
  AWAITING_COMPLETION: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-green-100 text-green-700",
};

export default function EventDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [completionData, setCompletionData] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarkError, setBookmarkError] = useState("");
  const [similarError, setSimilarError] = useState("");
  const [completionError, setCompletionError] = useState("");
  const [loadedRequestKey, setLoadedRequestKey] = useState("");
  const [pageError, setPageError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [toast, setToast] = useState(null);
  const requestKey = `${id}:${reloadKey}`;
  const loading = loadedRequestKey !== requestKey;

  // ── Registration state (must be at top level, before any early returns) ──
  const [myReg, setMyReg] = useState(undefined);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");

  useEffect(() => {
    let current = true;
    getEventRequest(id)
      .then((res) => {
        if (!current) return;
        const eventData = res.data.data;
        setData(eventData);
        setPageError("");
        getPublishedEvents({ category: eventData.category, limit: 4 })
          .then((simRes) => {
            if (current) {
              setSimilar((simRes.data.data || []).filter(e => e._id !== id).slice(0, 3));
              setSimilarError("");
            }
          })
          .catch((err) => {
            if (current) setSimilarError(err.response?.data?.message || "Similar events could not be loaded.");
          });
        // Fetch completion data (works for owner + admin; silently ignored for others)
        getEventCompletion(id)
          .then((r) => {
            if (current) {
              setCompletionData(r.data.data);
              setCompletionError("");
            }
          })
          .catch((err) => {
            if (current && err.response?.status !== 403) {
              setCompletionError(err.response?.data?.message || "Completion details could not be loaded.");
            }
          });
      })
      .catch((err) => {
        if (current) setPageError(err.response?.data?.message || "Unable to load this event. Please try again.");
      })
      .finally(() => { if (current) setLoadedRequestKey(requestKey); });

    getBookmarks()
      .then((r) => {
        if (current) {
          setBookmarks((r.data.data || []).map(b => b._id));
          setBookmarkError("");
        }
      })
      .catch((err) => {
        if (current) setBookmarkError(err.response?.data?.message || "Bookmark status could not be loaded.");
      });
    return () => { current = false; };
  }, [id, requestKey]);

  // Fetch this student's registration whenever the event id changes
  useEffect(() => {
    if (!user) { setMyReg(null); return; }
    setMyReg(undefined);
    getMyRegistration(id)
      .then((res) => setMyReg(res.data.data))
      .catch(() => setMyReg(null));
  }, [id, user]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleToggleBookmark = async () => {
    try {
      const res = await toggleBookmark(data._id);
      if (res.data.bookmarked) {
        setBookmarks((prev) => [...prev, data._id]);
        showToast("Added to bookmarks!");
      } else {
        setBookmarks((prev) => prev.filter((bId) => bId !== data._id));
        showToast("Removed from bookmarks!");
      }
    } catch {
      showToast("Failed to update bookmark.");
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("Event link copied to clipboard.");
    } catch {
      showToast("Unable to copy the event link.");
    }
  };

  const handleRegister = async () => {
    setRegLoading(true);
    setRegError("");
    setRegSuccess("");
    try {
      await registerForEvent(id);
      setRegSuccess("Registered successfully! Your QR pass is ready.");
      const res = await getMyRegistration(id);
      setMyReg(res.data.data);
    } catch (err) {
      setRegError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setRegLoading(false);
    }
  };

  if (authLoading || loading) return <LoadingState message="Loading event details..." />;
  if (pageError) return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center" role="alert">
      <h1 className="text-base font-semibold text-red-800">Event unavailable</h1>
      <p className="mt-2 text-sm text-red-700">{pageError}</p>
      <div className="mt-4 flex justify-center gap-2">
        <button type="button" onClick={() => navigate("/events")} className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-white">Back to events</button>
        <button type="button" onClick={() => { setPageError(""); setReloadKey((key) => key + 1); }} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700">Try again</button>
      </div>
    </div>
  );
  if (!data) return null;

  const isBookmarked = bookmarks.includes(data._id);
  const currentUserId = (user?._id || user?.id)?.toString();
  const submittedBy = (typeof data.submitted_by === "object" ? data.submitted_by?._id : data.submitted_by)?.toString();
  const isOwner = !!(user && submittedBy && currentUserId && submittedBy === currentUserId);
  const lifecycle = completionData?.lifecycle_status ?? null;
  const registrationOpen = lifecycle === "UPCOMING" || lifecycle === "ONGOING" || ["Approved", "Published"].includes(data.status);
  const completion = completionData?.completion ?? null;
  const report = completionData?.report ?? null;

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg font-medium animate-slide-in">
          {toast}
        </div>
      )}
      {bookmarkError && <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{bookmarkError}</p>}

      {/* Back navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition cursor-pointer"
        >
          Back to events
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleToggleBookmark}
            className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${isBookmarked
              ? "bg-blue-50 border-blue-200 text-blue-600 shadow-sm"
              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm"
              }`}
          >
            <svg className="w-4 h-4" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            {isBookmarked ? "Bookmarked" : "Bookmark"}
          </button>
          <button
            onClick={handleShare}
            className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 10.742l4.636-2.318m0 0a3 3 0 100-4.184m0 4.184a3 3 0 010-4.184m-4.636 6.502a3 3 0 11-4.636-4.185m4.636 4.185l4.636 2.318m0 0a3 3 0 100 4.184m0-4.184a3 3 0 010 4.184" />
            </svg>
            Share Event
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">

        {/* Left column - main content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Main Card: Image / Title */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="relative aspect-video bg-slate-900">
              {data.poster_url ? (
                <img src={mediaUrl(data.poster_url)} alt={data.title} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950 to-slate-900 text-white">
                  <span className="text-xs uppercase font-mono tracking-widest text-indigo-300">Poster Coming Soon</span>
                </div>
              )}
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-3 py-1 bg-white/95 backdrop-blur-sm text-gray-800 text-xs font-bold rounded-full shadow">
                  {data.category}
                </span>
                {data.admin_metadata?.badge && (
                  <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full shadow">
                    {data.admin_metadata.badge}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4 p-5 sm:p-7">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                  {data.title}
                </h1>
                <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-blue-600">
                  {data.department_id?.name || "All Departments"} {data.club_name && `· ${data.club_name}`}
                </p>
                {lifecycle && (
                  <span className={`inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-full ${LIFECYCLE_COLORS[lifecycle] || "bg-gray-100 text-gray-500"}`}>
                    {lifecycle.replace(/_/g, " ")}
                  </span>
                )}
              </div>

              {data.description && (
                <div className="space-y-2 pt-4 border-t border-gray-50">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">About this Event</h3>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{data.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Target Audience */}
          {data.audience?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Target Audience</h3>
              <div className="flex flex-col gap-2">
                {data.audience.map((aud, i) => {
                  const label = aud.audience_type === "OTHER"
                    ? (aud.custom_audience || null)
                    : audienceLabel(aud);
                  if (!label) return null;
                  return (
                    <span key={i} className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                      {aud.audience_type === "OTHER" ? `Other: ${label}` : label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Similar Events */}
          {similar.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-gray-900">Similar {data.category} Events</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {similar.map((e) => (
                  <Link
                    to={`/events/${e._id}`}
                    key={e._id}
                    className="group bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col cursor-pointer"
                  >
                    <div className="aspect-[16/10] bg-slate-900 relative">
                      {e.poster_url ? (
                        <img src={mediaUrl(e.poster_url)} alt={e.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-950 to-slate-900 text-xs font-medium text-indigo-200">No poster</div>
                      )}
                      {similarError && <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{similarError}</p>}
                    </div>
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <h4 className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                        {e.title}
                      </h4>
                      <p className="text-[10px] text-gray-400 mt-2">
                        {new Date(e.start_date).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ── EVENT COMPLETION SECTION (owner only, after event ends) ── */}
          {isOwner && lifecycle === "AWAITING_COMPLETION" && (
            <div className="space-y-3 rounded-2xl border border-orange-200 bg-orange-50 p-5">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-orange-800">Event Completion Required</h3>
              </div>
              <p className="text-xs text-orange-700">Your event has ended. Please submit the completion details so an AI report can be generated.</p>
              <button
                onClick={() => navigate(`/events/${id}/complete`)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition"
              >
                Complete event
              </button>
            </div>
          )}

          {/* ── COMPLETION DATA (visible after COMPLETED) ── */}
          {completion && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 pb-2">Event Completion</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-medium">Actual Attendance</p>
                  <p className="text-gray-800 font-semibold text-sm">{completion.actual_attendance}</p>
                </div>
                {completion.key_highlights && (
                  <div className="col-span-2">
                    <p className="text-[10px] text-gray-400 uppercase font-medium">Key Highlights</p>
                    <p className="text-gray-700 whitespace-pre-wrap">{completion.key_highlights}</p>
                  </div>
                )}
                {completionError && <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{completionError}</p>}
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
              {(completion.post_event_image_url || completion.photos?.length > 0) && (
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-medium mb-2">Post-Event Image</p>
                  {completion.post_event_image_url && (
                    <a href={mediaUrl(completion.post_event_image_url)} target="_blank" rel="noreferrer">
                      <img src={mediaUrl(completion.post_event_image_url)} alt={`Post-event image for ${data.title}`} className="mb-2 max-h-64 max-w-48 rounded-lg border border-gray-100 object-contain" />
                    </a>
                  )}
                  {completion.photos?.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {completion.photos.map((url, i) => (
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

          {/* ── AI REPORT SECTION ── */}
          {report && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">AI Event Report</h3>
                {report.generation_status === "GENERATED" && <span className="text-xs font-semibold text-green-700">Generated</span>}
                {report.generation_status === "GENERATING" && <span className="text-xs text-amber-500 font-semibold animate-pulse">Generating...</span>}
                {report.generation_status === "FAILED" && <span className="text-xs text-red-500 font-semibold">Failed</span>}
              </div>
              {report.generation_status === "GENERATED" && report.report_data && (
                <div className="space-y-4 text-sm">
                  {report.report_data.eventOverview && (
                    <div><p className="text-[10px] text-gray-400 uppercase font-medium mb-1">Event Overview</p><p className="text-gray-700">{report.report_data.eventOverview}</p></div>
                  )}
                  {report.report_data.participationSummary && (
                    <div><p className="text-[10px] text-gray-400 uppercase font-medium mb-1">Participation Summary</p><p className="text-gray-700">{report.report_data.participationSummary}</p></div>
                  )}
                  {report.report_data.keyHighlights?.length > 0 && (
                    <div><p className="text-[10px] text-gray-400 uppercase font-medium mb-1">Key Highlights</p><ul className="list-disc list-inside space-y-1">{report.report_data.keyHighlights.map((h, i) => <li key={i} className="text-gray-700">{h}</li>)}</ul></div>
                  )}
                  {report.report_data.achievements?.length > 0 && (
                    <div><p className="text-[10px] text-gray-400 uppercase font-medium mb-1">Achievements</p><ul className="list-disc list-inside space-y-1">{report.report_data.achievements.map((a, i) => <li key={i} className="text-gray-700">{a}</li>)}</ul></div>
                  )}
                  {report.report_data.eventOutcomes?.length > 0 && (
                    <div><p className="text-[10px] text-gray-400 uppercase font-medium mb-1">Event Outcomes</p><ul className="list-disc list-inside space-y-1">{report.report_data.eventOutcomes.map((o, i) => <li key={i} className="text-gray-700">{o}</li>)}</ul></div>
                  )}
                  {report.report_data.conclusion && (
                    <div><p className="text-[10px] text-gray-400 uppercase font-medium mb-1">Conclusion</p><p className="text-gray-700">{report.report_data.conclusion}</p></div>
                  )}
                </div>
              )}
              {report.generation_status === "GENERATING" && (
                <p className="text-xs text-gray-400">The AI report is being generated...</p>
              )}
              {report.generation_status === "FAILED" && isOwner && (
                <button onClick={() => navigate(`/events/${id}/report`)} className="text-xs text-blue-600 hover:underline">Go to report page to retry</button>
              )}
            </div>
          )}

          {/* Owner quick-link to full report page */}
          {isOwner && lifecycle === "COMPLETED" && (
            <div className="flex justify-end">
              <button onClick={() => navigate(`/events/${id}/report`)} className="text-xs font-medium text-blue-600 hover:underline">View full report</button>
            </div>
          )}
        </div>

        {/* Right column - sidebar details */}
        <div className="space-y-6">

          {/* Scheduling & Venue Card */}
          <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 pb-2">Event Schedule & Location</h3>

            <div className="space-y-4 text-xs">
              <div className="flex gap-3">
                <div>
                  <p className="font-semibold text-gray-900">Date Range</p>
                  <p className="text-gray-500 mt-0.5">
                    {new Date(data.start_date).toLocaleDateString()} – {new Date(data.end_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div>
                  <p className="font-semibold text-gray-900">Timing</p>
                  <p className="text-gray-500 mt-0.5">{formatTime12h(data.start_time)} – {formatTime12h(data.end_time)}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div>
                  <p className="font-semibold text-gray-900">Venue</p>
                  <p className="text-gray-500 mt-0.5">
                    {data.venue}{data.building && `, ${data.building}`}{data.room && `, Room ${data.room}`}
                  </p>
                  {data.google_map_url && (
                    <a
                      href={data.google_map_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-1 text-[10px] text-blue-600 hover:underline"
                    >
                      View on Google Maps
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Registration Details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4 text-center">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider text-left border-b border-gray-50 pb-2">Registration</h3>

            {/* Organizer controls */}
            {isOwner && (
              <div className="space-y-2 text-left">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">Organizer Controls</p>
                <button
                  onClick={() => navigate(`/events/${id}/organizer`)}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition text-center block"
                >
                  Open Organizer Dashboard
                </button>
              </div>
            )}

            {/* Student registration */}
            {!isOwner && data.registration_required && (
              <div className="space-y-3">
                {regError && (
                  <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{regError}</p>
                )}
                {regSuccess && (
                  <p role="status" className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">{regSuccess}</p>
                )}

                {myReg === undefined ? (
                  <div className="py-2 text-xs text-gray-400">Checking registration...</div>
                ) : myReg ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-1.5 rounded-lg border border-green-200 bg-green-50 py-2 text-xs font-semibold text-green-700">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      You are registered
                    </div>
                    <button
                      onClick={() => navigate(`/events/${id}/qr-pass`)}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                    >
                      View / Download QR Pass
                    </button>
                  </div>
                ) : registrationOpen ? (
                  <>
                    {data.registration_deadline && (
                      <p className="text-[10px] text-red-500 font-semibold uppercase tracking-wide">
                        Deadline: {new Date(data.registration_deadline).toLocaleDateString()}
                      </p>
                    )}
                    <button
                      onClick={handleRegister}
                      disabled={regLoading}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold shadow-sm transition"
                    >
                      {regLoading && (
                        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-90" fill="currentColor" d="M12 3a9 9 0 0 0-9 9h3a6 6 0 0 1 6-6V3Z" />
                        </svg>
                      )}
                      {regLoading ? "Registering..." : "Register for this Event"}
                    </button>
                  </>
                ) : (
                  <div className="py-4 text-xs text-gray-500 font-medium">
                    Registration is closed for this event.
                  </div>
                )}

                {data.registration_link && (
                  <a href={data.registration_link} target="_blank" rel="noreferrer"
                    className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold border border-gray-100 transition text-center block">
                    External Registration Link
                  </a>
                )}
              </div>
            )}

            {!data.registration_required && (
              <div className="py-4 text-xs text-gray-500 font-medium">
                Open to all. No registration required.
              </div>
            )}

            {data.brochure_url && (
              <a href={mediaUrl(data.brochure_url)} target="_blank" rel="noreferrer"
                className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold border border-gray-100 transition-all text-center block cursor-pointer">
                Download brochure PDF
              </a>
            )}
          </div>

          {/* Organizer Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 pb-2">Contact & Organizer</h3>
            <div className="space-y-2 text-xs">
              <div>
                <p className="text-gray-400 font-medium text-[10px] uppercase">Organizer Name</p>
                <p className="text-gray-800 font-semibold">{data.requester_name}</p>
              </div>
              {data.organization_name && (
                <div>
                  <p className="text-gray-400 font-medium text-[10px] uppercase">Group/Committee</p>
                  <p className="text-gray-800 font-semibold">{data.organization_name}</p>
                </div>
              )}
              <div>
                <p className="text-gray-400 font-medium text-[10px] uppercase">Contact Number</p>
                <p className="text-gray-800 font-semibold">{data.contact_number}</p>
              </div>
              <div>
                <p className="text-gray-400 font-medium text-[10px] uppercase">Email</p>
                <a href={`mailto:${data.email}`} className="text-blue-600 hover:underline">{data.email}</a>
              </div>
            </div>
          </div>

          {/* Social Links */}
          {[data.website_url, data.instagram_url, data.linkedin_url, data.facebook_url, data.whatsapp_url].some(Boolean) && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 pb-2">Social Connects</h3>
              <div className="flex flex-wrap gap-2 justify-center pt-1">
                {data.website_url && (
                  <a href={data.website_url} target="_blank" rel="noreferrer" className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100" title="Website">Website</a>
                )}
                {data.instagram_url && (
                  <a href={data.instagram_url} target="_blank" rel="noreferrer" className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100" title="Instagram">Instagram</a>
                )}
                {data.linkedin_url && (
                  <a href={data.linkedin_url} target="_blank" rel="noreferrer" className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100" title="LinkedIn">LinkedIn</a>
                )}
                {data.facebook_url && (
                  <a href={data.facebook_url} target="_blank" rel="noreferrer" className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100" title="Facebook">Facebook</a>
                )}
                {data.whatsapp_url && (
                  <a href={data.whatsapp_url} target="_blank" rel="noreferrer" className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100" title="WhatsApp">WhatsApp</a>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
