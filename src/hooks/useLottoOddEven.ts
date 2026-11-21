import { useEffect, useState } from 'react';
import { apiClient, getApiErrorMessage } from '../api/lottoClient';

export interface PatternDistribution {
  pattern: string;
  odd: number;
  even: number;
  count: number;
  percentage: number;
}

export interface OddEvenData {
  gameName: string;
  totalDrawsAnalyzed: number;
  distribution: PatternDistribution[];
}

export interface LottoOddEvenResponse {
  status: number;
  message: string;
  action_at: string;
  data: OddEvenData;
}

interface OddEvenState {
  game: string;
  data: OddEvenData | null;
  loading: boolean;
  error: string | null;
}

export function useLottoOddEven(game: string) {
  const [state, setState] = useState<OddEvenState>(() => ({
    game,
    data: null,
    loading: true,
    error: null,
  }));

  useEffect(() => {
    const controller = new AbortController();

    apiClient
      .get<LottoOddEvenResponse>(
        `/stats/odd-even/${encodeURIComponent(game)}`,
        { signal: controller.signal },
      )
      .then((response) => {
        setState({
          game,
          data: response.data.data,
          loading: false,
          error: null,
        });
      })
      .catch((requestError: unknown) => {
        const message = getApiErrorMessage(requestError);
        if (message) {
          setState({ game, data: null, loading: false, error: message });
        }
      });

    return () => controller.abort();
  }, [game]);

  if (state.game !== game) {
    return { data: null, loading: true, error: null };
  }

  return { data: state.data, loading: state.loading, error: state.error };
}
