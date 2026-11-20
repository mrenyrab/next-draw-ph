import { useCallback, useEffect, useRef, useState } from 'react';
import { getApiErrorMessage, getDrawsForRange } from '../api/lottoClient';
import type { LottoDrawResult, LottoGame } from '../api/types';

export function useLottoResults() {
  const [results, setResults] = useState<LottoDrawResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      controllerRef.current?.abort();
    },
    [],
  );

  const loadResults = useCallback(
    async (from: string, to: string, game: LottoGame) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setLoading(true);
      setError(null);
      setResults([]);
      setHasSearched(true);

      try {
        const draws = await getDrawsForRange(
          game,
          from,
          to,
          controller.signal,
        );
        if (controller.signal.aborted) {
          return;
        }

        setResults(draws);
      } catch (requestError: unknown) {
        if (controller.signal.aborted) {
          return;
        }
        const message = getApiErrorMessage(requestError);
        controller.abort();
        if (message) {
          setError(message);
        }
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null;
          setLoading(false);
        }
      }
    },
    [],
  );

  return { results, loading, error, hasSearched, loadResults };
}
