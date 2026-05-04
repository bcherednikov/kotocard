import { Badge } from './badge';
import type { BadgeVariant } from './badge';

export type SrsStatus = 'new' | 'learning' | 'testing' | 'young' | 'mature' | 'relearning';

const STATUS_MAP: Record<SrsStatus, { label: string; variant: BadgeVariant }> = {
  new:        { label: 'Новое',     variant: 'gray'   },
  learning:   { label: 'Изучение', variant: 'amber'  },
  testing:    { label: 'Тест',      variant: 'indigo' },
  young:      { label: 'Повторение',variant: 'teal'   },
  mature:     { label: 'Выучено',   variant: 'green'  },
  relearning: { label: 'Забыто',    variant: 'red'    },
};

export function SrsStatusBadge({ status }: { status: SrsStatus }) {
  const { label, variant } = STATUS_MAP[status] ?? STATUS_MAP.new;
  return <Badge variant={variant}>{label}</Badge>;
}
