import { describe, it, expect } from "vitest";
import {
  getMatchScore,
  getSpotlightResults,
} from "@/components/spotlight/results";

describe("Spotlight Search Results Algorithm", () => {
  const mockTabs = [
    {
      id: 1,
      windowId: 1,
      title: "React Documentation",
      url: "https://react.dev",
      active: false,
    },
    {
      id: 2,
      windowId: 1,
      title: "GitHub",
      url: "https://github.com",
      active: false,
    },
  ];
  const mockBookmarks = [
    { id: "b1", title: "React Icons", url: "https://react-icons.github.io" },
  ];
  const mockHistory = [
    {
      id: "h1",
      title: "React Tutorial",
      url: "https://react.dev/learn",
      lastVisitTime: 100,
    },
  ];
  const mockSuggestions = [
    {
      id: "s1",
      query: "react 19 features",
      title: "react 19 features",
      url: "https://google.com/search?q=react",
    },
  ];

  it("returns top tabs and bookmarks when query is empty", () => {
    const results = getSpotlightResults({
      tabs: mockTabs,
      bookmarks: mockBookmarks,
      history: mockHistory,
      searchSuggestions: [],
      rawQuery: "",
      cleanQuery: "",
      maxResults: 5,
    });

    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results.some((r) => r.kind === "open-tab")).toBe(true);
  });

  it("prioritizes direct URL when input is a valid URL", () => {
    const results = getSpotlightResults({
      tabs: mockTabs,
      bookmarks: mockBookmarks,
      history: mockHistory,
      searchSuggestions: mockSuggestions,
      rawQuery: "https://vite.dev",
      cleanQuery: "https://vite.dev",
      validUrl: "https://vite.dev",
      maxResults: 5,
    });

    expect(results[0].kind).toBe("direct-url");
    expect(results[0].url).toBe("https://vite.dev");
  });

  it("ranks results matching title higher than url matches", () => {
    expect(getMatchScore("Other", "https://other.com", "xyz")).toBe(0);
    const results = getSpotlightResults({
      tabs: mockTabs,
      bookmarks: mockBookmarks,
      history: mockHistory,
      searchSuggestions: [],
      rawQuery: "react",
      cleanQuery: "react",
      maxResults: 5,
    });

    expect(results[0].title.toLowerCase()).toContain("react");
  });

  it("scores correctly when rawQuery differs from cleanQuery (e.g. with bang)", () => {
    const results = getSpotlightResults({
      tabs: mockTabs,
      bookmarks: mockBookmarks,
      history: mockHistory,
      searchSuggestions: [],
      rawQuery: "!g react",
      cleanQuery: "react",
      maxResults: 5,
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.kind === "open-tab")).toBe(true);
  });

  it("deduplicates identical URLs across sources", () => {
    const duplicateBookmarks = [
      { id: "b2", title: "React Dev", url: "https://react.dev/" },
    ];
    const duplicateHistory = [
      {
        id: "h_dup",
        title: "React Dev",
        url: "https://react.dev/",
        lastVisitTime: 50,
      },
    ];
    const results = getSpotlightResults({
      tabs: mockTabs,
      bookmarks: duplicateBookmarks,
      history: [...mockHistory, ...duplicateHistory],
      searchSuggestions: [],
      rawQuery: "react",
      cleanQuery: "react",
      maxResults: 5,
    });

    const reactDevResults = results.filter((r) =>
      r.url.startsWith("https://react.dev"),
    );
    expect(reactDevResults.length).toBe(2); // One tab (https://react.dev) and one history (https://react.dev/learn), duplicate bookmark and history omitted
  });

  it("handles URL-only match score and invalid URL fallback in getSpotlightResults", () => {
    const tabsWithUrlMatch = [
      {
        id: 3,
        windowId: 1,
        title: "Random Title",
        url: "https://mycustomsubdomain.test.org/page",
        active: false,
      },
    ];

    const results = getSpotlightResults({
      tabs: tabsWithUrlMatch,
      bookmarks: [
        {
          id: "bm_bad",
          title: "Bad Url BM",
          url: "not-a-valid-url:page",
        },
      ],
      history: [],
      searchSuggestions: [],
      rawQuery: "mycustomsubdomain",
      cleanQuery: "mycustomsubdomain",
      maxResults: 5,
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].url).toContain("mycustomsubdomain");

    const badUrlResults = getSpotlightResults({
      tabs: [],
      bookmarks: [
        {
          id: "bm_bad",
          title: "Bad Url BM",
          url: "not a valid url",
        },
      ],
      history: [],
      searchSuggestions: [],
      rawQuery: "bad",
      cleanQuery: "bad",
      maxResults: 5,
    });
    expect(badUrlResults[0].title).toBe("Bad Url BM");
  });

  it("allocates slots for search suggestions and preserves local results", () => {
    const results = getSpotlightResults({
      tabs: mockTabs,
      bookmarks: mockBookmarks,
      history: mockHistory,
      searchSuggestions: mockSuggestions,
      rawQuery: "react",
      cleanQuery: "react",
      maxResults: 3,
    });

    expect(results.length).toBe(3);
    expect(results.some((r) => r.kind === "search-suggestion")).toBe(true);
  });

  it("sorts history items with equal match score by lastVisitTime descending", () => {
    const history = [
      {
        id: "h_old",
        title: "Same Title React",
        url: "https://example.com/1",
        lastVisitTime: 100,
      },
      {
        id: "h_recent",
        title: "Same Title React",
        url: "https://example.com/2",
        lastVisitTime: 200,
      },
    ];

    const results = getSpotlightResults({
      tabs: [],
      bookmarks: [],
      history,
      searchSuggestions: [],
      rawQuery: "React",
      cleanQuery: "React",
      maxResults: 5,
    });

    expect(results[0].id).toBe("h_recent");
    expect(results[1].id).toBe("h_old");
  });

  it("sorts history items with different match scores", () => {
    const history = [
      {
        id: "h_contains",
        title: "Learning React Tutorial",
        url: "https://example.com/contains",
        lastVisitTime: 500,
      },
      {
        id: "h_starts",
        title: "React Official Docs",
        url: "https://example.com/starts",
        lastVisitTime: 100,
      },
    ];

    const results = getSpotlightResults({
      tabs: [],
      bookmarks: [],
      history,
      searchSuggestions: [],
      rawQuery: "react",
      cleanQuery: "react",
      maxResults: 5,
    });

    expect(results[0].id).toBe("h_starts");
    expect(results[1].id).toBe("h_contains");
  });

  it("sorts bookmarks by match score", () => {
    const bookmarks = [
      {
        id: "b_contains",
        title: "Learning React from scratch",
        url: "https://example.com/react",
      },
      {
        id: "b_starts",
        title: "React Framework Home",
        url: "https://reactjs.org",
      },
    ];

    const results = getSpotlightResults({
      tabs: [],
      bookmarks,
      history: [],
      searchSuggestions: [],
      rawQuery: "react",
      cleanQuery: "react",
      maxResults: 5,
    });

    expect(results[0].id).toBe("b_starts");
    expect(results[1].id).toBe("b_contains");
  });

  it("matches bookmarks on cleanQuery when rawQuery has bang prefix", () => {
    const results = getSpotlightResults({
      tabs: [],
      bookmarks: [
        {
          id: "b_clean",
          title: "TypeScript Handbook",
          url: "https://ts.dev",
        },
      ],
      history: [],
      searchSuggestions: [],
      rawQuery: "!g typescript",
      cleanQuery: "typescript",
      maxResults: 5,
    });

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("TypeScript Handbook");
  });
});
