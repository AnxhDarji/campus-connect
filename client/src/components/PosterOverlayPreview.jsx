import React, { useState } from "react";

const BASE_URL = "http://localhost:5000";

export default function PosterOverlayPreview({ event, completion, posterUrl, posterType = "official" }) {
  const [showModal, setShowModal] = useState(false);

  if (!event) return null;

  const bgUrl = posterUrl
    ? posterUrl.startsWith("http") || posterUrl.startsWith("data:")
      ? posterUrl
      : `${BASE_URL}${posterUrl}`
    : null;

  const isActivityPoster = posterType === "activity";

  return (
    <div className="space-y-4 max-w-md mx-auto">
      {/* Main Screen Poster Card */}
      <div 
        onClick={() => bgUrl && setShowModal(true)}
        className="relative aspect-[3/4] w-full rounded-3xl overflow-hidden shadow-2xl border border-gray-800 bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-7 select-none transition-all duration-300 hover:scale-[1.01] cursor-pointer group"
      >
        {/* Base Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950" />

        {/* Background AI Visual Graphic / Photo */}
        {bgUrl && (
          <img
            src={bgUrl}
            alt={isActivityPoster ? "AI Event Action Poster" : "Official Announcement Poster"}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 z-0"
          />
        )}

        {/* Gradient Overlays for perfect contrast & legibility */}
        <div className={`absolute inset-0 pointer-events-none ${
          isActivityPoster
            ? "bg-gradient-to-b from-black/50 via-transparent to-black/75"
            : "bg-gradient-to-b from-black/75 via-black/35 to-black/90"
        }`} />

        {/* Hover overlay hint */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center pointer-events-none z-20">
          <span className="bg-white/25 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-full border border-white/30 shadow-xl flex items-center gap-1.5">
            🔍 Click to Enlarge / View Lightbox
          </span>
        </div>

        {/* Poster 1 — Official Event Announcement Layout */}
        {!isActivityPoster ? (
          <>
            {/* Top Header Overlay */}
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md shadow-md bg-blue-600/90 text-white">
                  {event.category || "OFFICIAL POSTER"}
                </span>
                <p className="text-[11px] font-bold text-blue-200 uppercase tracking-widest mt-2 drop-shadow">
                  {event.department?.name || event.department_id?.name || "CHARUSAT UNIVERSITY"}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-xs font-bold shadow">
                🎓
              </div>
            </div>

            {/* Middle Title & Content Overlay */}
            <div className="relative z-10 my-auto text-center space-y-3 py-4">
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight drop-shadow-lg">
                {event.title}
              </h2>
              {(event.organization_name || event.requester_name) && (
                <p className="text-xs font-medium text-white backdrop-blur-md bg-black/40 px-3 py-1 rounded-full inline-block border border-white/10 shadow-sm">
                  Organized by {event.organization_name || event.requester_name}
                </p>
              )}
            </div>

            {/* Bottom Details Overlay */}
            <div className="relative z-10 pt-4 border-t border-white/20 space-y-2 backdrop-blur-md bg-black/60 -mx-6 -mb-6 p-5">
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-100">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-slate-300 font-semibold">Date & Time</p>
                  <p className="font-bold">{new Date(event.start_date).toLocaleDateString()}</p>
                  <p className="text-[10px] text-slate-200">{event.start_time} - {event.end_time}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] uppercase tracking-wider text-slate-300 font-semibold">Venue</p>
                  <p className="font-bold truncate">{event.venue}</p>
                  {event.building && <p className="text-[10px] text-slate-200 truncate">{event.building}</p>}
                </div>
              </div>

              {completion && (
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-300 font-semibold flex items-center gap-1">
                    ✓ Completed ({completion.actual_attendance} Attendees)
                  </span>
                  <span className="text-[9px] text-slate-300 font-mono uppercase">CampusConnect</span>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Poster 2 — Main Post Clean Photorealistic Action View */
          <>
            {/* Top Floating Badge */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/90 text-white backdrop-blur-md shadow-lg border border-white/20">
                🔥 EVENT ACTION & HIGHLIGHTS
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/50 backdrop-blur-md border border-white/20 text-gray-200">
                {event.category || "General"}
              </span>
            </div>

            {/* Bottom Floating Info Pill */}
            <div className="relative z-10 mt-auto backdrop-blur-md bg-black/60 p-3 rounded-2xl border border-white/15 flex items-center justify-between -mx-2 -mb-2">
              <div className="truncate pr-2">
                <p className="text-xs font-bold text-white truncate">{event.title}</p>
                <p className="text-[10px] text-amber-300 truncate">
                  📍 {event.venue} · 📅 {new Date(event.start_date).toLocaleDateString()}
                </p>
              </div>
              <span className="text-[10px] bg-amber-500 text-white px-2.5 py-1 rounded-xl font-bold shrink-0 shadow">
                Main Post
              </span>
            </div>
          </>
        )}
      </div>

      {/* Quick Action Links */}
      {bgUrl && (
        <div className="flex items-center justify-center gap-3 text-xs pt-1">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl border border-indigo-200 transition flex items-center gap-1.5 shadow-sm"
          >
            🔍 View Fullscreen Lightbox
          </button>
          <a
            href={bgUrl}
            target="_blank"
            rel="noreferrer"
            download={`poster-${event.title.toLowerCase().replace(/\s+/g, "-")}.png`}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl border border-gray-200 transition flex items-center gap-1.5 shadow-sm"
          >
            📥 Download Image
          </a>
        </div>
      )}

      {/* Lightbox Modal */}
      {showModal && bgUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="relative max-w-3xl w-full max-h-[92vh] bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 bg-gray-950 border-b border-gray-800 text-white">
              <h3 className="text-sm font-bold truncate">
                {isActivityPoster ? "🔥 Poster 2 — Event Action Visual Scene" : "📢 Poster 1 — Official Event Poster"}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-300 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 overflow-auto flex-1 flex items-center justify-center bg-black/80">
              <img 
                src={bgUrl} 
                alt="Full AI Poster" 
                className="max-h-[75vh] w-auto object-contain rounded-2xl shadow-2xl"
              />
            </div>

            <div className="p-4 bg-gray-950 border-t border-gray-800 flex items-center justify-between text-xs text-white">
              <span className="text-gray-400 font-mono truncate">{event.title}</span>
              <a 
                href={bgUrl} 
                target="_blank" 
                rel="noreferrer"
                download={`poster-${event.title.toLowerCase().replace(/\s+/g, "-")}.png`}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow transition"
              >
                📥 Download Full High-Res
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

