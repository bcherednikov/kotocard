'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getReviewCount } from '@/lib/srs/queries';
import { motion, AnimatePresence } from 'motion/react';
import {
  VERBS, PATTERN_STYLE, loadSelection, saveSelection,
  type VerbPattern,
} from '@/lib/grammar/irregular-verbs';

const NAV = [
  { href: '/dashboard', label: 'Главная',    d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/decks',         label: 'Мои наборы', d: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { href: '/review',        label: 'Повторение', d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { href: '/grammar',       label: 'Правила',    d: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
  { href: '/achievements',  label: 'Достижения', d: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
  { href: '/groups',        label: 'Группы',     d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
];

function Sidebar({ name, reviewCount, onSignOut }: { name: string; reviewCount: number; onSignOut: () => void }) {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex w-52 shrink-0 flex-col h-screen sticky top-0 bg-white border-r border-gray-100">
      <div className="px-5 pt-6 pb-5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#057A55] flex items-center justify-center"><span className="text-white text-xs font-black">К</span></div>
          <span className="font-bold text-gray-900">KotoCard</span>
        </Link>
      </div>
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, d }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'));
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${active ? 'bg-[#057A55]/10 text-[#057A55]' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}>
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={d} />
              </svg>
              {label}
            </Link>
          );
        })}
        {reviewCount > 0 && (
          <div className="pt-4 pb-1">
            <Link href="/review">
              <div className="overflow-hidden rounded-2xl p-4 cursor-pointer" style={{ background: 'linear-gradient(135deg, #057A55 0%, #065f46 100%)' }}>
                <p className="text-white/70 text-xs font-medium mb-0.5 uppercase tracking-wide">К повторению</p>
                <p className="text-white font-black text-2xl leading-none">{reviewCount}<span className="text-sm font-normal text-white/60 ml-1">карточек</span></p>
              </div>
            </Link>
          </div>
        )}
      </nav>
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-[#057A55]/15 flex items-center justify-center text-[#057A55] text-xs font-bold uppercase shrink-0">{name.charAt(0)}</div>
          <span className="text-sm font-medium text-gray-700 truncate">{name}</span>
        </div>
        <button onClick={onSignOut} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition">
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
        <div className="w-7 h-7 rounded-lg bg-[#057A55] flex items-center justify-center"><span className="text-white text-xs font-black">К</span></div>
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

function MobileDrawer({ open, name, onClose, onSignOut }: { open: boolean; name: string; onClose: () => void; onSignOut: () => void }) {
  const pathname = usePathname();
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 bg-black/40 z-40" onClick={onClose} />
          <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="md:hidden fixed left-0 top-0 bottom-0 w-64 bg-white z-50 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
              <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#057A55] flex items-center justify-center"><span className="text-white text-xs font-black">К</span></div>
                <span className="font-bold text-gray-900">KotoCard</span>
              </Link>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-50 transition text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
              {NAV.map(({ href, label, d }) => {
                const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'));
                return (
                  <Link key={href} href={href} onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${active ? 'bg-[#057A55]/10 text-[#057A55]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
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
                <div className="w-8 h-8 rounded-full bg-[#057A55]/15 flex items-center justify-center text-[#057A55] text-sm font-bold uppercase shrink-0">{name.charAt(0)}</div>
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

/* ─── Checkbox ─── */
function Checkbox({ checked }: { checked: boolean }) {
  return (
    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
      checked ? 'bg-[#057A55] border-[#057A55]' : 'border-gray-300 bg-white'
    }`}>
      {checked && (
        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  );
}

/* ─── Main page ─── */
export default function IrregularVerbsPage() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [reviewCount, setReviewCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | VerbPattern>('all');

  // Verb selection persisted to localStorage
  const [selected, setSelected] = useState<Set<string>>(() => new Set(loadSelection()));

  // Persist to localStorage on every change
  useEffect(() => {
    saveSelection([...selected]);
  }, [selected]);

  useEffect(() => {
    if (user) getReviewCount(supabase, user.id).then(setReviewCount).catch(() => {});
  }, [user]);

  const displayName = profile?.display_name ?? user?.email ?? '';
  const handleSignOut = async () => { await signOut(); router.push('/login'); };

  const [search, setSearch] = useState('');

  const filtered = filter === 'all' ? VERBS : VERBS.filter(v => v.pattern === filter);
  const displayed = search.trim()
    ? filtered.filter(v => {
        const q = search.trim().toLowerCase();
        return v.base.includes(q) || v.past.includes(q) || v.pp.includes(q) || v.ru.toLowerCase().includes(q);
      })
    : filtered;

  function toggle(base: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(base) ? next.delete(base) : next.add(base);
      return next;
    });
  }

  function togglePattern(pattern: VerbPattern) {
    const patternVerbs = VERBS.filter(v => v.pattern === pattern);
    const allSelected = patternVerbs.every(v => selected.has(v.base));
    setSelected(prev => {
      const next = new Set(prev);
      if (allSelected) patternVerbs.forEach(v => next.delete(v.base));
      else patternVerbs.forEach(v => next.add(v.base));
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(VERBS.map(v => v.base)));
  }

  function clearAll() {
    setSelected(new Set());
  }

  const selectedCount = selected.size;
  const canPractice = selectedCount > 0;

  return (
    <div className="flex flex-col md:flex-row md:h-screen md:overflow-hidden"
      style={{ background: '#F7F5F0', fontFamily: "'Sora', 'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');`}</style>

      <MobileHeader onMenu={() => setMenuOpen(true)} />
      <MobileDrawer open={menuOpen} name={displayName} onClose={() => setMenuOpen(false)} onSignOut={handleSignOut} />
      <Sidebar name={displayName} reviewCount={reviewCount} onSignOut={handleSignOut} />

      <main className="flex-1 overflow-y-auto px-4 py-5 md:px-8 md:py-7">
        <div className="max-w-3xl mx-auto md:mx-0">

          {/* Breadcrumb + title */}
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-5">
            <Link href="/grammar" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition mb-2">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Правила
            </Link>
            <h1 className="text-lg md:text-xl font-bold text-gray-900">Неправильные глаголы</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Past Simple: draw → drew · {VERBS.length} глаголов
            </p>
          </motion.div>

          {/* How it works — compact */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.06 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 mb-5 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-50 rounded-xl px-4 py-2.5 text-center">
                <p className="text-[10px] text-indigo-400 uppercase font-semibold mb-0.5">Base form</p>
                <p className="text-xl font-black text-indigo-700">go</p>
              </div>
              <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              <div className="bg-amber-50 rounded-xl px-4 py-2.5 text-center border-2 border-amber-200">
                <p className="text-[10px] text-amber-500 uppercase font-semibold mb-0.5">Past Simple</p>
                <p className="text-xl font-black text-amber-700">went</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Сначала учим только <span className="font-semibold text-gray-600">вторую форму</span> — Past Simple.<br />
              Выбери глаголы ниже, и начни практику.
            </p>
          </motion.div>

          {/* Selection controls + practice CTA */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 mb-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {selectedCount === 0 ? 'Ничего не выбрано' : `Выбрано: ${selectedCount} глаголов`}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selectedCount === 0
                    ? 'Отметь галками глаголы, которые учишь сейчас'
                    : 'Практика пройдёт только по ним'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={clearAll} className="text-xs font-medium text-gray-400 hover:text-gray-600 transition px-2 py-1.5 rounded-lg hover:bg-gray-50">
                  Снять все
                </button>
                <button onClick={selectAll} className="text-xs font-medium text-gray-500 hover:text-gray-700 transition px-2 py-1.5 rounded-lg hover:bg-gray-50 border border-gray-200">
                  Выбрать все
                </button>
                <Link href={canPractice ? '/grammar/irregular-verbs/dictation' : '#'}>
                  <motion.button
                    whileHover={canPractice ? { scale: 1.03 } : {}}
                    whileTap={canPractice ? { scale: 0.97 } : {}}
                    disabled={!canPractice}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition shadow-sm ${
                      canPractice
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0l-3-3m3 3l3-3M9.172 16.172a4 4 0 010-5.656" />
                    </svg>
                    Диктант
                  </motion.button>
                </Link>
                <Link href={canPractice ? '/grammar/irregular-verbs/practice' : '#'}>
                  <motion.button
                    whileHover={canPractice ? { scale: 1.03 } : {}}
                    whileTap={canPractice ? { scale: 0.97 } : {}}
                    disabled={!canPractice}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition shadow-sm ${
                      canPractice
                        ? 'bg-[#057A55] text-white hover:bg-[#046b4a]'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {canPractice ? `Практика (${selectedCount})` : 'Выбери глаголы'}
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Verb list with checkboxes */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>

            {/* Search input */}
            <div className="relative mb-3">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Поиск: go, went, идти..."
                className="w-full pl-9 pr-9 py-2.5 text-sm bg-white border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#057A55] focus:ring-1 focus:ring-[#057A55]/30 transition"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Filter + pattern quick-select */}
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                {search.trim()
                  ? <span>Найдено <span className="text-gray-700">{displayed.length}</span> из {filtered.length}</span>
                  : <span>Глаголы <span className="font-normal text-gray-400 normal-case">({displayed.length})</span></span>
                }
              </h2>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['all', 'ABC', 'ABB', 'ABA', 'AAA'] as const).map(p => (
                  <button key={p} onClick={() => setFilter(p)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                      filter === p ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                    }`}>
                    {p === 'all' ? 'Все' : p}
                  </button>
                ))}
              </div>
            </div>

            {/* Pattern legend with quick-select */}
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              {(Object.entries(PATTERN_STYLE) as [VerbPattern, (typeof PATTERN_STYLE)[VerbPattern]][]).map(([pat, s]) => {
                const patVerbs = VERBS.filter(v => v.pattern === pat);
                const allSel = patVerbs.every(v => selected.has(v.base));
                return (
                  <button key={pat} onClick={() => togglePattern(pat)}
                    className={`flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1.5 border transition-all ${
                      allSel ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                    }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${allSel ? 'bg-white' : s.dot}`} />
                    {pat} — {s.label}
                  </button>
                );
              })}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[2rem_1.5fr_1fr_1.5fr] md:grid-cols-[2rem_1.5fr_1fr_1.5fr_1.5fr] border-b border-gray-100 px-4 py-2.5">
                <span />
                <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wide">Base form</span>
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Перевод</span>
                <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wide">Past Simple</span>
                <span className="hidden md:block text-[11px] font-semibold text-teal-500 uppercase tracking-wide">Past Participle</span>
              </div>

              {displayed.length === 0 && (
                <div className="px-4 py-10 text-center text-sm text-gray-400">
                  Ничего не найдено — попробуй другой запрос
                </div>
              )}
              {displayed.map((v, i) => {
                const ps = PATTERN_STYLE[v.pattern];
                const isSelected = selected.has(v.base);
                return (
                  <motion.button key={v.base} type="button"
                    onClick={() => toggle(v.base)}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: 0.18 + i * 0.015 }}
                    className={`w-full text-left grid grid-cols-[2rem_1.5fr_1fr_1.5fr] md:grid-cols-[2rem_1.5fr_1fr_1.5fr_1.5fr] px-4 py-3 items-center transition-colors ${
                      i < displayed.length - 1 ? 'border-b border-gray-50' : ''
                    } ${isSelected ? 'bg-[#057A55]/5 hover:bg-[#057A55]/8' : 'hover:bg-gray-50/70'}`}
                  >
                    <div className="flex items-center">
                      <Checkbox checked={isSelected} />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${ps.dot} shrink-0`} />
                      <span className={`text-sm font-bold ${isSelected ? 'text-indigo-700' : 'text-gray-700'}`}>{v.base}</span>
                    </div>
                    <span className="text-xs text-gray-400 truncate">{v.ru}</span>
                    <span className={`text-sm font-semibold ${isSelected ? 'text-amber-700' : 'text-gray-500'}`}>{v.past}</span>
                    <span className={`hidden md:block text-sm font-semibold ${isSelected ? 'text-teal-700' : 'text-gray-400'}`}>{v.pp}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* Bottom CTA */}
            <AnimatePresence>
              {canPractice && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                  className="mt-4 flex justify-center">
                  <Link href="/grammar/irregular-verbs/practice">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2 px-6 py-3 bg-[#057A55] text-white text-sm font-semibold rounded-xl hover:bg-[#046b4a] transition shadow-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Начать практику — {selectedCount} глаголов
                    </motion.button>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </div>
      </main>
    </div>
  );
}
