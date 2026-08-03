import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPublishedEvents, toggleBookmark, getBookmarks, getDepartments } from "../../services/eventService";

const BASE_URL = "http://localhost:5000";

const CATEGORIES = ["Technical", "Non-Technical", "Workshop", "Seminar", "Sports", "Cultural", "Competition", "Placement", "Festival", "Other"];

export default function EventsFeedPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming"); // "upcoming", "featured", "completed"

  // Search & Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [department, setDepartment] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    // Load departments
    getDepartments().then((r) => setDepartments(r.data.data || [])).catch(() => {});
    // Load user bookmarks
    getBookmarks().then((r) => setBookmarks((r.data.data || []).map(b => b._id))).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    if (activeTab === "bookmarks") {
      getBookmarks()
        .then((res) => {
          setEvents(res.data.data || []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
      return;
    }

    const params = {
      search,
      category,
      department_id: department,
      archive: activeTab === "completed" ? "true" : "false",
      feedType: activeTab === "featured" ? "featured" : activeTab === "trending" ? "trending" : "upcoming",
      limit: 30
    };
    // Delete empty params
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });

    getPublishedEvents(params)
      .then((res) => {
        setEvents(res.data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, category, department, activeTab]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleToggleBookmark = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await toggleBookmark(id);
      if (res.data.bookmarked) {
        setBookmarks((prev) => [...prev, id]);
        showToast("Added to bookmarks!");
      } else {
        setBookmarks((prev) => prev.filter((bId) => bId !== id));
        showToast("Removed from bookmarks!");
      }
    } catch {
      showToast("Failed to update bookmark.");
    }
  };

  const handleShare = (e, id) => {
    e.stopPropagation();
    const url = `${window.location.origin}/events/${id}`;
    navigator.clipboard.writeText(url);
    showToast("Event link copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg font-medium animate-slide-in">
          {toast}
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Announcements & Events Feed</h1>
          <p className="text-xs text-gray-400 mt-1">Discover, bookmark, and register for student and department events.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/events/my")}
            className="px-4 py-2 text-xs font-semibold border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition"
          >
            My Event Requests
          </button>
          <button
            onClick={() => navigate("/events/create")}
            className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition"
          >
            + Create Event Request
          </button>
        </div>
      </div>

      {/* Search & Filtering Block */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search events by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="absolute left-2.5 top-2.5 text-gray-400 text-xs">🔍</span>
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept._id} value={dept._id}>{dept.name}</option>
          ))}
        </select>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 border-b border-gray-100 pb-px">
        {[
          { label: "📅 Upcoming Events", id: "upcoming" },
          { label: "⭐ Featured Events", id: "featured" },
          { label: "🔥 Trending Events", id: "trending" },
          { label: "🔖 Bookmarked Events", id: "bookmarks" },
          { label: "📦 Completed Archive", id: "completed" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-semibold border-b-2 cursor-pointer transition-all duration-200 -mb-px ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4 animate-pulse">
              <div className="bg-gray-100 rounded-lg aspect-video w-full" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
              <div className="h-8 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <span className="text-4xl">📭</span>
          <h3 className="text-base font-bold text-gray-900 mt-4">No events found</h3>
          <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or checking back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const isBookmarked = bookmarks.includes(event._id);
            const isFestival = event.category === "Festival" && event.admin_metadata?.festival_name;

            return (
              <div
                key={event._id}
                onClick={() => {
                  if (isFestival) {
                    navigate(`/festivals/${event.admin_metadata.festival_name}`);
                  } else {
                    navigate(`/events/${event._id}`);
                  }
                }}
                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer"
              >
                {/* Poster container */}
                <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden">
                  {event.poster_url ? (
                    <img
                      src={`${BASE_URL}${event.poster_url}`}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950 to-slate-900">
                      <span className="text-3xl mb-1">📢</span>
                      <span className="text-[10px] text-indigo-200/50 uppercase tracking-widest font-mono">No Poster Attached</span>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/90 backdrop-blur-sm text-gray-800 shadow-sm">
                      {event.category}
                    </span>
                    {event.admin_metadata?.tier && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500 text-white shadow-sm">
                        {event.admin_metadata.tier}
                      </span>
                    )}
                    {event.admin_metadata?.badge && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-600 text-white shadow-sm">
                        {event.admin_metadata.badge}
                      </span>
                    )}
                  </div>

                  {/* Bookmark & Share Overlay */}
                  <div className="absolute top-3 right-3 flex gap-1">
                    <button
                      onClick={(e) => handleToggleBookmark(e, event._id)}
                      className={`p-1.5 rounded-full backdrop-blur-sm transition cursor-pointer ${
                        isBookmarked
                          ? "bg-blue-600 text-white shadow"
                          : "bg-white/80 hover:bg-white text-gray-500 hover:text-gray-700 shadow-sm"
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => handleShare(e, event._id)}
                      className="p-1.5 rounded-full bg-white/80 hover:bg-white text-gray-500 hover:text-gray-700 shadow-sm backdrop-blur-sm transition cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 10.742l4.636-2.318m0 0a3 3 0 100-4.184m0 4.184a3 3 0 010-4.184m-4.636 6.502a3 3 0 11-4.636-4.185m4.636 4.185l4.636 2.318m0 0a3 3 0 100 4.184m0-4.184a3 3 0 010 4.184" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Info Container */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                      {event.title}
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-1 font-semibold tracking-wide uppercase">
                      🏢 {event.department_id?.name || "All Departments"}
                    </p>
                    <p className="text-xs text-gray-500 mt-2 line-clamp-3">
                      {event.description || "No description provided."}
                    </p>
                  </div>

                  <div className="mt-5 space-y-3 pt-3 border-t border-gray-50">
                    <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono">
                      <span>📅 {new Date(event.start_date).toLocaleDateString()}</span>
                      <span>📍 {event.venue}</span>
                    </div>

                    {isFestival ? (
                      <button
                        className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-xs font-semibold hover:opacity-95 shadow transition-all cursor-pointer text-center block"
                      >
                        🎪 View Festival Page
                      </button>
                    ) : event.registration_required && event.registration_link ? (
                      <a
                        href={event.registration_link}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-sm hover:shadow transition-all cursor-pointer text-center block"
                      >
                        Register Now
                      </a>
                    ) : (
                      <div className="w-full py-2 bg-gray-50 text-gray-500 rounded-lg text-xs font-semibold text-center border border-gray-100">
                        Free Entry / No Registration
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
