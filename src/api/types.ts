export const LOTTO_GAMES = ['6/58', '6/55', '6/49', '6/45', '6/42'] as const;

export type LottoGame = (typeof LOTTO_GAMES)[number];

export const LOTTO_GAME_LABELS: Record<LottoGame, string> = {
  '6/58': 'Ultra Lotto 6/58',
  '6/55': 'Grand Lotto 6/55',
  '6/49': 'Super Lotto 6/49',
  '6/45': 'Mega Lotto 6/45',
  '6/42': 'Lotto 6/42',
};

export function isLottoGame(value: string): value is LottoGame {
  return (LOTTO_GAMES as readonly string[]).includes(value);
}

/** Successful envelopes from the PCSO Lotto API. */
export interface ApiResponse<T> {
  status: number;
  message: string;
  action_at: string;
  data: T;
}

export interface NumberFrequency {
  number: number;
  count: number;
}

export interface FrequencyData {
  gameName: string;
  totalDrawsAnalyzed: number;
  hotNumbers: NumberFrequency[];
  coldNumbers: NumberFrequency[];
}

export interface SmartCombination {
  numbers: number[];
  sum: number;
  parity: string;
  hotCount: number;
}

export interface GenerateData {
  game: string;
  requested?: number;
  combinations: SmartCombination[];
}

export type GenerateType = 'smart' | 'random';

export interface LottoDrawResult {
  gameName: string;
  type: string;
  numbers: number[];
  drawDate: string;
  jackpot: number;
  jackpotFormatted?: string;
  winners?: number;
}
