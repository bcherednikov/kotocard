'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

interface ImmersiveShellProps {
  children: ReactNode;
  backHref: string;
  title?: string;
  /** 0–100 */
  progress?: number;
  leftBadge?: ReactNode;
  rightBadge?: ReactNode;
}

export function ImmersiveShell({
  children,
  backHref,
  title,
  progress,
  leftBadge,
  rightBadge,
}: ImmersiveShellProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#F7F5F0' }}>
      {/* Header */}
      <header className="shrink-0 px-4 h-13 flex items-center gap-3 bg-white border-b border-gray-100">
        <Link
          href={backHref}
          aria-label="Назад"
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        {title && (
          <span className="flex-1 text-sm font-semibold text-gray-800 truncate">{title}</span>
        )}

        <div className="flex items-center gap-2 ml-auto shrink-0">
          {leftBadge}
          {rightBadge}
        </div>
      </header>

      {/* Progress bar */}
      {progress !== undefined && (
        <div className="h-1 bg-gray-100 shrink-0">
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-full bg-[#057A55] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
