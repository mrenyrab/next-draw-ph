import { useCallback, useEffect, useState } from 'react';
import {
  generateCombinations,
  getApiErrorMessage,
  getFrequency,
} from '../api/lottoClient';
import type {
  FrequencyData,
  LottoGame,
  SmartCombination,
} from '../api/types';

export function useLottoStats(game: LottoGame) {
  const [frequency, setFrequency] = useState<FrequencyData | null>(null);
  const [loadedGame, setLoadedGame] = useState<LottoGame | null>(null);
  const [frequencyError, setFrequencyError] = useState<string | null>(null);
  const [errorGame, setErrorGame] = useState<LottoGame | null>(null);

  const [picks, setPicks] = useState<SmartCombination[]>([]);
  const [picksGame, setPicksGame] = useState<LottoGame | null>(null);
  const [pendingGame, setPendingGame] = useState<LottoGame | null>(null);
  const [picksError, setPicksError] = useState<string | null>(null);
  const [picksErrorGame, setPicksErrorGame] = useState<LottoGame | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const requestedGame = game;

    getFrequency(requestedGame, { limit: 10 }, controller.signal)
      .then((data) => {
        setFrequency(data);
        setLoadedGame(requestedGame);
        setErrorGame((current) => (current === requestedGame ? null : current));
      })
      .catch((error: unknown) => {
        const message = getApiErrorMessage(error);
        if (!message) {
          return;
        }
        setFrequencyError(message);
        setErrorGame(requestedGame);
      });

    return () => {
      controller.abort();
    };
  }, [game]);

  const generateSmartPick = useCallback(async () => {
    const requestedGame = game;
    setPendingGame(requestedGame);
    setPicksError(null);
    setPicksErrorGame(null);

    try {
      const data = await generateCombinations(requestedGame, {
        type: 'smart',
        limit: 3,
      });
      setPicks(data.combinations);
      setPicksGame(requestedGame);
    } catch (error: unknown) {
      const message = getApiErrorMessage(error);
      if (message) {
        setPicksError(message);
        setPicksErrorGame(requestedGame);
      }
    } finally {
      setPendingGame((current) => (current === requestedGame ? null : current));
    }
  }, [game]);

  const frequencyLoading = loadedGame !== game && errorGame !== game;
  const visibleFrequency = loadedGame === game ? frequency : null;
  const visibleFrequencyError = errorGame === game ? frequencyError : null;
  const visiblePicks = picksGame === game ? picks : [];
  const picksLoading = pendingGame === game;
  const visiblePicksError = picksErrorGame === game ? picksError : null;

  return {
    frequency: visibleFrequency,
    frequencyLoading,
    frequencyError: visibleFrequencyError,
    picks: visiblePicks,
    picksLoading,
    picksError: visiblePicksError,
    generateSmartPick,
  };
}
