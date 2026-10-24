import { useRef, useState } from "react";
import { mediaUrl } from "../utils/mediaUrl";

export default function FileUploadField({ label, accept, maxMB, onUpload, preview, uploadFn, note, onUploadingChange }) {
  const inputRef = useRef();
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");

  const handleChange = async (e) => {
    const input = e.currentTarget;
    const file = input.files[0];
    if (!file) return;
    if (file.size > maxMB * 1024 * 1024) {
      setError(`File must be under ${maxMB}MB.`);
      input.value = "";
      return;
    }
    setError("");
    setProgress(0);
    onUploadingChange?.(true);
    try {
      const res = await uploadFn(file, setProgress);
      const url = res.data.url || res.data.data?.url;
      if (!url) throw new Error("Upload did not return an image URL.");
      onUpload(url);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Upload failed. Please try again.");
    } finally {
      setProgress(null);
      onUploadingChange?.(false);
      input.value = "";
    }
  };

  const previewSrc = mediaUrl(preview);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      {note && <p className="text-xs text-gray-400">{note}</p>}
      <div
        role="button"
        tabIndex={progress === null ? 0 : -1}
        aria-label={`${label}: select a file`}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && progress === null) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className="cursor-pointer rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center transition hover:border-blue-400 hover:bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => { if (progress === null) inputRef.current?.click(); }}
      >
        {preview ? (
          accept.includes("pdf") ? (
            <p className="text-xs font-medium text-green-700">PDF uploaded</p>
          ) : (
            <img src={previewSrc} alt="preview" className="max-h-32 mx-auto rounded object-contain" />
          )
        ) : (
          <p className="text-xs text-gray-500">Choose a file · {accept} · max {maxMB}MB</p>
        )}
        {progress !== null && (
          <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
            <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} disabled={progress !== null} />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
