"use client";

import { useState } from "react";

export function PasswordInput({
  name,
  required,
  minLength,
  pattern,
  title,
  placeholder,
  className,
}: {
  name: string;
  required?: boolean;
  minLength?: number;
  pattern?: string;
  title?: string;
  placeholder?: string;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        name={name}
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
        pattern={pattern}
        title={title}
        placeholder={placeholder}
        className={`${className ?? ""} w-full pr-10`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-2 flex items-center text-[var(--text-faint)] hover:text-[var(--text)]"
      >
        {visible ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 3l18 18M10.58 10.58a2 2 0 002.83 2.83M9.88 5.09A9.77 9.77 0 0112 5c5 0 9 4 10 7-.36 1.08-1 2.24-1.9 3.33M6.6 6.6C4.3 8 2.7 10 2 12c1 3 5 7 10 7 1.35 0 2.63-.28 3.79-.78"
            />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"
            />
            <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    </div>
  );
}
