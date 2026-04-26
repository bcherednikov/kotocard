'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getReviewCount } from '@/lib/srs/queries';
import { motion, AnimatePresence } from 'motion/react';
import {
  VERBS, generateSession, checkAnswer, loadSelection,
  type Verb, type Question,
} from '@/lib/grammar/irregular-verbs';

const NAV = [
  { href: '/dashboard', label: 'Главная',    d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/decks',         label: 'Мои наборы', d: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
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

/* ══════════════════════════════════════════════════════
   УПРАЖНЕНИЕ 1: Карточка (V2 — только Past Simple)
   ══════════════════════════════════════════════════════ */
function CardsExercise({ verb, onAnswer }: { verb: Verb; onAnswer: (correct: boolean) => void }) {
  const [flipped, setFlipped] = useState(false);

  if (!flipped) {
    return (
      <button onClick={() => setFlipped(true)}
        className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:shadow-md transition-shadow group min-h-[300px]">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Какое Past Simple?</p>
        <p className="text-5xl font-black text-indigo-700 tracking-tight mt-2">{verb.base}</p>
        <p className="text-sm text-gray-400">{verb.ru}</p>
        <p className="text-xs text-gray-300 mt-6">Нажми, чтобы проверить себя</p>
      </button>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 min-h-[300px] flex flex-col">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide text-center mb-6">Past Simple · {verb.ru}</p>
      <div className="flex items-center justify-center gap-5 mb-2 flex-1">
        <div className="text-center">
          <div className="bg-indigo-50 rounded-xl px-6 py-4 mb-2">
            <p className="text-[10px] text-indigo-400 uppercase font-semibold mb-1">Base form</p>
            <p className="text-3xl font-black text-indigo-700">{verb.base}</p>
          </div>
        </div>
        <div className="text-2xl text-gray-200 mb-2">→</div>
        <div className="text-center">
          <div className="bg-amber-50 rounded-xl px-6 py-4 mb-2 border-2 border-amber-200">
            <p className="text-[10px] text-amber-500 uppercase font-semibold mb-1">Past Simple</p>
            <p className="text-3xl font-black text-amber-700">{verb.past}</p>
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-gray-300 mb-6">паттерн {verb.pattern}</p>
      <div className="flex gap-3">
        <button onClick={() => onAnswer(false)}
          className="flex-1 py-3.5 rounded-xl text-sm font-semibold border-2 border-red-200 text-red-500 bg-red-50 hover:bg-red-100 transition">
          Не знал
        </button>
        <button onClick={() => onAnswer(true)}
          className="flex-1 py-3.5 rounded-xl text-sm font-semibold bg-[#057A55] text-white hover:bg-[#046b4a] transition">
          Знал ✓
        </button>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════
   УПРАЖНЕНИЕ 2: Заполни (V2)
   ══════════════════════════════════════════════════════ */
function FillExercise({ verb, onAnswer }: { verb: Verb; onAnswer: (correct: boolean) => void }) {
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isCorrect = submitted ? checkAnswer(value, verb.past) : false;

  useEffect(() => { inputRef.current?.focus(); }, []);

  function submit() {
    if (!value.trim()) return;
    setSubmitted(true);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 min-h-[300px] flex flex-col">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Заполни форму</p>
      <p className="text-sm text-gray-500 mb-7">
        Напиши <span className="font-semibold text-gray-800">Past Simple</span> глагола{' '}
        <span className="font-black text-indigo-700">{verb.base}</span>
        <span className="text-gray-400 ml-1">({verb.ru})</span>
      </p>

      {/* Chain */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className="bg-indigo-50 rounded-xl px-5 py-3 text-center">
          <p className="text-[10px] text-indigo-400 uppercase font-semibold mb-0.5">Base</p>
          <p className="text-2xl font-black text-indigo-700">{verb.base}</p>
        </div>
        <svg className="w-5 h-5 text-gray-300 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
        <div className={`rounded-xl px-5 py-3 min-w-[110px] text-center border-2 transition-all ${
          !submitted ? 'border-amber-300 bg-amber-50' :
          isCorrect   ? 'border-green-400 bg-green-50' : 'border-red-300 bg-red-50'
        }`}>
          <p className="text-[10px] uppercase font-semibold mb-0.5 text-amber-400">Past Simple</p>
          {submitted
            ? <p className={`text-2xl font-black ${isCorrect ? 'text-green-700' : 'text-red-600'}`}>
                {isCorrect ? value : verb.past}
              </p>
            : <p className="text-lg font-bold text-amber-300">?</p>
          }
        </div>
      </div>

      <div className="mt-auto">
        {!submitted ? (
          <>
            <input ref={inputRef} type="text" value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="Введи Past Simple..."
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#057A55] mb-3 transition-colors"
            />
            <button onClick={submit} disabled={!value.trim()}
              className="w-full py-3.5 rounded-xl text-sm font-semibold bg-[#057A55] text-white hover:bg-[#046b4a] transition disabled:opacity-40 disabled:cursor-not-allowed">
              Проверить →
            </button>
          </>
        ) : (
          <>
            <div className={`rounded-xl p-4 mb-3 ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {isCorrect
                ? <p className="text-sm font-semibold text-green-700">Правильно! ✓</p>
                : <div className="space-y-1">
                    <p className="text-sm font-semibold text-red-600">Не совсем...</p>
                    <p className="text-xs text-red-400">Твой ответ: <span className="font-bold">{value}</span></p>
                    <p className="text-xs text-green-700">Правильно: <span className="font-bold">{verb.past}</span></p>
                  </div>
              }
            </div>
            <button onClick={() => onAnswer(isCorrect)}
              className="w-full py-3.5 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 transition">
              Далее →
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   УПРАЖНЕНИЕ 3: Выбор (V2)
   ══════════════════════════════════════════════════════ */
function ChoiceExercise({ verb, options, onAnswer }: {
  verb: Verb; options: string[]; onAnswer: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  function pick(opt: string) {
    if (selected !== null) return;
    setSelected(opt);
    setTimeout(() => onAnswer(opt === verb.past), 850);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 min-h-[300px] flex flex-col">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Выбери Past Simple</p>
      <div className="mb-6">
        <p className="text-4xl font-black text-indigo-700 mt-1">{verb.base}</p>
        <p className="text-sm text-gray-400 mt-0.5">{verb.ru}</p>
      </div>

      {/* Mini chain hint */}
      <div className="flex items-center gap-2 text-sm mb-6">
        <span className="font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg">{verb.base}</span>
        <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
        <span className="font-bold text-amber-700 bg-amber-100 border-2 border-amber-300 px-3 py-1.5 rounded-lg">?</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-auto">
        {options.map(opt => {
          const isSelected = selected === opt;
          const isCorrect  = opt === verb.past;
          let cls = 'bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50';
          if (selected !== null) {
            if (isCorrect)           cls = 'bg-green-50 border-2 border-green-400 text-green-800';
            else if (isSelected)     cls = 'bg-red-50 border-2 border-red-300 text-red-700';
            else                     cls = 'bg-white border-2 border-gray-100 text-gray-300';
          }
          return (
            <button key={opt} onClick={() => pick(opt)} disabled={selected !== null}
              className={`py-4 px-3 rounded-xl text-lg font-black transition-all ${cls}`}>
              {opt}
              {selected !== null && isCorrect  && <span className="ml-1.5 text-green-500 text-sm font-normal">✓</span>}
              {selected !== null && isSelected && !isCorrect && <span className="ml-1.5 text-red-400 text-sm font-normal">✗</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ЭКРАН РЕЗУЛЬТАТОВ
   ══════════════════════════════════════════════════════ */
function ResultsScreen({ score, total, wrongs, onRetry, onBack }: {
  score: number; total: number; wrongs: Verb[]; onRetry: () => void; onBack: () => void;
}) {
  const percent = Math.round((score / total) * 100);
  const { msg, color } = percent >= 90
    ? { msg: 'Отлично!', color: '#057A55' }
    : percent >= 70 ? { msg: 'Хорошо!', color: '#d97706' }
    : percent >= 50 ? { msg: 'Продолжай!', color: '#6366f1' }
    : { msg: 'Нужно больше практики', color: '#ef4444' };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-28 h-28 mb-3">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
            <motion.circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3"
              strokeLinecap="round"
              initial={{ strokeDasharray: '0 100' }}
              animate={{ strokeDasharray: `${percent} ${100 - percent}` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-black text-gray-900">{percent}%</span>
          </div>
        </div>
        <h2 className="text-xl font-black text-gray-900">{msg}</h2>
        <p className="text-sm text-gray-400 mt-0.5">{score} из {total} правильно · Past Simple</p>
      </div>

      {wrongs.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Повтори эти глаголы</p>
          <div className="space-y-2">
            {wrongs.map(v => (
              <div key={v.base} className="flex items-center gap-3 bg-red-50/70 rounded-xl px-3 py-2.5">
                <span className="text-sm font-black text-indigo-700 w-16 shrink-0">{v.base}</span>
                <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <span className="text-sm font-bold text-amber-700">{v.past}</span>
                <span className="text-xs text-gray-400 ml-auto">{v.ru}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {wrongs.length === 0 && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6 text-center">
          <p className="text-sm font-semibold text-green-700">Все глаголы угаданы верно! 🏆</p>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onBack}
          className="flex-1 py-3.5 rounded-xl text-sm font-semibold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition">
          ← К глаголам
        </button>
        <button onClick={onRetry}
          className="flex-1 py-3.5 rounded-xl text-sm font-semibold bg-[#057A55] text-white hover:bg-[#046b4a] transition">
          Ещё раз
        </button>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════
   ГЛАВНАЯ СТРАНИЦА ПРАКТИКИ
   ══════════════════════════════════════════════════════ */
export default function PracticePage() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [reviewCount, setReviewCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  // Load selected verbs from localStorage
  const practiceVerbs = VERBS.filter(v => loadSelection().includes(v.base));

  const [questions, setQuestions] = useState<Question[]>(() =>
    generateSession(practiceVerbs, 10, 'past')
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [wrongs, setWrongs] = useState<Verb[]>([]);
  const [phase, setPhase] = useState<'exercise' | 'result'>('exercise');
  const [qKey, setQKey] = useState(0);

  useEffect(() => {
    if (user) getReviewCount(supabase, user.id).then(setReviewCount).catch(() => {});
  }, [user]);

  const displayName = profile?.display_name ?? user?.email ?? '';
  const handleSignOut = async () => { await signOut(); router.push('/login'); };

  function handleAnswer(correct: boolean) {
    if (correct) setScore(s => s + 1);
    else setWrongs(w => [...w, questions[currentIdx].verb]);
    const next = currentIdx + 1;
    if (next >= questions.length) setPhase('result');
    else { setCurrentIdx(next); setQKey(k => k + 1); }
  }

  function handleRetry() {
    const freshVerbs = VERBS.filter(v => loadSelection().includes(v.base));
    setQuestions(generateSession(freshVerbs, 10, 'past'));
    setCurrentIdx(0); setScore(0); setWrongs([]); setPhase('exercise'); setQKey(k => k + 1);
  }

  // Empty state — no verbs selected
  if (practiceVerbs.length === 0) {
    return (
      <div className="flex flex-col md:flex-row md:h-screen md:overflow-hidden"
        style={{ background: '#F7F5F0', fontFamily: "'Sora', 'Inter', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');`}</style>
        <MobileHeader onMenu={() => setMenuOpen(true)} />
        <MobileDrawer open={menuOpen} name={displayName} onClose={() => setMenuOpen(false)} onSignOut={handleSignOut} />
        <Sidebar name={displayName} reviewCount={reviewCount} onSignOut={handleSignOut} />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-sm w-full text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Нет выбранных глаголов</p>
            <p className="text-xs text-gray-400 mb-5">Отметь галками глаголы, которые хочешь учить сейчас</p>
            <Link href="/grammar/irregular-verbs"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#057A55] text-white text-sm font-semibold rounded-xl hover:bg-[#046b4a] transition">
              ← Выбрать глаголы
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const q = questions[currentIdx];
  const total = questions.length;
  const typeLabel: Record<Question['type'], string> = { cards: 'Карточка', fill: 'Заполни', choice: 'Выбор' };

  return (
    <div className="flex flex-col md:flex-row md:h-screen md:overflow-hidden"
      style={{ background: '#F7F5F0', fontFamily: "'Sora', 'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');`}</style>

      <MobileHeader onMenu={() => setMenuOpen(true)} />
      <MobileDrawer open={menuOpen} name={displayName} onClose={() => setMenuOpen(false)} onSignOut={handleSignOut} />
      <Sidebar name={displayName} reviewCount={reviewCount} onSignOut={handleSignOut} />

      <main className="flex-1 overflow-y-auto px-4 py-5 md:px-8 md:py-7">
        <div className="max-w-xl mx-auto md:mx-0">

          {/* Breadcrumb + набор */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4">
            <Link href="/grammar/irregular-verbs"
              className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition mb-2">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Неправильные глаголы
            </Link>
            {/* Current set chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-gray-400">Набор:</span>
              {practiceVerbs.slice(0, 8).map(v => (
                <span key={v.base} className="text-xs font-semibold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg">
                  {v.base}
                </span>
              ))}
              {practiceVerbs.length > 8 && (
                <span className="text-xs text-gray-400">+{practiceVerbs.length - 8}</span>
              )}
            </div>
          </motion.div>

          {phase === 'exercise' ? (
            <>
              {/* Progress */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Вопрос {currentIdx + 1} / {total}</span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs font-medium text-gray-400">{typeLabel[q.type]}</span>
                  </div>
                  <span className="text-sm font-bold text-[#057A55]">✓ {score}</span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-[#057A55] rounded-full"
                    animate={{ width: `${(currentIdx / total) * 100}%` }}
                    transition={{ duration: 0.4 }} />
                </div>
              </div>

              {/* Exercise */}
              <AnimatePresence mode="wait">
                <motion.div key={qKey}
                  initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
                  {q.type === 'cards' && <CardsExercise verb={q.verb} onAnswer={handleAnswer} />}
                  {q.type === 'fill'  && <FillExercise  verb={q.verb} onAnswer={handleAnswer} />}
                  {q.type === 'choice' && <ChoiceExercise verb={q.verb} options={q.options} onAnswer={handleAnswer} />}
                </motion.div>
              </AnimatePresence>
            </>
          ) : (
            <ResultsScreen score={score} total={total} wrongs={wrongs}
              onRetry={handleRetry} onBack={() => router.push('/grammar/irregular-verbs')} />
          )}
        </div>
      </main>
    </div>
  );
}
