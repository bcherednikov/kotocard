'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getReviewCount } from '@/lib/srs/queries';
import { motion, AnimatePresence } from 'motion/react';

/* ─── Nav ─── */
const NAV = [
  { href: '/dashboard', label: 'Главная',    d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/decks',         label: 'Мои наборы', d: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { href: '/grammar',       label: 'Правила',    d: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
  { href: '/achievements',  label: 'Достижения', d: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
  { href: '/groups',        label: 'Группы',     d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
];

/* ─── Review widget ─── */
function ReviewWidget({ count }: { count: number }) {
  return (
    <Link href="/review">
      <motion.div
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
        className="relative overflow-hidden rounded-2xl p-4 cursor-pointer"
        style={{ background: 'linear-gradient(135deg, #057A55 0%, #065f46 100%)' }}
      >
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 pointer-events-none"
        />
        <div className="relative">
          <p className="text-white/70 text-xs font-medium mb-0.5 uppercase tracking-wide">К повторению</p>
          <p className="text-white font-black text-2xl leading-none mb-3">
            {count}
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

/* ─── Desktop sidebar ─── */
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
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'));
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                active ? 'bg-[#057A55]/10 text-[#057A55]' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={d} />
              </svg>
              {label}
            </Link>
          );
        })}
        {reviewCount > 0 && (
          <div className="pt-4 pb-1">
            <ReviewWidget count={reviewCount} />
          </div>
        )}
      </nav>
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-[#057A55]/15 flex items-center justify-center text-[#057A55] text-xs font-bold uppercase shrink-0">
            {name.charAt(0)}
          </div>
          <span className="text-sm font-medium text-gray-700 truncate">{name}</span>
        </div>
        <button onClick={onSignOut}
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

/* ─── Mobile header ─── */
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

/* ─── Mobile drawer ─── */
function MobileDrawer({ open, name, reviewCount, onClose, onSignOut }: {
  open: boolean; name: string; reviewCount: number; onClose: () => void; onSignOut: () => void;
}) {
  const pathname = usePathname();
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
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
                const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'));
                return (
                  <Link key={href} href={href} onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                      active ? 'bg-[#057A55]/10 text-[#057A55]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
              <button onClick={onSignOut}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition"
              >
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

/* ─── Section card ─── */
type SectionCardProps = {
  href?: string;
  title: string;
  description: string;
  detail: string;
  borderCls: string;
  iconBgCls: string;
  iconColorCls: string;
  iconD: string;
  available: boolean;
  delay?: number;
};

function SectionCard({ href, title, description, detail, borderCls, iconBgCls, iconColorCls, iconD, available, delay = 0 }: SectionCardProps) {
  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        whileHover={available ? { y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' } : {}}
        transition={{ duration: 0.2 }}
        className={`bg-white rounded-2xl border-l-4 ${borderCls} border border-gray-100 p-5 h-full shadow-sm ${available ? 'cursor-pointer group' : 'opacity-55'}`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className={`w-8 h-8 ${iconBgCls} rounded-lg flex items-center justify-center`}>
            <svg className={`w-4 h-4 ${iconColorCls}`} fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={iconD} />
            </svg>
          </div>
          <span className={`text-xs font-semibold rounded-full px-2 py-0.5 border ${
            available
              ? 'bg-green-50 text-green-600 border-green-100'
              : 'bg-gray-50 text-gray-400 border-gray-100'
          }`}>
            {available ? 'Доступно' : 'Скоро'}
          </span>
        </div>
        <h3 className={`font-bold text-sm leading-snug mb-1 ${available ? 'text-gray-900 group-hover:text-[#057A55] transition-colors' : 'text-gray-400'}`}>
          {title}
        </h3>
        <p className="text-gray-400 text-xs mb-3">{description}</p>
        {available ? (
          <div className="flex items-center gap-1 text-xs text-[#057A55] font-semibold">
            {detail}
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        ) : (
          <p className="text-xs text-gray-300">{detail}</p>
        )}
      </motion.div>
    </motion.div>
  );

  if (href && available) return <Link href={href}>{inner}</Link>;
  return inner;
}

/* ─── Main page ─── */
export default function GrammarPage() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [reviewCount, setReviewCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (user) getReviewCount(supabase, user.id).then(setReviewCount).catch(() => {});
  }, [user]);

  const displayName = profile?.display_name ?? user?.email ?? '';
  const handleSignOut = async () => { await signOut(); router.push('/login'); };

  return (
    <div className="flex flex-col md:flex-row md:h-screen md:overflow-hidden"
      style={{ background: '#F7F5F0', fontFamily: "'Sora', 'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');`}</style>

      <MobileHeader onMenu={() => setMenuOpen(true)} />
      <MobileDrawer open={menuOpen} name={displayName} reviewCount={reviewCount}
        onClose={() => setMenuOpen(false)} onSignOut={handleSignOut} />
      <Sidebar name={displayName} reviewCount={reviewCount} onSignOut={handleSignOut} />

      <main className="flex-1 overflow-y-auto px-4 py-5 md:px-8 md:py-7">
        <div className="max-w-3xl mx-auto md:mx-0">

          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className="mb-1">
            <h1 className="text-lg md:text-xl font-bold text-gray-900">Изучение правил</h1>
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="text-sm text-gray-400 mb-7">
            Грамматика, формы и исключения английского языка
          </motion.p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <SectionCard
              href="/grammar/irregular-verbs"
              title="Неправильные глаголы"
              description="go → went → gone · 6 типов упражнений"
              detail="Открыть раздел"
              borderCls="border-l-indigo-400"
              iconBgCls="bg-indigo-50"
              iconColorCls="text-indigo-500"
              iconD="M13 10V3L4 14h7v7l9-11h-7z"
              available
              delay={0.1}
            />
            <SectionCard
              title="Артикли"
              description="a, an, the — когда и как использовать"
              detail="В разработке"
              borderCls="border-l-amber-300"
              iconBgCls="bg-amber-50"
              iconColorCls="text-amber-400"
              iconD="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              available={false}
              delay={0.15}
            />
            <SectionCard
              title="Времена"
              description="Present, Past, Future и их формы"
              detail="В разработке"
              borderCls="border-l-teal-400"
              iconBgCls="bg-teal-50"
              iconColorCls="text-teal-500"
              iconD="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              available={false}
              delay={0.2}
            />
            <SectionCard
              title="Фразовые глаголы"
              description="look up, give in, come across..."
              detail="В разработке"
              borderCls="border-l-rose-300"
              iconBgCls="bg-rose-50"
              iconColorCls="text-rose-400"
              iconD="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              available={false}
              delay={0.25}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
