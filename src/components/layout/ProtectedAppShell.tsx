"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getReviewCount } from "@/lib/srs/queries";
import { motion, AnimatePresence, useSpring, useTransform, type MotionValue } from "motion/react";
import { RequireAuth } from "@/components/auth/RequireAuth";

type Props = {
  children: ReactNode;
};

const NAV = [
  { href: "/dashboard", label: "Главная", d: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/decks", label: "Мои наборы", d: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  { href: "/review", label: "Повторение", d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { href: "/grammar", label: "Правила", d: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
  { href: "/achievements", label: "Достижения", d: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
  { href: "/groups", label: "Группы", d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
];

function Num({ value }: { value: number }) {
  const spring = useSpring(0, { mass: 0.6, stiffness: 80, damping: 16 });
  const display: MotionValue<string> = useTransform(spring, (v: number) => Math.round(v).toLocaleString("ru-RU"));
  useEffect(() => {
    spring.set(value);
  }, [spring, value]);
  return <motion.span>{display}</motion.span>;
}

function ReviewWidget({ count }: { count: number }) {
  return (
    <Link href="/review">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className="relative overflow-hidden rounded-2xl p-4 cursor-pointer"
        style={{ background: "linear-gradient(135deg, #057A55 0%, #065f46 100%)" }}
      >
        <motion.div
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 pointer-events-none"
        />
        <div className="relative">
          <p className="text-white/70 text-xs font-medium mb-0.5 uppercase tracking-wide">К повторению</p>
          <p className="text-white font-black text-2xl leading-none mb-3">
            <Num value={count} />
            <span className="text-sm font-normal text-white/60 ml-1">карточек</span>
          </p>
          <div className="flex items-center gap-1.5 text-white text-xs font-semibold">
            Начать
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

function Sidebar({ name, reviewCount, onSignOut }: { name: string; reviewCount: number; onSignOut: () => void }) {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex w-52 shrink-0 flex-col h-screen sticky top-0 bg-white border-r border-gray-100">
      <div className="px-5 pt-6 pb-5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#057A55] flex items-center justify-center">
            <span className="text-white text-xs font-black">К</span>
          </div>
          <span className="font-bold text-gray-900">KotoCard</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, d }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                active ? "bg-[#057A55]/10 text-[#057A55]" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={d} />
              </svg>
              {label}
            </Link>
          );
        })}
        <div className="pt-4 pb-1">
          <ReviewWidget count={reviewCount} />
        </div>
      </nav>

      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-[#057A55]/15 flex items-center justify-center text-[#057A55] text-xs font-bold uppercase shrink-0">
            {name.charAt(0)}
          </div>
          <span className="text-sm font-medium text-gray-700 truncate">{name}</span>
        </div>
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Выйти
        </button>
      </div>
    </aside>
  );
}

function MobileHeader({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="md:hidden sticky top-0 z-30 bg-white border-b border-gray-100 flex items-center justify-between px-4 h-13">
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-[#057A55] flex items-center justify-center">
          <span className="text-white text-xs font-black">К</span>
        </div>
        <span className="font-bold text-gray-900 text-sm">KotoCard</span>
      </Link>
      <button onClick={onMenu} className="w-9 h-9 flex flex-col justify-center items-center gap-1.5 rounded-xl hover:bg-gray-50 transition" aria-label="Меню">
        <span className="w-5 h-0.5 bg-gray-700 rounded-full" />
        <span className="w-5 h-0.5 bg-gray-700 rounded-full" />
        <span className="w-3.5 h-0.5 bg-gray-700 rounded-full" />
      </button>
    </header>
  );
}

function MobileDrawer({
  open,
  name,
  onClose,
  onSignOut,
}: {
  open: boolean;
  name: string;
  onClose: () => void;
  onSignOut: () => void;
}) {
  const pathname = usePathname();
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="md:hidden fixed left-0 top-0 bottom-0 w-64 bg-white z-50 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
              <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#057A55] flex items-center justify-center">
                  <span className="text-white text-xs font-black">К</span>
                </div>
                <span className="font-bold text-gray-900">KotoCard</span>
              </Link>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-50 transition text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
              {NAV.map(({ href, label, d }) => {
                const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                      active ? "bg-[#057A55]/10 text-[#057A55]" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
                    </svg>
                    {label}
                  </Link>
                );
              })}
            </nav>
            <div className="px-3 py-4 border-t border-gray-100">
              <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
                <div className="w-8 h-8 rounded-full bg-[#057A55]/15 flex items-center justify-center text-[#057A55] text-sm font-bold uppercase shrink-0">
                  {name.charAt(0)}
                </div>
                <span className="text-sm font-medium text-gray-700 truncate">{name}</span>
              </div>
              <button onClick={onSignOut} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Выйти
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function ProtectedAppShell({ children }: Props) {
  return (
    <RequireAuth>
      <ProtectedAppShellInner>{children}</ProtectedAppShellInner>
    </RequireAuth>
  );
}

function ProtectedAppShellInner({ children }: Props) {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    getReviewCount(supabase, user.id).then(setReviewCount).catch(() => {});
  }, [user]);

  const displayName = profile?.display_name ?? user?.email ?? "";
  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <div className="flex flex-col md:flex-row md:h-screen md:overflow-hidden" style={{ background: "#F7F5F0" }}>
      <MobileHeader onMenu={() => setMenuOpen(true)} />
      <MobileDrawer open={menuOpen} name={displayName} onClose={() => setMenuOpen(false)} onSignOut={handleSignOut} />
      <Sidebar name={displayName} reviewCount={reviewCount} onSignOut={handleSignOut} />
      <main className="flex-1 overflow-y-auto px-4 py-5 md:px-8 md:py-7">{children}</main>
    </div>
  );
}
