import { useState, useEffect, useCallback } from "react";
import {
  getDraftByType,
  createDraft,
  updateDraft,
  generateCaption,
  approveDraft,
  publishDraft,
  scheduleDraft,
  getPublishingHistory,
} from "../services/socialService";
import { uploadPoster } from "../services/eventService";

const BASE_URL = "http://localhost:5001";

const STATUS_COLOR = {
  DRAFT: "bg-gray-100 text-gray-500",
  GENERATING: "bg-amber-100 text-amber-700",
  READY_FOR_REVIEW: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  SCHEDULED: "bg-purple-100 text-purple-700",
  PUBLISHING: "bg-amber-100 text-amber-700",
  PUBLISHED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-400",
};

/**
 * InstagramPostPanel
 * Props:
 *   eventId    — MongoDB _id of the EventRequest
 *   postType   — "EVENT_PROMOTION" | "EVENT_RESULT"
 *   eventPosterUrl — existing event poster URL (optional, for quick-select)
 *   aiPosterUrl    — AI-generated poster URL (optional, for quick-select)
 *   title      — section heading
 */
export default function InstagramPostPanel({ eventId, postType, eventPosterUrl, aiPosterUrl, title }) {
  const [draft, setDraft] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ text: "", error: false });
  const [scheduleDate, setScheduleDate] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      const [draftRes, histRes] = await Promise.all([
        getDraftByType(eventId, postType),
        getPublishingHistory(eventId),
      ]);
      setDraft(draftRes.data.data);
      setHistory((histRes.data.data || []).filter((r) => r.postType === postType));
    } catch {
      // silently ignore — panel just won't show data
    } finally {
      setLoading(false);
    }
  }, [eventId, postType]);

  useEffect(() => { load(); }, [load]);

  // Poll while generating
  useEffect(() => {
    if (draft?.status === "GENERATING" || draft?.status === "PUBLISHING") {
      const t = setTimeout(() => load(), 3000);
      return () => clearTimeout(t);
    }
  }, [draft, load]);

  const notify = (text, error = false) => setMsg({ text, error });

  const handleCreate = async () => {
    setBusy(true);
    try {
      const res = await createDraft(eventId, postType);
      setDraft(res.data.data);
    } catch (e) {
      notify(e.response?.data?.message || "Failed to create draft.", true);
    } finally { setBusy(false); }
  };

  const handleSelectImage = async (url, sourceType) => {
    if (!draft) return;
    setBusy(true);
    try {
      const res = await updateDraft(draft._id, { posterUrl: url, sourceType });
      setDraft(res.data.data);
      notify("Image selected.");
    } catch (e) {
      notify(e.response?.data?.message || "Failed to update image.", true);
    } finally { setBusy(false); }
  };

  const handleUpload = async (file) => {
    setUploading(true);
    try {
      const res = await uploadPoster(file);
      const url = res.data?.url || res.data?.data?.url;
      if (!url) throw new Error("Upload did not return a URL.");
      await handleSelectImage(url, "USER_UPLOADED");
    } catch (e) {
      notify(e.response?.data?.message || e.message || "Upload failed.", true);
    } finally { setUploading(false); }
  };

  const handleGenerate = async () => {
    setBusy(true);
    notify("");
    try {
      const res = await generateCaption(draft._id);
      setDraft(res.data.data);
      notify("Caption generated successfully!");
    } catch (e) {
      notify(e.response?.data?.message || "Caption generation failed.", true);
      await load();
    } finally { setBusy(false); }
  };

  const handleCaptionChange = async (value) => {
    setDraft((prev) => ({ ...prev, finalCaption: value }));
  };

  const handleCaptionBlur = async () => {
    if (!draft) return;
    try {
      const res = await updateDraft(draft._id, { finalCaption: draft.finalCaption });
      setDraft(res.data.data);
    } catch { /* ignore */ }
  };

  const handleHashtagsChange = async (value) => {
    setDraft((prev) => ({ ...prev, hashtags: value.split(/\s+/).filter(Boolean) }));
  };

  const handleHashtagsBlur = async () => {
    if (!draft) return;
    try {
      const res = await updateDraft(draft._id, { hashtags: draft.hashtags });
      setDraft(res.data.data);
    } catch { /* ignore */ }
  };

  const handleApprove = async () => {
    setBusy(true);
    notify("");
    try {
      const res = await approveDraft(draft._id);
      setDraft(res.data.data);
      notify("Draft approved! You can now publish or schedule.");
    } catch (e) {
      notify(e.response?.data?.message || "Approval failed.", true);
    } finally { setBusy(false); }
  };

  const handlePublish = async () => {
    setBusy(true);
    notify("");
    try {
      const res = await publishDraft(draft._id);
      notify(res.data.message);
      await load();
    } catch (e) {
      notify(e.response?.data?.message || "Publishing failed.", true);
      await load();
    } finally { setBusy(false); }
  };

  const handleSchedule = async () => {
    if (!scheduleDate) { notify("Please select a date and time.", true); return; }
    setBusy(true);
    notify("");
    try {
      const res = await scheduleDraft(draft._id, new Date(scheduleDate).toISOString());
      setDraft(res.data.data);
      notify(`Post scheduled for ${new Date(scheduleDate).toLocaleString()}`);
      setShowSchedule(false);
    } catch (e) {
      notify(e.response?.data?.message || "Scheduling failed.", true);
    } finally { setBusy(false); }
  };

  if (loading) return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <p className="text-xs text-gray-400">Loading Instagram panel...</p>
    </div>
  );

  const posterSrc = draft?.posterUrl
    ? (draft.posterUrl.startsWith("/") ? `${BASE_URL}${draft.posterUrl}` : draft.posterUrl)
    : null;

  const canGenerate = draft && !["PUBLISHING", "PUBLISHED"].includes(draft.status);
  const canApprove = draft && ["READY_FOR_REVIEW", "DRAFT"].includes(draft.status) && draft.posterUrl && (draft.finalCaption || draft.caption);
  const canPublish = draft?.status === "APPROVED";
  const isGenerating = draft?.status === "GENERATING";
  const isPublishing = draft?.status === "PUBLISHING";
  const isPublished = draft?.status === "PUBLISHED";
  const isScheduled = draft?.status === "SCHEDULED";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-50 pb-3">
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            📸 {title || "Instagram Post"}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {postType === "EVENT_PROMOTION" ? "Promote this event before it happens." : "Share the event results with your audience."}
          </p>
        </div>
        {draft && (
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${STATUS_COLOR[draft.status] || "bg-gray-100 text-gray-500"}`}>
            {draft.status.replace(/_/g, " ")}
          </span>
        )}
      </div>

      {msg.text && (
        <p className={`text-xs font-medium ${msg.error ? "text-red-500" : "text-green-600"}`}>
          {msg.text}
        </p>
      )}

      {/* No draft yet */}
      {!draft && (
        <div className="text-center py-4">
          <p className="text-xs text-gray-500 mb-3">No Instagram draft created yet.</p>
          <button onClick={handleCreate} disabled={busy}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-semibold rounded-xl hover:opacity-90 disabled:opacity-60">
            {busy ? "Creating..." : "Create Instagram Draft"}
          </button>
        </div>
      )}

      {draft && (
        <>
          {/* Image Selection */}
          {!isPublished && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Select Image</p>
              <div className="flex flex-wrap gap-2">
                {eventPosterUrl && (
                  <button onClick={() => handleSelectImage(eventPosterUrl, "EVENT_POSTER")} disabled={busy}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition ${draft.posterUrl === eventPosterUrl ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                    Event Poster
                  </button>
                )}
                {aiPosterUrl && (
                  <button onClick={() => handleSelectImage(aiPosterUrl, "AI_GENERATED_POSTER")} disabled={busy}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition ${draft.posterUrl === aiPosterUrl ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                    AI Poster
                  </button>
                )}
                <label className={`px-3 py-1.5 text-xs rounded-lg border border-dashed border-gray-300 text-gray-500 cursor-pointer hover:bg-gray-50 ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
                  {uploading ? "Uploading..." : "Upload Custom"}
                  <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden"
                    onChange={(e) => e.target.files[0] && handleUpload(e.target.files[0])} />
                </label>
              </div>
              {posterSrc && (
                <img src={posterSrc} alt="Selected poster" className="mt-2 w-32 h-32 object-cover rounded-xl border border-gray-100" />
              )}
            </div>
          )}

          {/* Caption */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Caption</p>
              {canGenerate && (
                <button onClick={handleGenerate} disabled={busy || isGenerating}
                  className="px-3 py-1 text-[10px] font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60">
                  {isGenerating ? "Generating..." : draft.caption ? "Regenerate" : "Generate with AI"}
                </button>
              )}
            </div>
            {isGenerating && (
              <p className="text-xs text-amber-600 animate-pulse">AI is generating your caption...</p>
            )}
            {!isPublished && draft.finalCaption !== undefined && (
              <textarea
                value={draft.finalCaption || ""}
                onChange={(e) => handleCaptionChange(e.target.value)}
                onBlur={handleCaptionBlur}
                rows={6}
                placeholder="Caption will appear here after generation. You can also type manually."
                className="w-full px-3 py-2 text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
              />
            )}
            {isPublished && (
              <p className="text-xs text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 border border-gray-100">
                {draft.finalCaption}
              </p>
            )}
          </div>

          {/* Hashtags */}
          {!isPublished && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Hashtags</p>
              <input
                type="text"
                value={(draft.hashtags || []).join(" ")}
                onChange={(e) => handleHashtagsChange(e.target.value)}
                onBlur={handleHashtagsBlur}
                placeholder="#CampusConnect #CollegeEvents"
                className="w-full px-3 py-2 text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          )}

          {/* Scheduled info */}
          {isScheduled && (
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
              <p className="text-xs text-purple-700 font-semibold">
                ⏰ Scheduled for {new Date(draft.scheduledAt).toLocaleString()}
              </p>
            </div>
          )}

          {/* Published info */}
          {isPublished && history.length > 0 && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 space-y-1">
              <p className="text-xs text-green-700 font-semibold">✓ Published</p>
              {history[0].isMock && (
                <p className="text-[10px] text-amber-600 font-medium">
                  MOCK PROVIDER — This was a demo publish, not a real Instagram post.
                </p>
              )}
              <p className="text-[10px] text-gray-500">
                Media ID: {history[0].providerMediaId} · {new Date(history[0].publishedAt).toLocaleString()}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {!isPublished && !isScheduled && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50">
              {canApprove && (
                <button onClick={handleApprove} disabled={busy}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl disabled:opacity-60">
                  {busy ? "Approving..." : "✓ Approve"}
                </button>
              )}
              {canPublish && (
                <>
                  <button onClick={handlePublish} disabled={busy || isPublishing}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-semibold rounded-xl hover:opacity-90 disabled:opacity-60">
                    {isPublishing ? "Publishing..." : "🚀 Publish Now"}
                  </button>
                  <button onClick={() => setShowSchedule((v) => !v)} disabled={busy}
                    className="px-4 py-2 border border-purple-300 text-purple-700 text-xs font-semibold rounded-xl hover:bg-purple-50 disabled:opacity-60">
                    ⏰ Schedule
                  </button>
                </>
              )}
            </div>
          )}

          {/* Schedule picker */}
          {showSchedule && canPublish && (
            <div className="flex items-center gap-2 pt-1">
              <input type="datetime-local" value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400" />
              <button onClick={handleSchedule} disabled={busy}
                className="px-3 py-2 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-60">
                Confirm
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
