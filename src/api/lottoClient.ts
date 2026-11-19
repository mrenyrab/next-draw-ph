import axios from 'axios';
import type {
  ApiResponse,
  FrequencyData,
  GenerateData,
  GenerateType,
  LottoGame,
} from './types';

export const API_BASE_URL = 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
  },
});

/**
 * Game values contain a slash (`6/49`). The API requires that slash to be
 * encoded as `%2F` in the path, otherwise the route is split into extra segments.
 */
export function encodeGame(game: LottoGame): string {
  return encodeURIComponent(game);
}

interface ApiErrorBody {
  message?: string | string[];
  error?: string;
}

export function getApiErrorMessage(error: unknown): string | null {
  if (!axios.isAxiosError(error)) {
    return 'Something went wrong. Please try again.';
  }

  if (error.code === 'ERR_CANCELED') {
    return null;
  }

  const status = error.response?.status;
  const body = error.response?.data as ApiErrorBody | undefined;
  const rawMessage = body?.message;
  const detail = Array.isArray(rawMessage)
    ? rawMessage.join(', ')
    : rawMessage || body?.error;

  if (status === 400) {
    return detail
      ? `Bad Request: ${detail}`
      : 'Bad Request: the lotto game or query is not supported.';
  }

  if (!error.response) {
    return 'Unable to reach the lotto API at http://localhost:3000.';
  }

  return detail
    ? `Request failed (${status ?? 'error'}): ${detail}`
    : `Request failed (${status ?? 'error'}).`;
}

export interface FrequencyQuery {
  limit?: number;
  months?: number;
}

export async function getFrequency(
  game: LottoGame,
  query: FrequencyQuery = {},
  signal?: AbortSignal,
): Promise<FrequencyData> {
  const response = await apiClient.get<ApiResponse<FrequencyData>>(
    `/stats/frequency/${encodeGame(game)}`,
    { params: query, signal },
  );

  return response.data.data;
}

export async function generateCombinations(
  game: LottoGame,
  options: { type?: GenerateType; limit?: number } = {},
  signal?: AbortSignal,
): Promise<GenerateData> {
  const response = await apiClient.get<ApiResponse<GenerateData>>(
    `/stats/generate/${encodeGame(game)}`,
    {
      params: {
        type: options.type ?? 'smart',
        limit: options.limit ?? 3,
      },
      signal,
    },
  );

  return response.data.data;
}
