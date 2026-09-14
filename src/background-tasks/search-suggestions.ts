import {
  DEFAULT_SEARCH_URL,
  SEARCH_SUGGESTIONS_CLIENT,
  SEARCH_SUGGESTIONS_ENDPOINT,
} from "@/constants";
import type { SearchSuggestion } from "./types";

const isSearchSuggestionValue = (
  suggestion: unknown,
): suggestion is string => {
  return typeof suggestion === "string" && suggestion.trim() !== "";
};

const createSearchSuggestion = (query: string): SearchSuggestion => ({
  id: query,
  title: query,
  url: `${DEFAULT_SEARCH_URL}?q=${encodeURIComponent(query)}`,
  query,
});

export const getSearchSuggestions = async (
  query: string,
): Promise<SearchSuggestion[]> => {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [];
  }

  const response = await fetch(
    `${SEARCH_SUGGESTIONS_ENDPOINT}?client=${SEARCH_SUGGESTIONS_CLIENT}&q=${encodeURIComponent(
      trimmedQuery,
    )}`,
  );

  if (!response.ok) {
    return [createSearchSuggestion(trimmedQuery)];
  }

  const payload: unknown = await response.json();
  const [, suggestionValues] = Array.isArray(payload) ? payload : [];

  if (!Array.isArray(suggestionValues)) {
    return [createSearchSuggestion(trimmedQuery)];
  }

  const seenSuggestions = new Set([trimmedQuery.toLowerCase()]);
  const engineSuggestions = suggestionValues
    .filter(isSearchSuggestionValue)
    .filter((suggestion) => {
      const normalizedSuggestion = suggestion.trim().toLowerCase();

      if (seenSuggestions.has(normalizedSuggestion)) {
        return false;
      }

      seenSuggestions.add(normalizedSuggestion);
      return true;
    })
    .map(createSearchSuggestion);

  return [createSearchSuggestion(trimmedQuery), ...engineSuggestions];
};
