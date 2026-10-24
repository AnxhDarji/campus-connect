export default function Button({ children, loading, ...props }) {
  const { className = '', ...buttonProps } = props;

  return (
    <button
      {...buttonProps}
      aria-busy={loading || undefined}
      disabled={loading || buttonProps.disabled}
      className={`w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] duration-200 hover:bg-blue-800 hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-700/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-sm ${className}`}
    >
      {children}
    </button>
  );
}
