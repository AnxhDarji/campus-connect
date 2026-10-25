export default function Button({ children, loading, ...props }) {
  const { className = '', ...buttonProps } = props;

  return (
    <button
      {...buttonProps}
      aria-busy={loading || undefined}
      disabled={loading || buttonProps.disabled}
      className={`w-full cursor-pointer rounded-lg bg-[#2078C0] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] duration-200 hover:bg-[#1a68a8] hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2078C0]/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-sm ${className}`}
    >
      {children}
    </button>
  );
}
