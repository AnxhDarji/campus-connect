import { CHARUSAT_DATA, getProgramsByCollege, getYearsForProgram, audienceLabel } from "../utils/charusatData";

const EMPTY_ENTRY = { audience_type: "COLLEGE", college_id: "", program_id: "", year: "", custom_audience: "" };

function AudienceEntry({ entry, index, onChange, onRemove }) {
  const programs = entry.college_id ? getProgramsByCollege(entry.college_id) : [];
  const selectedProgram = programs.find((p) => p.id === entry.program_id) ?? null;
  const years = selectedProgram ? getYearsForProgram(selectedProgram) : [];

  const handleCollegeChange = (college_id) => {
    onChange(index, { ...EMPTY_ENTRY, audience_type: "COLLEGE", college_id });
  };

  const handleProgramChange = (program_id) => {
    onChange(index, { ...entry, program_id, year: "", audience_type: program_id ? "PROGRAM" : "COLLEGE" });
  };

  const handleYearChange = (year) => {
    onChange(index, { ...entry, year, audience_type: year ? "YEAR" : "PROGRAM" });
  };

  const isOther = entry.audience_type === "OTHER";

  const sel = "w-full px-3.5 py-2.5 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="border border-gray-100 rounded-lg p-4 bg-gray-50 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Audience {index + 1}</span>
        <button type="button" onClick={() => onRemove(index)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
      </div>

      {/* Type toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(index, { ...EMPTY_ENTRY, audience_type: "COLLEGE" })}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition ${!isOther ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}
        >
          College / Program
        </button>
        <button
          type="button"
          onClick={() => onChange(index, { ...EMPTY_ENTRY, audience_type: "OTHER" })}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition ${isOther ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}
        >
          Other
        </button>
      </div>

      {isOther ? (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Specify Audience *</label>
          <input
            type="text"
            value={entry.custom_audience}
            onChange={(e) => onChange(index, { ...entry, custom_audience: e.target.value })}
            placeholder="e.g. CSI Student Chapter, Alumni, Faculty..."
            className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      ) : (
        <>
          {/* College */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">College</label>
            <select value={entry.college_id} onChange={(e) => handleCollegeChange(e.target.value)} className={sel}>
              <option value="">All Colleges (Entire CHARUSAT)</option>
              {CHARUSAT_DATA.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.fullName}</option>
              ))}
            </select>
          </div>

          {/* Department / Program — only when a specific college is chosen */}
          {entry.college_id && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Department / Program</label>
              <select value={entry.program_id} onChange={(e) => handleProgramChange(e.target.value)} className={sel}>
                <option value="">All Departments / Programs</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.level})</option>
                ))}
              </select>
            </div>
          )}

          {/* Year — only when a specific program is chosen */}
          {entry.college_id && entry.program_id && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Year</label>
              <select value={entry.year} onChange={(e) => handleYearChange(e.target.value)} className={sel}>
                <option value="">All Years</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AudienceSelector({ value, onChange, error }) {
  const entries = value.length > 0 ? value : [];

  const handleChange = (index, updated) => {
    const next = [...entries];
    next[index] = updated;
    onChange(next);
  };

  const handleRemove = (index) => {
    onChange(entries.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    onChange([...entries, { ...EMPTY_ENTRY }]);
  };

  return (
    <div className="flex flex-col gap-3">
      {entries.map((entry, i) => (
        <AudienceEntry key={i} entry={entry} index={i} onChange={handleChange} onRemove={handleRemove} />
      ))}

      <button
        type="button"
        onClick={handleAdd}
        className="text-xs text-blue-600 hover:text-blue-700 font-medium self-start"
      >
        + Add Another Audience
      </button>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Audience Preview */}
      {entries.length > 0 && (
        <div className="mt-1 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-2">Audience Preview</p>
          <ul className="flex flex-col gap-1">
            {entries.map((entry, i) => {
              const label = entry.audience_type === "OTHER"
                ? entry.custom_audience || <span className="italic text-gray-400">Specify audience...</span>
                : !entry.college_id
                  ? "Entire CHARUSAT student community"
                  : audienceLabel(entry);
              return (
                <li key={i} className="text-xs text-blue-800 flex items-start gap-1.5">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>{label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
