import {
  DEFAULT_SEARCH_PROVIDER_ID,
  SEARCH_PROVIDERS,
  type SearchProviderId,
} from "@/constants";
import type { SearchSuggestion } from "./types";

const isSearchSuggestionValue = (
  suggestion: unknown,
): suggestion is string => {
  return typeof suggestion === "string" && suggestion.trim() !== "";
};

export const getSearchSuggestions = async (
  query: string,
  providerId: SearchProviderId = DEFAULT_SEARCH_PROVIDER_ID,
): Promise<SearchSuggestion[]> => {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [];
  }

  const provider =
    SEARCH_PROVIDERS[providerId] ||
    SEARCH_PROVIDERS[DEFAULT_SEARCH_PROVIDER_ID];

  const createSearchSuggestion = (q: string): SearchSuggestion => ({
    id: q,
    title: q,
    url: provider.searchUrl.replace("%s", encodeURIComponent(q)),
    query: q,
  });

  const endpoint = provider.suggestionsEndpoint.replace(
    "%s",
    encodeURIComponent(trimmedQuery),
  );

  try {
    const response = await fetch(endpoint);

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
  } catch {
    return [createSearchSuggestion(trimmedQuery)];
  }
};
