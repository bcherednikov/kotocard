export type VerbPattern = 'ABC' | 'ABB' | 'ABA' | 'AAA';

export type Verb = {
  base: string;
  past: string;
  pp: string;
  ru: string;
  pattern: VerbPattern;
};

export const VERBS: Verb[] = [
  // ── ABC ─────────────────────────────────────────────────────────
  { base: 'be',           past: 'was / were',  pp: 'been',        ru: 'быть',                   pattern: 'ABC' },
  { base: 'go',           past: 'went',        pp: 'gone',        ru: 'идти / ехать',            pattern: 'ABC' },
  { base: 'know',         past: 'knew',        pp: 'known',       ru: 'знать',                   pattern: 'ABC' },
  { base: 'see',          past: 'saw',         pp: 'seen',        ru: 'видеть',                  pattern: 'ABC' },
  { base: 'take',         past: 'took',        pp: 'taken',       ru: 'брать',                   pattern: 'ABC' },
  { base: 'give',         past: 'gave',        pp: 'given',       ru: 'давать',                  pattern: 'ABC' },
  { base: 'write',        past: 'wrote',       pp: 'written',     ru: 'писать',                  pattern: 'ABC' },
  { base: 'speak',        past: 'spoke',       pp: 'spoken',      ru: 'говорить',                pattern: 'ABC' },
  { base: 'do',           past: 'did',         pp: 'done',        ru: 'делать',                  pattern: 'ABC' },
  { base: 'eat',          past: 'ate',         pp: 'eaten',       ru: 'есть / кушать',           pattern: 'ABC' },
  { base: 'drive',        past: 'drove',       pp: 'driven',      ru: 'водить / ехать',          pattern: 'ABC' },
  { base: 'swim',         past: 'swam',        pp: 'swum',        ru: 'плавать',                 pattern: 'ABC' },
  { base: 'sing',         past: 'sang',        pp: 'sung',        ru: 'петь',                    pattern: 'ABC' },
  { base: 'fly',          past: 'flew',        pp: 'flown',       ru: 'летать',                  pattern: 'ABC' },
  { base: 'grow',         past: 'grew',        pp: 'grown',       ru: 'расти',                   pattern: 'ABC' },
  { base: 'throw',        past: 'threw',       pp: 'thrown',      ru: 'бросать',                 pattern: 'ABC' },
  { base: 'wear',         past: 'wore',        pp: 'worn',        ru: 'носить одежду',           pattern: 'ABC' },
  { base: 'begin',        past: 'began',       pp: 'begun',       ru: 'начинать',                pattern: 'ABC' },
  { base: 'break',        past: 'broke',       pp: 'broken',      ru: 'ломать',                  pattern: 'ABC' },
  { base: 'choose',       past: 'chose',       pp: 'chosen',      ru: 'выбирать',                pattern: 'ABC' },
  { base: 'forget',       past: 'forgot',      pp: 'forgotten',   ru: 'забывать',                pattern: 'ABC' },
  { base: 'hide',         past: 'hid',         pp: 'hidden',      ru: 'прятать',                 pattern: 'ABC' },
  { base: 'ring',         past: 'rang',        pp: 'rung',        ru: 'звонить',                 pattern: 'ABC' },
  { base: 'rise',         past: 'rose',        pp: 'risen',       ru: 'подниматься',             pattern: 'ABC' },
  { base: 'steal',        past: 'stole',       pp: 'stolen',      ru: 'воровать',                pattern: 'ABC' },
  { base: 'wake',         past: 'woke',        pp: 'woken',       ru: 'просыпаться',             pattern: 'ABC' },
  { base: 'blow',         past: 'blew',        pp: 'blown',       ru: 'дуть',                    pattern: 'ABC' },
  { base: 'draw',         past: 'drew',        pp: 'drawn',       ru: 'рисовать',                pattern: 'ABC' },
  { base: 'drink',        past: 'drank',       pp: 'drunk',       ru: 'пить',                    pattern: 'ABC' },
  { base: 'fall',         past: 'fell',        pp: 'fallen',      ru: 'падать',                  pattern: 'ABC' },
  { base: 'freeze',       past: 'froze',       pp: 'frozen',      ru: 'замерзать',               pattern: 'ABC' },
  { base: 'shake',        past: 'shook',       pp: 'shaken',      ru: 'трясти',                  pattern: 'ABC' },
  { base: 'tear',         past: 'tore',        pp: 'torn',        ru: 'рвать',                   pattern: 'ABC' },
  { base: 'bite',         past: 'bit',         pp: 'bitten',      ru: 'кусать',                  pattern: 'ABC' },
  { base: 'forgive',      past: 'forgave',     pp: 'forgiven',    ru: 'прощать',                 pattern: 'ABC' },
  { base: 'ride',         past: 'rode',        pp: 'ridden',      ru: 'ехать верхом',            pattern: 'ABC' },
  { base: 'swear',        past: 'swore',       pp: 'sworn',       ru: 'клясться',                pattern: 'ABC' },
  { base: 'arise',        past: 'arose',       pp: 'arisen',      ru: 'возникать',               pattern: 'ABC' },
  { base: 'shrink',       past: 'shrank',      pp: 'shrunk',      ru: 'уменьшаться',             pattern: 'ABC' },
  { base: 'sink',         past: 'sank',        pp: 'sunk',        ru: 'тонуть',                  pattern: 'ABC' },
  { base: 'show',         past: 'showed',      pp: 'shown',       ru: 'показывать',              pattern: 'ABC' },
  { base: 'strive',       past: 'strove',      pp: 'striven',     ru: 'стремиться',              pattern: 'ABC' },
  { base: 'spring',       past: 'sprang',      pp: 'sprung',      ru: 'прыгать',                 pattern: 'ABC' },
  { base: 'stink',        past: 'stank',       pp: 'stunk',       ru: 'вонять',                  pattern: 'ABC' },
  { base: 'forbid',       past: 'forbade',     pp: 'forbidden',   ru: 'запрещать',               pattern: 'ABC' },
  { base: 'bear',         past: 'bore',        pp: 'born',        ru: 'нести / рожать',          pattern: 'ABC' },
  { base: 'swell',        past: 'swelled',     pp: 'swollen',     ru: 'распухать',               pattern: 'ABC' },
  { base: 'tread',        past: 'trod',        pp: 'trodden',     ru: 'топтать',                 pattern: 'ABC' },
  { base: 'weave',        past: 'wove',        pp: 'woven',       ru: 'ткать',                   pattern: 'ABC' },
  { base: 'withdraw',     past: 'withdrew',    pp: 'withdrawn',   ru: 'снимать деньги',          pattern: 'ABC' },
  { base: 'overtake',     past: 'overtook',    pp: 'overtaken',   ru: 'обгонять',                pattern: 'ABC' },
  { base: 'foresee',      past: 'foresaw',     pp: 'foreseen',    ru: 'предвидеть',              pattern: 'ABC' },
  { base: 'overthrow',    past: 'overthrew',   pp: 'overthrown',  ru: 'свергать',                pattern: 'ABC' },
  { base: 'rewrite',      past: 'rewrote',     pp: 'rewritten',   ru: 'переписывать',            pattern: 'ABC' },
  { base: 'mistake',      past: 'mistook',     pp: 'mistaken',    ru: 'ошибаться',               pattern: 'ABC' },
  { base: 'forsake',      past: 'forsook',     pp: 'forsaken',    ru: 'покидать',                pattern: 'ABC' },
  // ── ABA ─────────────────────────────────────────────────────────
  { base: 'come',         past: 'came',        pp: 'come',        ru: 'приходить',               pattern: 'ABA' },
  { base: 'run',          past: 'ran',         pp: 'run',         ru: 'бежать',                  pattern: 'ABA' },
  { base: 'become',       past: 'became',      pp: 'become',      ru: 'становиться',             pattern: 'ABA' },
  { base: 'overcome',     past: 'overcame',    pp: 'overcome',    ru: 'преодолевать',            pattern: 'ABA' },
  { base: 'outrun',       past: 'outran',      pp: 'outrun',      ru: 'обогнать бегом',          pattern: 'ABA' },
  // ── ABB ─────────────────────────────────────────────────────────
  { base: 'have',         past: 'had',         pp: 'had',         ru: 'иметь',                   pattern: 'ABB' },
  { base: 'buy',          past: 'bought',      pp: 'bought',      ru: 'покупать',                pattern: 'ABB' },
  { base: 'bring',        past: 'brought',     pp: 'brought',     ru: 'приносить',               pattern: 'ABB' },
  { base: 'think',        past: 'thought',     pp: 'thought',     ru: 'думать',                  pattern: 'ABB' },
  { base: 'tell',         past: 'told',        pp: 'told',        ru: 'рассказывать',            pattern: 'ABB' },
  { base: 'find',         past: 'found',       pp: 'found',       ru: 'находить',                pattern: 'ABB' },
  { base: 'say',          past: 'said',        pp: 'said',        ru: 'говорить / сказать',      pattern: 'ABB' },
  { base: 'make',         past: 'made',        pp: 'made',        ru: 'делать / создавать',      pattern: 'ABB' },
  { base: 'leave',        past: 'left',        pp: 'left',        ru: 'уходить / оставлять',     pattern: 'ABB' },
  { base: 'feel',         past: 'felt',        pp: 'felt',        ru: 'чувствовать',             pattern: 'ABB' },
  { base: 'meet',         past: 'met',         pp: 'met',         ru: 'встречать',               pattern: 'ABB' },
  { base: 'keep',         past: 'kept',        pp: 'kept',        ru: 'держать / хранить',       pattern: 'ABB' },
  { base: 'sleep',        past: 'slept',       pp: 'slept',       ru: 'спать',                   pattern: 'ABB' },
  { base: 'lose',         past: 'lost',        pp: 'lost',        ru: 'терять',                  pattern: 'ABB' },
  { base: 'sit',          past: 'sat',         pp: 'sat',         ru: 'сидеть',                  pattern: 'ABB' },
  { base: 'win',          past: 'won',         pp: 'won',         ru: 'побеждать',               pattern: 'ABB' },
  { base: 'hear',         past: 'heard',       pp: 'heard',       ru: 'слышать',                 pattern: 'ABB' },
  { base: 'build',        past: 'built',       pp: 'built',       ru: 'строить',                 pattern: 'ABB' },
  { base: 'catch',        past: 'caught',      pp: 'caught',      ru: 'ловить',                  pattern: 'ABB' },
  { base: 'teach',        past: 'taught',      pp: 'taught',      ru: 'учить',                   pattern: 'ABB' },
  { base: 'send',         past: 'sent',        pp: 'sent',        ru: 'посылать',                pattern: 'ABB' },
  { base: 'spend',        past: 'spent',       pp: 'spent',       ru: 'тратить',                 pattern: 'ABB' },
  { base: 'understand',   past: 'understood',  pp: 'understood',  ru: 'понимать',                pattern: 'ABB' },
  { base: 'stand',        past: 'stood',       pp: 'stood',       ru: 'стоять',                  pattern: 'ABB' },
  { base: 'hold',         past: 'held',        pp: 'held',        ru: 'держать',                 pattern: 'ABB' },
  { base: 'lead',         past: 'led',         pp: 'led',         ru: 'вести / возглавлять',     pattern: 'ABB' },
  { base: 'mean',         past: 'meant',       pp: 'meant',       ru: 'означать',                pattern: 'ABB' },
  { base: 'fight',        past: 'fought',      pp: 'fought',      ru: 'драться / бороться',      pattern: 'ABB' },
  { base: 'sell',         past: 'sold',        pp: 'sold',        ru: 'продавать',               pattern: 'ABB' },
  { base: 'deal',         past: 'dealt',       pp: 'dealt',       ru: 'иметь дело',              pattern: 'ABB' },
  { base: 'pay',          past: 'paid',        pp: 'paid',        ru: 'платить',                 pattern: 'ABB' },
  { base: 'lay',          past: 'laid',        pp: 'laid',        ru: 'класть / укладывать',     pattern: 'ABB' },
  { base: 'shoot',        past: 'shot',        pp: 'shot',        ru: 'стрелять',                pattern: 'ABB' },
  { base: 'get',          past: 'got',         pp: 'got',         ru: 'получать / добираться',   pattern: 'ABB' },
  { base: 'hang',         past: 'hung',        pp: 'hung',        ru: 'вешать',                  pattern: 'ABB' },
  { base: 'dig',          past: 'dug',         pp: 'dug',         ru: 'копать',                  pattern: 'ABB' },
  { base: 'stick',        past: 'stuck',       pp: 'stuck',       ru: 'приклеивать',             pattern: 'ABB' },
  { base: 'strike',       past: 'struck',      pp: 'struck',      ru: 'ударять',                 pattern: 'ABB' },
  { base: 'swing',        past: 'swung',       pp: 'swung',       ru: 'качаться',                pattern: 'ABB' },
  { base: 'cling',        past: 'clung',       pp: 'clung',       ru: 'цепляться',               pattern: 'ABB' },
  { base: 'fling',        past: 'flung',       pp: 'flung',       ru: 'швырять',                 pattern: 'ABB' },
  { base: 'wring',        past: 'wrung',       pp: 'wrung',       ru: 'выжимать',                pattern: 'ABB' },
  { base: 'feed',         past: 'fed',         pp: 'fed',         ru: 'кормить',                 pattern: 'ABB' },
  { base: 'bleed',        past: 'bled',        pp: 'bled',        ru: 'кровоточить',             pattern: 'ABB' },
  { base: 'flee',         past: 'fled',        pp: 'fled',        ru: 'убегать',                 pattern: 'ABB' },
  { base: 'speed',        past: 'sped',        pp: 'sped',        ru: 'мчаться',                 pattern: 'ABB' },
  { base: 'bend',         past: 'bent',        pp: 'bent',        ru: 'сгибать',                 pattern: 'ABB' },
  { base: 'lend',         past: 'lent',        pp: 'lent',        ru: 'одалживать',              pattern: 'ABB' },
  { base: 'light',        past: 'lit',         pp: 'lit',         ru: 'зажигать',                pattern: 'ABB' },
  { base: 'sweep',        past: 'swept',       pp: 'swept',       ru: 'подметать',               pattern: 'ABB' },
  { base: 'weep',         past: 'wept',        pp: 'wept',        ru: 'рыдать',                  pattern: 'ABB' },
  { base: 'bind',         past: 'bound',       pp: 'bound',       ru: 'связывать',               pattern: 'ABB' },
  { base: 'grind',        past: 'ground',      pp: 'ground',      ru: 'молоть',                  pattern: 'ABB' },
  { base: 'wind',         past: 'wound',       pp: 'wound',       ru: 'заводить (часы)',          pattern: 'ABB' },
  { base: 'slide',        past: 'slid',        pp: 'slid',        ru: 'скользить',               pattern: 'ABB' },
  { base: 'spin',         past: 'spun',        pp: 'spun',        ru: 'вращать',                 pattern: 'ABB' },
  { base: 'sting',        past: 'stung',       pp: 'stung',       ru: 'жалить',                  pattern: 'ABB' },
  { base: 'string',       past: 'strung',      pp: 'strung',      ru: 'нанизывать',              pattern: 'ABB' },
  { base: 'sling',        past: 'slung',       pp: 'slung',       ru: 'метать',                  pattern: 'ABB' },
  { base: 'kneel',        past: 'knelt',       pp: 'knelt',       ru: 'стоять на коленях',       pattern: 'ABB' },
  { base: 'leap',         past: 'leapt',       pp: 'leapt',       ru: 'прыгать',                 pattern: 'ABB' },
  { base: 'creep',        past: 'crept',       pp: 'crept',       ru: 'ползти',                  pattern: 'ABB' },
  { base: 'smell',        past: 'smelt',       pp: 'smelt',       ru: 'нюхать',                  pattern: 'ABB' },
  { base: 'spell',        past: 'spelt',       pp: 'spelt',       ru: 'писать по буквам',        pattern: 'ABB' },
  { base: 'spill',        past: 'spilt',       pp: 'spilt',       ru: 'проливать',               pattern: 'ABB' },
  { base: 'dream',        past: 'dreamt',      pp: 'dreamt',      ru: 'мечтать / сниться',       pattern: 'ABB' },
  { base: 'learn',        past: 'learnt',      pp: 'learnt',      ru: 'учить / узнавать',        pattern: 'ABB' },
  { base: 'burn',         past: 'burnt',       pp: 'burnt',       ru: 'гореть',                  pattern: 'ABB' },
  { base: 'spoil',        past: 'spoilt',      pp: 'spoilt',      ru: 'портить',                 pattern: 'ABB' },
  { base: 'seek',         past: 'sought',      pp: 'sought',      ru: 'искать',                  pattern: 'ABB' },
  { base: 'breed',        past: 'bred',        pp: 'bred',        ru: 'разводить животных',      pattern: 'ABB' },
  { base: 'mislead',      past: 'misled',      pp: 'misled',      ru: 'вводить в заблуждение',   pattern: 'ABB' },
  { base: 'withstand',    past: 'withstood',   pp: 'withstood',   ru: 'выдерживать',             pattern: 'ABB' },
  { base: 'withhold',     past: 'withheld',    pp: 'withheld',    ru: 'утаивать',                pattern: 'ABB' },
  { base: 'misunderstand',past: 'misunderstood',pp:'misunderstood',ru:'неправильно понять',       pattern: 'ABB' },
  { base: 'dwell',        past: 'dwelt',       pp: 'dwelt',       ru: 'обитать',                 pattern: 'ABB' },
  { base: 'lean',         past: 'leant',       pp: 'leant',       ru: 'наклоняться',             pattern: 'ABB' },
  { base: 'spit',         past: 'spat',        pp: 'spat',        ru: 'плевать',                 pattern: 'ABB' },
  { base: 'foretell',     past: 'foretold',    pp: 'foretold',    ru: 'предсказывать',           pattern: 'ABB' },
  { base: 'rebuild',      past: 'rebuilt',     pp: 'rebuilt',     ru: 'перестраивать',           pattern: 'ABB' },
  { base: 'retell',       past: 'retold',      pp: 'retold',      ru: 'пересказывать',           pattern: 'ABB' },
  // ── AAA ─────────────────────────────────────────────────────────
  { base: 'cut',          past: 'cut',         pp: 'cut',         ru: 'резать',                  pattern: 'AAA' },
  { base: 'put',          past: 'put',         pp: 'put',         ru: 'класть',                  pattern: 'AAA' },
  { base: 'let',          past: 'let',         pp: 'let',         ru: 'позволять',               pattern: 'AAA' },
  { base: 'hurt',         past: 'hurt',        pp: 'hurt',        ru: 'причинять боль',          pattern: 'AAA' },
  { base: 'read',         past: 'read',        pp: 'read',        ru: 'читать',                  pattern: 'AAA' },
  { base: 'hit',          past: 'hit',         pp: 'hit',         ru: 'ударять',                 pattern: 'AAA' },
  { base: 'set',          past: 'set',         pp: 'set',         ru: 'устанавливать',           pattern: 'AAA' },
  { base: 'shut',         past: 'shut',        pp: 'shut',        ru: 'закрывать',               pattern: 'AAA' },
  { base: 'burst',        past: 'burst',       pp: 'burst',       ru: 'взрываться',              pattern: 'AAA' },
  { base: 'cast',         past: 'cast',        pp: 'cast',        ru: 'бросать / отливать',      pattern: 'AAA' },
  { base: 'cost',         past: 'cost',        pp: 'cost',        ru: 'стоить',                  pattern: 'AAA' },
  { base: 'fit',          past: 'fit',         pp: 'fit',         ru: 'подходить по размеру',    pattern: 'AAA' },
  { base: 'rid',          past: 'rid',         pp: 'rid',         ru: 'избавляться',             pattern: 'AAA' },
  { base: 'shed',         past: 'shed',        pp: 'shed',        ru: 'сбрасывать',              pattern: 'AAA' },
  { base: 'spread',       past: 'spread',      pp: 'spread',      ru: 'распространять',          pattern: 'AAA' },
  { base: 'thrust',       past: 'thrust',      pp: 'thrust',      ru: 'толкать',                 pattern: 'AAA' },
  { base: 'upset',        past: 'upset',       pp: 'upset',       ru: 'расстраивать',            pattern: 'AAA' },
  { base: 'bet',          past: 'bet',         pp: 'bet',         ru: 'держать пари',            pattern: 'AAA' },
  { base: 'split',        past: 'split',       pp: 'split',       ru: 'раскалывать',             pattern: 'AAA' },
  { base: 'quit',         past: 'quit',        pp: 'quit',        ru: 'бросать / уходить',       pattern: 'AAA' },
  { base: 'slit',         past: 'slit',        pp: 'slit',        ru: 'разрезать',               pattern: 'AAA' },
  { base: 'bid',          past: 'bid',         pp: 'bid',         ru: 'предлагать цену',         pattern: 'AAA' },
  { base: 'broadcast',    past: 'broadcast',   pp: 'broadcast',   ru: 'вещать / транслировать',  pattern: 'AAA' },
  { base: 'forecast',     past: 'forecast',    pp: 'forecast',    ru: 'предсказывать погоду',    pattern: 'AAA' },
  { base: 'knit',         past: 'knit',        pp: 'knit',        ru: 'вязать',                  pattern: 'AAA' },
];

export const PATTERN_STYLE: Record<VerbPattern, { dot: string; text: string; label: string }> = {
  ABC: { dot: 'bg-indigo-400', text: 'text-indigo-500', label: 'Все разные' },
  ABB: { dot: 'bg-amber-400',  text: 'text-amber-500',  label: 'Past = Participle' },
  ABA: { dot: 'bg-teal-400',   text: 'text-teal-600',   label: 'Base = Participle' },
  AAA: { dot: 'bg-green-400',  text: 'text-green-600',  label: 'Все одинаковые' },
};

export type ExerciseField = 'past' | 'pp';

export type Question =
  | { type: 'cards'; verb: Verb }
  | { type: 'fill'; verb: Verb; field: ExerciseField }
  | { type: 'choice'; verb: Verb; field: ExerciseField; options: string[] };

export const SELECTION_KEY = 'kotocard_verb_selection';

export function loadSelection(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SELECTION_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch { return []; }
}

export function saveSelection(bases: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SELECTION_KEY, JSON.stringify(bases));
}

export function generateSession(
  verbs: Verb[],
  count = 10,
  focusField: ExerciseField = 'past',
): Question[] {
  if (verbs.length === 0) return [];

  // Allow repetition when the set is smaller than count
  const pool: Verb[] = [];
  while (pool.length < count) {
    pool.push(...[...verbs].sort(() => Math.random() - 0.5));
  }
  const picked = pool.slice(0, count);

  const typePool: Array<'cards' | 'fill' | 'choice'> = [
    'choice', 'choice', 'choice', 'choice',
    'fill', 'fill', 'fill',
    'cards', 'cards', 'cards',
  ];
  const types = [...typePool].sort(() => Math.random() - 0.5);

  return picked.map((verb, i) => {
    const type = types[i % types.length];
    if (type === 'cards') return { type: 'cards', verb };
    if (type === 'fill') return { type: 'fill', verb, field: focusField };

    // choice: 3 unique wrong options; fall back to full VERBS pool if set is tiny
    const candidatePool = verbs.length >= 4 ? verbs : VERBS;
    const others = candidatePool.filter(v => v.base !== verb.base);
    const shuffledOthers = [...others].sort(() => Math.random() - 0.5);
    const wrongSet = new Set<string>();
    for (const v of shuffledOthers) {
      if (wrongSet.size >= 3) break;
      const opt = v[focusField];
      if (opt !== verb[focusField] && !wrongSet.has(opt)) wrongSet.add(opt);
    }
    const options = [...wrongSet, verb[focusField]].sort(() => Math.random() - 0.5);
    return { type: 'choice', verb, field: focusField, options };
  });
}

export function checkAnswer(input: string, correct: string): boolean {
  const norm = (s: string) => s.trim().toLowerCase();
  const inp = norm(input);
  const cor = norm(correct);
  if (inp === cor) return true;
  // accept either part of "was / were"
  if (cor.includes('/')) {
    return cor.split('/').map(p => p.trim()).includes(inp);
  }
  return false;
}
