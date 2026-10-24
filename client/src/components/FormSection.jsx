export default function FormSection({ title, children }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="mb-3 border-b border-gray-100 pb-2.5 text-xs font-semibold uppercase tracking-wider text-gray-700 sm:text-sm">
        {title}
      </h3>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">{children}</div>
    </section>
  );
}
