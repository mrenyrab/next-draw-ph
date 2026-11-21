import { useEffect, useState } from 'react';
import { apiClient, getApiErrorMessage } from '../api/lottoClient';

export interface RangeDistribution {
  range: string;
  count: number;
  minSum: number;
  maxSum: number;
  avgSum: number;
  percentage: number;
}

export interface SumDistributionData {
  gameName: string;
  totalDrawsAnalyzed: number;
  distribution: RangeDistribution[];
}

export interface LottoSumDistributionResponse {
  status: number;
  message: string;
  action_at: string;
  data: SumDistributionData;
}

interface SumDistributionState {
  game: string;
  data: SumDistributionData | null;
  loading: boolean;
  error: string | null;
}

export function useLottoSumDistribution(game: string) {
  const [state, setState] = useState<SumDistributionState>(() => ({
    game,
    data: null,
    loading: true,
    error: null,
  }));

  useEffect(() => {
    const controller = new AbortController();

    apiClient
      .get<LottoSumDistributionResponse>(
        `/stats/sum-distribution/${encodeURIComponent(game)}`,
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
