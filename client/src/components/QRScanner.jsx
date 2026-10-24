import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { verifyQR } from "../services/eventService";

const SCAN_COOLDOWN_MS = 2000;

export default function QRScanner({ eventId, onScanResult, onStatsRefresh }) {
  const [scanning, setScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState("");
  const [permissionState, setPermissionState] = useState("idle"); // idle | requesting | granted | denied | unavailable
  const [scanResult, setScanResult] = useState(null); // { type: "success"|"duplicate"|"error", data, message }
  const [verifying, setVerifying] = useState(false);
  const [initError, setInitError] = useState("");
  const [pendingStart, setPendingStart] = useState(null); // { camId } — triggers scanner start after render

  const scannerRef = useRef(null);
  const lastScannedRef = useRef("");
  const lastScannedAtRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopScanner();
    };
  }, []);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        // state 2 = SCANNING, state 3 = PAUSED
        if (state === 2 || state === 3) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch {
        // ignore cleanup errors
      }
      scannerRef.current = null;
    }
    if (mountedRef.current) setScanning(false);
  }, []);

  const handleScanSuccess = useCallback(async (decodedText) => {
    const now = Date.now();
    if (
      decodedText === lastScannedRef.current &&
      now - lastScannedAtRef.current < SCAN_COOLDOWN_MS
    ) {
      return;
    }
    lastScannedRef.current = decodedText;
    lastScannedAtRef.current = now;

    if (!mountedRef.current) return;
    setVerifying(true);
    setScanResult(null);

    try {
      const res = await verifyQR(eventId, decodedText);
      const data = res.data.data;
      if (!mountedRef.current) return;

      if (data.already_marked) {
        setScanResult({ type: "duplicate", data });
        await stopScanner();
      } else {
        setScanResult({ type: "success", data });
        onStatsRefresh?.();
        await stopScanner();
      }
    } catch (err) {
      if (!mountedRef.current) return;
      const msg = err.response?.data?.message || "Verification failed. Please try again.";
      setScanResult({ type: "error", message: msg });
    } finally {
      if (mountedRef.current) setVerifying(false);
    }
  }, [eventId, onStatsRefresh, stopScanner]);

  // After scanning=true is committed to DOM, actually start the html5-qrcode scanner
  useEffect(() => {
    if (!pendingStart || !scanning) return;
    const { camId } = pendingStart;
    setPendingStart(null);

    const containerId = "qr-scanner-container";
    let scanner;
    try {
      scanner = new Html5Qrcode(containerId, { verbose: false });
      scannerRef.current = scanner;
    } catch (err) {
      if (!mountedRef.current) return;
      setInitError(`Camera error: ${err?.message || String(err)}`);
      setPermissionState("idle");
      setScanning(false);
      return;
    }

    scanner.start(
      camId,
      { fps: 15, qrbox: { width: 400, height: 400 } },
      handleScanSuccess,
      () => {}
    ).catch((err) => {
      if (!mountedRef.current) return;
      if (err?.name === "NotAllowedError" || String(err).includes("NotAllowed")) {
        setPermissionState("denied");
      } else {
        setInitError(`Camera error: ${err?.message || String(err)}`);
        setPermissionState("idle");
      }
      scannerRef.current = null;
      setScanning(false);
    });
  }, [pendingStart, scanning, handleScanSuccess]);

  const startScanner = useCallback(async () => {
    setInitError("");
    setScanResult(null);
    setPermissionState("requesting");

    let cameraList = [];
    try {
      cameraList = await Html5Qrcode.getCameras();
    } catch (err) {
      if (err?.name === "NotAllowedError" || String(err).includes("NotAllowed")) {
        setPermissionState("denied");
        return;
      }
      setPermissionState("unavailable");
      setInitError("No camera found on this device.");
      return;
    }

    if (!cameraList || cameraList.length === 0) {
      setPermissionState("unavailable");
      setInitError("No camera found on this device.");
      return;
    }

    setPermissionState("granted");
    setCameras(cameraList);

    const backCam = cameraList.find((c) => /back|rear|environment/i.test(c.label));
    const camId = selectedCamera || backCam?.id || cameraList[0].id;
    if (!selectedCamera) setSelectedCamera(camId);

    // Set scanning=true first so the container div becomes visible in the DOM,
    // then pendingStart triggers the useEffect to actually start the scanner.
    setScanning(true);
    setPendingStart({ camId });
  }, [selectedCamera]);

  const handleCameraChange = useCallback(async (newCamId) => {
    setSelectedCamera(newCamId);
    if (scanning) {
      await stopScanner();
      setTimeout(() => {
        if (mountedRef.current) startScanner();
      }, 300);
    }
  }, [scanning, stopScanner, startScanner]);

  return (
    <div className="space-y-4">
      {/* Camera controls */}
      <div className="flex flex-wrap items-center gap-3">
        {!scanning ? (
          <button
            onClick={startScanner}
            disabled={verifying}
            className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 transition"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Start Scanner
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2.5 transition"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
            Stop Scanner
          </button>
        )}

        {cameras.length > 1 && (
          <select
            value={selectedCamera}
            onChange={(e) => handleCameraChange(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {cameras.map((cam) => (
              <option key={cam.id} value={cam.id}>{cam.label || `Camera ${cam.id}`}</option>
            ))}
          </select>
        )}

        {/* Permission status badge */}
        {permissionState === "requesting" && (
          <span className="text-xs text-amber-600 font-medium">Requesting camera access...</span>
        )}
        {permissionState === "granted" && scanning && (
          <span className="flex items-center gap-1.5 text-xs text-green-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Camera active
          </span>
        )}
      </div>

      {/* Permission denied */}
      {permissionState === "denied" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 space-y-2">
          <p className="font-semibold">Camera access was denied.</p>
          <p className="text-xs">To enable it: open your browser settings → Site permissions → Camera → Allow for this site. Then click Start Scanner again.</p>
          <button onClick={() => setPermissionState("idle")} className="text-xs font-semibold text-amber-700 underline">Retry</button>
        </div>
      )}

      {/* Unavailable / init error */}
      {(permissionState === "unavailable" || initError) && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 space-y-2">
          <p className="font-semibold">{initError || "Camera unavailable."}</p>
          <p className="text-xs">Make sure your device has a camera and this page is served over HTTPS or localhost.</p>
          <button onClick={() => { setPermissionState("idle"); setInitError(""); }} className="text-xs font-semibold text-red-700 underline">Retry</button>
        </div>
      )}

      {/* Camera preview — always in DOM so html5-qrcode can mount into it */}
      <div
        id="qr-scanner-container"
        className="overflow-hidden rounded-xl border border-gray-200 bg-black"
        style={scanning ? { minHeight: 300 } : { height: 0, overflow: "hidden", border: "none" }}
      />

      {/* Verifying indicator */}
      {verifying && (
        <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-90" fill="currentColor" d="M12 3a9 9 0 0 0-9 9h3a6 6 0 0 1 6-6V3Z" />
          </svg>
          Verifying QR code...
        </div>
      )}

      {/* Scan result */}
      {scanResult && (
        <div
          role="alert"
          className={`rounded-xl border p-5 space-y-3 ${
            scanResult.type === "success"
              ? "border-green-200 bg-green-50"
              : scanResult.type === "duplicate"
              ? "border-amber-200 bg-amber-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          {/* Header */}
          <div className="flex items-center gap-2">
            <span className={`text-xl ${
              scanResult.type === "success" ? "text-green-600"
              : scanResult.type === "duplicate" ? "text-amber-500"
              : "text-red-500"
            }`}>
              {scanResult.type === "success" ? "✓" : scanResult.type === "duplicate" ? "⚠" : "✗"}
            </span>
            <p className={`font-bold text-base ${
              scanResult.type === "success" ? "text-green-800"
              : scanResult.type === "duplicate" ? "text-amber-800"
              : "text-red-800"
            }`}>
              {scanResult.type === "success"
                ? "Check-in Successful!"
                : scanResult.type === "duplicate"
                ? "Already Checked In"
                : "Scan Rejected"}
            </p>
          </div>

          {/* Student details */}
          {scanResult.data?.student && (
            <div className={`rounded-lg px-4 py-3 space-y-1.5 ${
              scanResult.type === "success" ? "bg-green-100"
              : "bg-amber-100"
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 w-20">Name</span>
                <span className="text-sm font-bold text-gray-900">{scanResult.data.student.fullName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 w-20">Roll No</span>
                <span className="text-sm font-mono font-semibold text-gray-800">{scanResult.data.student.institutionId}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 w-20">Status</span>
                <span className="text-sm font-semibold text-green-700">Present ✓</span>
              </div>
              {scanResult.data.checked_in_at && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 w-20">Time</span>
                  <span className="text-xs text-gray-600">{new Date(scanResult.data.checked_in_at).toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          )}

          {/* Error message */}
          {scanResult.type === "error" && (
            <p className="text-sm text-red-700">{scanResult.message || "Verification failed. Please try again."}</p>
          )}

          <button
            onClick={() => setScanResult(null)}
            className={`text-xs font-semibold underline opacity-70 hover:opacity-100 ${
              scanResult.type === "success" ? "text-green-800"
              : scanResult.type === "duplicate" ? "text-amber-800"
              : "text-red-800"
            }`}
          >
            {scanResult.type === "error" ? "Dismiss" : "Scan Next"}
          </button>
        </div>
      )}
    </div>
  );
}
