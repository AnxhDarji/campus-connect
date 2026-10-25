import { useState } from 'react';
import { EyeIcon, EyeClosedIcon } from '@solar-icons/react/linear';

export default function Input({ label, type, ...props }) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const inputId = props.id || props.name;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          {...props}
          id={inputId}
          type={inputType}
          placeholder={props.placeholder}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#323B47] px-3.5 py-2.5 pr-10 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 transition focus:border-[#2078C0] focus:outline-none focus:ring-2 focus:ring-[#2078C0]/20"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            {showPassword ? (
              <EyeClosedIcon size={18} strokeWidth={1.8} aria-hidden="true" />
            ) : (
              <EyeIcon size={18} strokeWidth={1.8} aria-hidden="true" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
