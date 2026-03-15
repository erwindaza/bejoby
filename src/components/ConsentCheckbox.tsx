// src/components/ConsentCheckbox.tsx
"use client";

import Link from "next/link";

interface ConsentCheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  linkText?: string;
  linkHref?: string;
  required?: boolean;
  error?: string;
}

export default function ConsentCheckbox({
  id,
  checked,
  onChange,
  label,
  linkText,
  linkHref,
  required = true,
  error,
}: ConsentCheckboxProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          required={required}
          className="mt-1 h-4 w-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500 focus:ring-offset-gray-900"
        />
        <span className="text-sm text-gray-300 group-hover:text-gray-100 transition-colors">
          {label}
          {linkText && linkHref && (
            <>
              {" "}
              <Link
                href={linkHref}
                target="_blank"
                className="text-purple-400 hover:text-purple-300 underline"
              >
                {linkText}
              </Link>
            </>
          )}
          {required && <span className="text-red-400 ml-1">*</span>}
        </span>
      </label>
      {error && <p className="text-red-400 text-xs ml-7">{error}</p>}
    </div>
  );
}
