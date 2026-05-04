'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import type { DeckSrsStats } from '@/lib/srs/types';

type DeckCardData = {
  id: string;
  name: string;
  description: string | null;
  stats: DeckSrsStats;
};

const STAGE_PAL = {
  'Изучение': { border: 'border-l-amber-400', iconBg: 'bg-amber-50', dot: 'bg-amber-400', bar: 'bg-amber-400', stage: 'text-amber-500' },
  'Тестирование': { border: 'border-l-indigo-400', iconBg: 'bg-indigo-50', dot: 'bg-indigo-400', bar: 'bg-indigo-500', stage: 'text-indigo-500' },
  'Повторение': { border: 'border-l-teal-500', iconBg: 'bg-teal-50', dot: 'bg-teal-500', bar: 'bg-teal-500', stage: 'text-teal-600' },
} as const;

function getDeckStage(s: DeckSrsStats): { label: string; percent: number } {
  if (s.total === 0) return { label: 'Изучение', percent: 0 };
  if (s.masteryPercent === 100) return { label: 'Завершён', percent: 100 };
  const rv = (s.youngCount + s.matureCount) / s.total;
  const ts = (s.learningCount + s.testingCount + s.youngCount + s.matureCount) / s.total;
  if (rv > 0.3) return { label: 'Повторение', percent: Math.round(rv * 100) };
  if (ts > 0.1) return { label: 'Тестирование', percent: Math.round(ts * 100) };
  return { label: 'Изучение', percent: s.masteryPercent };
}

export function DeckCard({ deck, delay = 0 }: { deck: DeckCardData; delay?: number }) {
  const stage = getDeckStage(deck.stats);
  const pal = STAGE_PAL[stage.label as keyof typeof STAGE_PAL] ?? STAGE_PAL['Изучение'];
  const { total, masteryPercent, readyForReview } = deck.stats;
  const mastered = masteryPercent === 100 && total > 0;

  if (mastered) {
    return (
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}>
        <Link href={`/decks/${deck.id}`}>
          <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} className="relative overflow-hidden rounded-2xl p-4 h-full cursor-pointer" style={{ background: 'linear-gradient(135deg, #057A55 0%, #065f46 100%)' }}>
            <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 3, repeat: Infinity }} className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full" />
            <div className="relative">
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-400/20 text-amber-300 rounded-full px-2 py-0.5 mb-2">★ Завершён</span>
              <h3 className="font-bold text-white text-sm leading-snug mb-1">{deck.name}</h3>
              {deck.description && <p className="text-white/50 text-xs line-clamp-1 mb-2">{deck.description}</p>}
              <div className="text-white/60 text-xs">{total} / {total} слов</div>
              <div className="w-full h-1 bg-white/20 rounded-full mt-1.5">
                <div className="h-full bg-amber-400 rounded-full w-full" />
              </div>
            </div>
          </motion.div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}>
      <Link href={`/decks/${deck.id}`}>
        <motion.div whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }} transition={{ duration: 0.2 }} className={`bg-white rounded-2xl border-l-4 ${pal.border} border-t border-r border-b border-gray-100 p-4 h-full cursor-pointer group shadow-sm`}>
          <div className="flex items-start justify-between mb-2.5">
            <div className={`w-7 h-7 ${pal.iconBg} rounded-lg flex items-center justify-center`}>
              <div className={`w-2 h-2 ${pal.dot} rounded-full`} />
            </div>
            {readyForReview > 0 && (
              <span className="text-xs font-semibold bg-orange-50 text-orange-500 rounded-full px-2 py-0.5 border border-orange-100">{readyForReview}</span>
            )}
          </div>
          <h3 className="font-bold text-gray-900 text-sm leading-snug mb-0.5 group-hover:text-[#057A55] transition-colors line-clamp-2">{deck.name}</h3>
          {deck.description && <p className="text-gray-400 text-xs mb-2.5 line-clamp-1">{deck.description}</p>}
          {total > 0 && (
            <div className="mt-auto">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-semibold ${pal.stage}`}>{stage.label}</span>
                <span className="text-xs text-gray-400">{stage.percent}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div className={`h-full ${pal.bar} rounded-full`} initial={{ width: 0 }} animate={{ width: `${stage.percent}%` }} transition={{ duration: 0.6, ease: 'easeOut', delay: delay + 0.15 }} />
              </div>
              <div className="text-[11px] text-gray-400 mt-1">{deck.stats.masteredCount} / {total}</div>
            </div>
          )}
        </motion.div>
      </Link>
    </motion.div>
  );
}
