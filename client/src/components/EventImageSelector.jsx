import { useState } from "react";
import FileUploadField from "./FileUploadField";
import { mediaUrl } from "../utils/mediaUrl";

export default function EventImageSelector({ label, value, onChange, uploadFn, generateFn }) {
  const [choice, setChoice] = useState(value ? "upload" : "");
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    try {
      const response = await generateFn();
      const url = response.data?.data?.url || response.data?.url;
      if (!url) throw new Error("Image generation did not return an image URL.");
      onChange(url);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Image generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const previewSrc = mediaUrl(value);

  return (
    <section className="space-y-3.5">
      <div>
        <h3 className="text-sm font-semibold text-gray-800">{label}</h3>
        <p className="mt-0.5 text-xs text-gray-500">Optional. Choose one image source; you can replace it before submitting.</p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="group" aria-label={`${label} source`}>
        <button
          type="button"
          aria-pressed={choice === "generate"}
          onClick={() => { setChoice("generate"); setError(""); }}
          disabled={generating || uploading}
          className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${choice === "generate" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
        >
          Generate with AI
        </button>
        <button
          type="button"
          aria-pressed={choice === "upload"}
          onClick={() => { setChoice("upload"); setError(""); }}
          disabled={generating || uploading}
          className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${choice === "upload" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
        >
          Upload from Device
        </button>
      </div>

      {choice === "generate" && (
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
        >
          {generating ? "Generating image..." : value ? "Regenerate image" : "Generate image"}
        </button>
      )}

      {choice === "upload" && (
        <FileUploadField
          label="Choose an image"
          accept=".jpg,.jpeg,.png,.webp"
          maxMB={10}
          uploadFn={uploadFn}
          preview={null}
          onUpload={onChange}
          onUploadingChange={setUploading}
          note="JPG, PNG, or WebP · max 10MB"
        />
      )}

      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      {value && (
        <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-2.5">
          <img src={previewSrc} alt={`${label} preview`} className="h-24 w-20 rounded-md border border-gray-200 bg-white object-contain" />
          <p className="pt-1 text-xs font-medium text-green-700">Image ready to submit</p>
        </div>
      )}
    </section>
  );
}
