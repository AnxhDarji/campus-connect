import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFestivalEvents } from "../../services/eventService";
import { formatTime12h } from "../../utils/timeFormatter";
import { mediaUrl } from "../../utils/mediaUrl";
import LoadingState from "../../components/LoadingState";

export default function FestivalPage() {
  const { festivalName } = useParams();
  const navigate = useNavigate();
  const [daysData, setDaysData] = useState({});
  const [loadedRequestKey, setLoadedRequestKey] = useState("");
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const requestKey = `${festivalName}:${reloadKey}`;
  const loading = loadedRequestKey !== requestKey;

  useEffect(() => {
    let current = true;
    getFestivalEvents(festivalName)
      .then((res) => {
        if (current) {
          setDaysData(res.data.data || {});
          setError("");
        }
      })
      .catch((err) => {
        if (current) setError(err.response?.data?.message || "Unable to load this festival schedule. Please try again.");
      })
      .finally(() => { if (current) setLoadedRequestKey(requestKey); });
    return () => { current = false; };
  }, [festivalName, requestKey]);

  if (loading) return <LoadingState message="Loading festival timeline..." />;
  if (error) return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center" role="alert">
      <h1 className="text-base font-semibold text-red-800">Schedule unavailable</h1>
      <p className="mt-2 text-sm text-red-700">{error}</p>
      <button type="button" onClick={() => { setError(""); setReloadKey((key) => key + 1); }} className="mt-4 rounded-lg border border-red-300 px-4 py-2 text-xs font-semibold text-red-800 transition hover:bg-red-100">Try again</button>
    </div>
  );

  const days = Object.keys(daysData).sort((a, b) => Number(a) - Number(b));

  return (
    <div className="space-y-8">
      {/* Back navigation */}
      <div>
        <button
          onClick={() => navigate("/events")}
          className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition cursor-pointer"
        >
          Back to events
        </button>
      </div>

      {/* Festival Banner */}
      <div className="cc-festival-banner relative overflow-hidden rounded-2xl p-7 text-center text-white shadow-sm sm:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(120,153,212,0.12),transparent)]" />
        <div className="relative z-10 space-y-3">
          <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
            Campus festival
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight capitalize">
            {festivalName}
          </h1>
          <p className="mx-auto max-w-lg text-sm leading-relaxed text-white/85">
            Welcome to the official schedule of the {festivalName} festival. Explore daily sessions, competitions, and programs.
          </p>
        </div>
      </div>

      {/* Timeline Section */}
      {days.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <h3 className="text-base font-bold text-gray-900">No events scheduled</h3>
          <p className="text-xs text-gray-400 mt-1">Check back later for updates on the schedule.</p>
        </div>
      ) : (
        <div className="space-y-9">
          {days.map((dayNum) => {
            const dayEvents = daysData[dayNum] || [];

            return (
              <div key={dayNum} className="space-y-6">
                {/* Day Header */}
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-bold bg-purple-100 text-purple-700 px-4 py-1.5 rounded-2xl border border-purple-200/50 shadow-sm">
                    Day {dayNum}
                  </h2>
                  <div className="h-px bg-gray-200 flex-1" />
                </div>

                {/* Day Events Grid */}
                <div className="grid grid-cols-1 gap-4 pl-2 md:grid-cols-2">
                  {dayEvents.map((event) => (
                    <div
                      key={event._id}
                      onClick={() => navigate(`/events/${event._id}`)}
                      className="group flex cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                    >
                      {/* Event Poster thumbnail */}
                      <div className="w-28 sm:w-36 bg-slate-900 relative flex-shrink-0">
                        {event.poster_url ? (
                          <img
                            src={mediaUrl(event.poster_url)}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950 to-slate-950 text-white">
                            <span className="text-xs font-medium">No poster</span>
                          </div>
                        )}
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[8px] font-bold bg-white text-gray-800 shadow">
                          {event.category}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          <h3 className="text-xs font-bold text-gray-900 group-hover:text-purple-600 transition-colors leading-snug line-clamp-2">
                            {event.title}
                          </h3>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                            {event.department_id?.name || "All Departments"}
                          </p>
                          <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                            {event.description || "No description provided."}
                          </p>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-2 text-[11px] text-gray-500">
                          <span>{formatTime12h(event.start_time)}</span>
                          <span className="text-right">{event.venue}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
