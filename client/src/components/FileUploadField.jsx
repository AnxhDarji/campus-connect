import { useRef, useState } from "react";

export default function FileUploadField({ label, accept, maxMB, onUpload, preview, uploadFn, note }) {
  const inputRef = useRef();
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");

  const handleChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > maxMB * 1024 * 1024) {
      setError(`File must be under ${maxMB}MB.`);
      return;
    }
    setError("");
    setProgress(0);
    try {
      const res = await uploadFn(file, setProgress);
      onUpload(res.data.url);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">{label}</label>
      {note && <p className="text-xs text-gray-400">{note}</p>}
      <div
        className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition"
        onClick={() => inputRef.current.click()}
      >
        {preview ? (
          accept.includes("pdf") ? (
            <p className="text-xs text-green-600 font-medium">✓ PDF uploaded</p>
          ) : (
            <img src={`http://localhost:5000${preview}`} alt="preview" className="max-h-32 mx-auto rounded object-contain" />
          )
        ) : (
          <p className="text-xs text-gray-400">Click to upload · {accept} · max {maxMB}MB</p>
        )}
        {progress !== null && (
          <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
            <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
