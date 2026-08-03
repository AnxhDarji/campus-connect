import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFestivalEvents } from "../../services/eventService";
import { formatTime12h } from "../../utils/timeFormatter";

const BASE_URL = "http://localhost:5000";

export default function FestivalPage() {
  const { festivalName } = useParams();
  const navigate = useNavigate();
  const [daysData, setDaysData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getFestivalEvents(festivalName)
      .then((res) => {
        setDaysData(res.data.data || {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [festivalName]);

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-400">Loading festival timeline...</div>;

  const days = Object.keys(daysData).sort((a, b) => Number(a) - Number(b));

  return (
    <div className="space-y-8">
      {/* Back navigation */}
      <div>
        <button
          onClick={() => navigate("/events")}
          className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition cursor-pointer"
        >
          ← Back to Feed
        </button>
      </div>

      {/* Festival Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-8 sm:p-12 text-white shadow-lg text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.2),transparent)] pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-200 border border-purple-500/30">
            🎪 Campus Festival
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight capitalize">
            {festivalName}
          </h1>
          <p className="text-sm text-purple-200 max-w-lg mx-auto leading-relaxed">
            Welcome to the official schedule of the {festivalName} festival. Explore daily sessions, competitions, and programs.
          </p>
        </div>
      </div>

      {/* Timeline Section */}
      {days.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <span className="text-4xl">🎪</span>
          <h3 className="text-base font-bold text-gray-900 mt-4">No events scheduled</h3>
          <p className="text-xs text-gray-400 mt-1">Check back later for updates on the schedule.</p>
        </div>
      ) : (
        <div className="space-y-12">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4">
                  {dayEvents.map((event) => (
                    <div
                      key={event._id}
                      onClick={() => navigate(`/events/${event._id}`)}
                      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex overflow-hidden cursor-pointer"
                    >
                      {/* Event Poster thumbnail */}
                      <div className="w-28 sm:w-36 bg-slate-900 relative flex-shrink-0">
                        {event.poster_url ? (
                          <img
                            src={`${BASE_URL}${event.poster_url}`}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950 to-slate-950 text-white">
                            <span className="text-xl">📢</span>
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
                          <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">
                            🏢 {event.department_id?.name || "All Departments"}
                          </p>
                          <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                            {event.description || "No description provided."}
                          </p>
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono mt-4 pt-2 border-t border-gray-50">
                          <span>⏰ {formatTime12h(event.start_time)}</span>
                          <span>📍 {event.venue}</span>
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
