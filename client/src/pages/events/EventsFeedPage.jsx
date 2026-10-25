import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPublishedEvents, toggleBookmark, getBookmarks, getDepartments } from "../../services/eventService";
import { mediaUrl } from "../../utils/mediaUrl";
import LoadingState from "../../components/LoadingState";
import { MagnifierIcon, BookmarkIcon, BookmarkOpenedIcon, ShareIcon } from "@solar-icons/react/linear";


const CATEGORIES = ["Technical", "Non-Technical", "Workshop", "Seminar", "Sports", "Cultural", "Competition", "Placement", "Festival", "Other"];

export default function EventsFeedPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loadedRequestKey, setLoadedRequestKey] = useState("");
  const [feedError, setFeedError] = useState("");
  const [auxiliaryErrors, setAuxiliaryErrors] = useState({});
  const [reloadKey, setReloadKey] = useState(0);
  const [activeTab, setActiveTab] = useState("upcoming"); // "upcoming", "featured", "completed"

  // Search & Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [department, setDepartment] = useState("");
  const [toast, setToast] = useState(null);
  const requestKey = JSON.stringify([search, category, department, activeTab, page, reloadKey]);
  const loading = loadedRequestKey !== requestKey;

  useEffect(() => {
    let current = true;
    // Load departments
    getDepartments()
      .then((r) => {
        if (current) {
          setDepartments(r.data.data || []);
          setAuxiliaryErrors((prev) => { const next = { ...prev }; delete next.departments; return next; });
        }
      })
      .catch((err) => {
        if (current) setAuxiliaryErrors((prev) => ({ ...prev, departments: err.response?.data?.message || "Department filter options are unavailable." }));
      });
    // Load user bookmarks
    getBookmarks()
      .then((r) => {
        if (current) {
          setBookmarks((r.data.data || []).map(b => b._id));
          setAuxiliaryErrors((prev) => { const next = { ...prev }; delete next.bookmarks; return next; });
        }
      })
      .catch((err) => {
        if (current) setAuxiliaryErrors((prev) => ({ ...prev, bookmarks: err.response?.data?.message || "Bookmark status could not be loaded." }));
      });
    return () => { current = false; };
  }, []);

  useEffect(() => {
    let current = true;
    const finish = () => {
      if (current) setLoadedRequestKey(requestKey);
    };

    if (activeTab === "bookmarks") {
      getBookmarks()
        .then((res) => {
          if (current) {
            setEvents(res.data.data || []);
            setPages(1);
          }
        })
        .catch((err) => {
          if (current) setFeedError(err.response?.data?.message || "Unable to load your bookmarked events. Please try again.");
        })
        .finally(finish);
      return () => { current = false; };
    }

    const params = {
      search,
      category,
      department_id: department,
      archive: activeTab === "completed" ? "true" : "false",
      feedType: activeTab === "featured" ? "featured" : activeTab === "trending" ? "trending" : "upcoming",
      page,
      limit: 30,
    };
    // Delete empty params
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });

    getPublishedEvents(params)
      .then((res) => {
        if (current) {
          if (!Array.isArray(res.data.data)) {
            throw new Error("The event service returned an invalid response.");
          }
          setEvents(res.data.data);
          setPages(Number.isInteger(res.data.pages) ? Math.max(1, res.data.pages) : 1);
        }
      })
      .catch((err) => {
        if (current) setFeedError(err.response?.data?.message || "Unable to load events. Please try again.");
      })
      .finally(finish);
    return () => { current = false; };
  }, [search, category, department, activeTab, page, reloadKey, requestKey]);

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

  const handleShare = async (e, id) => {
    e.stopPropagation();
    const url = `${window.location.origin}/events/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Event link copied to clipboard.");
    } catch {
      showToast("Unable to copy the event link.");
    }
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#203860] text-white text-xs px-4 py-2.5 rounded-lg shadow-lg font-medium animate-slide-in">
          {toast}
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-[var(--cc-border)] bg-[var(--cc-surface)] p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
        <div>
          <h1 className="font-heading text-xl font-bold text-[var(--cc-text)]">Announcements &amp; Events Feed</h1>
          <p className="text-xs text-[var(--cc-muted)] mt-1">Discover, bookmark, and register for student and department events.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/events/my")}
            className="rounded-lg border border-[var(--cc-border)] px-4 py-2.5 text-xs font-semibold text-[var(--cc-muted)] transition hover:bg-[var(--cc-raised)] hover:text-[var(--cc-text)] cursor-pointer"
          >
            My Event Requests
          </button>
          <button
            onClick={() => navigate("/events/create")}
            className="rounded-lg bg-[#2078C0] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1a68a8] cursor-pointer"
          >
            Create event request
          </button>
        </div>
      </div>

      {/* Search & Filtering Block */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-[var(--cc-border)] bg-[var(--cc-surface)] p-4 shadow-sm sm:grid-cols-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search events by name..."
            value={search}
            onChange={(e) => { setFeedError(""); setPage(1); setSearch(e.target.value); }}
            className="w-full rounded-lg border border-[var(--cc-border)] bg-[var(--cc-raised)] py-2.5 pl-9 pr-3 text-sm text-[var(--cc-text)] placeholder:text-[var(--cc-muted)] focus:outline-none focus:border-[#2078C0] focus:ring-2 focus:ring-[#2078C0]/15"
          />
          <MagnifierIcon
            size={16}
            strokeWidth={1.8}
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cc-muted)]"
          />
        </div>
        <select
          value={category}
          onChange={(e) => { setFeedError(""); setPage(1); setCategory(e.target.value); }}
          className="rounded-lg border border-[var(--cc-border)] bg-[var(--cc-raised)] px-3 py-2.5 text-sm text-[var(--cc-text)] focus:outline-none focus:border-[#2078C0] focus:ring-2 focus:ring-[#2078C0]/15"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={department}
          onChange={(e) => { setFeedError(""); setPage(1); setDepartment(e.target.value); }}
          className="rounded-lg border border-[var(--cc-border)] bg-[var(--cc-raised)] px-3 py-2.5 text-sm text-[var(--cc-text)] focus:outline-none focus:border-[#2078C0] focus:ring-2 focus:ring-[#2078C0]/15"
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept._id} value={dept._id}>{dept.name}</option>
          ))}
        </select>
      </div>
      {Object.values(auxiliaryErrors).map((message, index) => (
        <p key={index} role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{message}</p>
      ))}

      {/* Navigation Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-[var(--cc-border)] pb-px" role="tablist" aria-label="Event categories">
        {[
          { label: "Upcoming", id: "upcoming" },
          { label: "Featured", id: "featured" },
          { label: "Trending", id: "trending" },
          { label: "Bookmarked", id: "bookmarks" },
          { label: "Completed", id: "completed" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setFeedError(""); setPage(1); setActiveTab(tab.id); }}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`whitespace-nowrap px-4 py-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-all duration-200 -mb-px ${activeTab === tab.id
              ? "border-[#2078C0] text-[#2078C0]"
              : "border-transparent text-[var(--cc-muted)] hover:text-[var(--cc-text)]"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      {loading ? (
        <>
          <LoadingState message="Loading events..." size={32} className="min-h-0 py-3" />
          <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="animate-pulse space-y-4 rounded-2xl border border-[var(--cc-border)] bg-[var(--cc-surface)] p-4">
                <div className="aspect-video w-full rounded-lg bg-[var(--cc-raised)]" />
                <div className="h-4 w-2/3 rounded bg-[var(--cc-raised)]" />
                <div className="h-3 w-1/2 rounded bg-[var(--cc-raised)]" />
                <div className="h-8 w-full rounded bg-[var(--cc-raised)]" />
              </div>
            ))}
          </div>
        </>
      ) : feedError ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-950/30 p-5 text-sm text-red-700 dark:text-red-400">
          <p className="font-semibold">Events could not be loaded</p>
          <p className="mt-1 text-xs">{feedError}</p>
          <button type="button" onClick={() => { setFeedError(""); setReloadKey((key) => key + 1); }} className="mt-3 rounded-lg border border-red-300 dark:border-red-700 px-3 py-1.5 text-xs font-semibold transition hover:bg-red-100 dark:hover:bg-red-900/40 cursor-pointer">
            Try again
          </button>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-[var(--cc-surface)] rounded-2xl border border-[var(--cc-border)] p-8 shadow-sm">
          <h3 className="text-base font-bold text-[var(--cc-text)]">No events found</h3>
          <p className="text-xs text-[var(--cc-muted)] mt-1">Try adjusting your filters or checking back later.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => {
            const isBookmarked = bookmarks.includes(event._id);
            const isFestival = event.category === "Festival" && event.admin_metadata?.festival_name;

            return (
              <article
                key={event._id}
                className="cc-interactive-card group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[var(--cc-border)] bg-[var(--cc-surface)] shadow-sm transition-[transform,border-color,box-shadow] duration-200"
              >
                <button
                  type="button"
                  aria-label={`View event: ${event.title}`}
                  onClick={() => {
                  if (isFestival) {
                    navigate(`/festivals/${event.admin_metadata.festival_name}`);
                  } else {
                    navigate(`/events/${event._id}`);
                  }
                }}
                  className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2078C0]"
                />
                {/* Poster container */}
                <div className="pointer-events-none relative z-10 aspect-[16/10] overflow-hidden bg-slate-900">
                  {event.poster_url ? (
                    <img
                      src={mediaUrl(event.poster_url)}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950 to-slate-900">
                      <span className="text-xs font-medium uppercase tracking-widest text-indigo-200/70">No poster available</span>
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
                  <div className="pointer-events-none absolute top-3 right-3 flex gap-1">
                    <button
                      onClick={(e) => handleToggleBookmark(e, event._id)}
                      aria-label={isBookmarked ? `Remove ${event.title} from bookmarks` : `Bookmark ${event.title}`}
                      aria-pressed={isBookmarked}
                      className={`pointer-events-auto p-1.5 rounded-full backdrop-blur-sm transition cursor-pointer ${isBookmarked
                        ? "bg-[#2078C0] text-white shadow"
                        : "bg-white/80 hover:bg-white text-gray-500 hover:text-gray-700 shadow-sm"
                        }`}
                    >
                      {isBookmarked
                        ? <BookmarkOpenedIcon size={14} strokeWidth={2} aria-hidden="true" />
                        : <BookmarkIcon size={14} strokeWidth={2} aria-hidden="true" />
                      }
                    </button>
                    <button
                      onClick={(e) => handleShare(e, event._id)}
                      aria-label={`Share ${event.title}`}
                      className="pointer-events-auto p-1.5 rounded-full bg-white/80 hover:bg-white text-gray-500 hover:text-gray-700 shadow-sm backdrop-blur-sm transition cursor-pointer"
                    >
                      <ShareIcon size={14} strokeWidth={2} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Info Container */}
                <div className="pointer-events-none relative z-10 flex flex-1 flex-col justify-between p-5">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--cc-text)] leading-snug group-hover:text-[#2078C0] transition-colors line-clamp-2">
                      {event.title}
                    </h3>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--cc-muted)]">
                      {event.department_id?.name || "All Departments"}
                    </p>
                    <p className="text-xs text-[var(--cc-muted)] mt-2 line-clamp-3">
                      {event.description || "No description provided."}
                    </p>
                  </div>

                  <div className="mt-4 space-y-3 border-t border-[var(--cc-border)] pt-3">
                    <div className="flex flex-wrap justify-between gap-1 text-[11px] text-[var(--cc-muted)]">
                      <span>{new Date(event.start_date).toLocaleDateString()}</span>
                      <span className="text-right">{event.venue}</span>
                    </div>

                    {isFestival ? (
                      <button
                        type="button"
                        onClick={() => navigate(`/festivals/${event.admin_metadata.festival_name}`)}
                        className="pointer-events-auto block w-full rounded-lg bg-indigo-600 py-2.5 text-center text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 cursor-pointer"
                      >
                        View festival schedule
                      </button>
                    ) : event.registration_required && event.registration_link ? (
                      <a
                        href={event.registration_link}
                        target="_blank"
                        rel="noreferrer"
                        className="pointer-events-auto block w-full rounded-lg bg-[#2078C0] py-2.5 text-center text-xs font-semibold text-white shadow-sm transition hover:bg-[#1a68a8]"
                      >
                        Register Now
                      </a>
                    ) : (
                      <div className="w-full rounded-lg border border-[var(--cc-border)] bg-[var(--cc-raised)] py-2.5 text-center text-xs font-semibold text-[var(--cc-muted)]">
                        Free Entry / No Registration
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
          </div>
          {!loading && !feedError && activeTab !== "bookmarks" && pages > 1 && (
            <nav aria-label="Event feed pages" className="flex items-center justify-between border-t border-[var(--cc-border)] pt-4">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-[var(--cc-border)] px-3 py-2 text-sm font-medium text-[var(--cc-text)] transition hover:bg-[var(--cc-raised)] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                Previous
              </button>
              <p aria-live="polite" className="text-sm text-[var(--cc-muted)]">Page {page} of {pages}</p>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(pages, current + 1))}
                disabled={page >= pages}
                className="rounded-lg border border-[var(--cc-border)] px-3 py-2 text-sm font-medium text-[var(--cc-text)] transition hover:bg-[var(--cc-raised)] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
