import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getQRPass } from "../../services/eventService";
import { useAuth } from "../../context/AuthContext";
import LoadingState from "../../components/LoadingState";

export default function QRPassPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pass, setPass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const canvasRef = useRef(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getQRPass(id)
      .then((res) => { if (active) setPass(res.data.data); })
      .catch((err) => { if (active) setError(err.response?.data?.message || "Could not load your QR pass."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const handleDownload = useCallback(async () => {
    if (!pass?.qr_data_url) return;
    setDownloading(true);
    setDownloadError("");
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const W = 480;
      const H = 600;
      canvas.width = W;
      canvas.height = H;

      // Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, W, H);

      // Header band
      ctx.fillStyle = "#465675";
      ctx.fillRect(0, 0, W, 80);

      // Title
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 15px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("CampusConnect · Event Pass", W / 2, 30);
      ctx.font = "bold 18px sans-serif";
      const title = pass.event?.title || "Event";
      const maxW = W - 40;
      // Truncate long titles
      let displayTitle = title;
      while (ctx.measureText(displayTitle).width > maxW && displayTitle.length > 10) {
        displayTitle = displayTitle.slice(0, -4) + "...";
      }
      ctx.fillText(displayTitle, W / 2, 58);

      // QR image
      const qrImg = new Image();
      await new Promise((resolve, reject) => {
        qrImg.onload = resolve;
        qrImg.onerror = reject;
        qrImg.src = pass.qr_data_url;
      });
      const qrSize = 260;
      const qrX = (W - qrSize) / 2;
      ctx.drawImage(qrImg, qrX, 100, qrSize, qrSize);

      // Student info
      ctx.fillStyle = "#465675";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(pass.student?.fullName || user?.fullName || "", W / 2, 390);

      ctx.fillStyle = "#697586";
      ctx.font = "14px sans-serif";
      ctx.fillText(pass.student?.institutionId || user?.institutionId || "", W / 2, 415);

      if (pass.event?.start_date) {
        ctx.fillText(
          `${new Date(pass.event.start_date).toLocaleDateString()} · ${pass.event.venue || ""}`,
          W / 2,
          440
        );
      }

      // Registration ID
      ctx.fillStyle = "#a0aec0";
      ctx.font = "11px monospace";
      ctx.fillText(`Reg: ${pass.registration_id}`, W / 2, 470);

      // Footer
      ctx.fillStyle = "#f0f4fa";
      ctx.fillRect(0, H - 50, W, 50);
      ctx.fillStyle = "#697586";
      ctx.font = "11px sans-serif";
      ctx.fillText("Present this QR code at the event entrance", W / 2, H - 22);

      // Download
      const link = document.createElement("a");
      link.download = `qr-pass-${pass.registration_id}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      setDownloadError("Failed to generate the QR pass image. Please try again.");
    } finally {
      setDownloading(false);
    }
  }, [pass, user]);

  if (loading) return <LoadingState message="Loading your QR pass..." />;

  if (error) return (
    <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <p className="text-sm font-semibold text-red-800">Could not load QR pass</p>
      <p className="mt-1 text-xs text-red-700">{error}</p>
      <button onClick={() => navigate(`/events/${id}`)} className="mt-4 rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-white transition">
        Back to event
      </button>
    </div>
  );

  return (
    <div className="mx-auto max-w-md space-y-4">
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      <button onClick={() => navigate(`/events/${id}`)} className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition">
        ← Back to event
      </button>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Header */}
        <div className="bg-[var(--cc-navy)] px-6 py-5 text-white text-center">
          <p className="text-xs font-semibold tracking-widest uppercase text-white/60">CampusConnect · Event Pass</p>
          <h1 className="mt-1 text-lg font-bold leading-tight">{pass?.event?.title || "Event"}</h1>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center gap-4 p-6">
          {pass?.qr_data_url ? (
            <img
              src={pass.qr_data_url}
              alt="Your event QR pass"
              className="w-56 h-56 rounded-xl border border-gray-100 shadow-inner"
            />
          ) : (
            <div className="w-56 h-56 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-xs text-gray-400">
              QR unavailable
            </div>
          )}

          {/* Student info */}
          <div className="text-center space-y-1">
            <p className="text-base font-bold text-gray-900">{pass?.student?.fullName || user?.fullName}</p>
            <p className="text-sm font-mono text-gray-500">{pass?.student?.institutionId || user?.institutionId}</p>
          </div>

          {/* Event details */}
          {pass?.event && (
            <div className="w-full rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 space-y-1 text-xs text-gray-600">
              {pass.event.start_date && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-400 uppercase tracking-wide">Date</span>
                  <span>{new Date(pass.event.start_date).toLocaleDateString()}</span>
                </div>
              )}
              {pass.event.start_time && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-400 uppercase tracking-wide">Time</span>
                  <span>{pass.event.start_time}</span>
                </div>
              )}
              {pass.event.venue && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-400 uppercase tracking-wide">Venue</span>
                  <span className="text-right max-w-[60%]">{pass.event.venue}</span>
                </div>
              )}
            </div>
          )}

          {/* Registration status */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              pass?.registration_status === "confirmed"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${pass?.registration_status === "confirmed" ? "bg-green-500" : "bg-red-500"}`} />
              {pass?.registration_status === "confirmed" ? "Confirmed" : "Cancelled"}
            </span>
          </div>

          <p className="text-[10px] text-gray-400 font-mono">Reg ID: {pass?.registration_id}</p>

          {/* Download button */}
          {downloadError && (
            <p role="alert" className="text-xs text-red-600 text-center">{downloadError}</p>
          )}
          <button
            onClick={handleDownload}
            disabled={downloading || !pass?.qr_data_url}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 transition"
          >
            {downloading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-90" fill="currentColor" d="M12 3a9 9 0 0 0-9 9h3a6 6 0 0 1 6-6V3Z" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download QR Pass
              </>
            )}
          </button>

          <p className="text-[10px] text-gray-400 text-center">
            Present this QR code at the event entrance for check-in.
          </p>
        </div>
      </div>
    </div>
  );
}
