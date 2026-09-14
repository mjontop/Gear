import { GlobeIcon, SearchIcon } from "lucide-react";
import { useEffect } from "react";
import type { KeyboardEvent, RefObject } from "react";
import { ActiveTabs } from "./active-tabs";
import type { SpotlightResultData } from "./active-tabs";

type SpotlightViewProps = {
  inputRef: RefObject<HTMLInputElement | null>;
  overlayRef: RefObject<HTMLDialogElement | null>;
  searchValue: string;
  validUrl: string | null;
  results: SpotlightResultData[];
  selectedTabIndex: number;
  onClose: () => void;
  onSearchChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onSelectResult: (result: SpotlightResultData) => void;
};

export const SpotlightView = ({
  inputRef,
  overlayRef,
  searchValue,
  validUrl,
  results,
  selectedTabIndex,
  onClose,
  onSearchChange,
  onKeyDown,
  onSelectResult,
}: SpotlightViewProps) => {
  useEffect(() => {
    const dialog = overlayRef.current;

    if (!dialog || dialog.open) return;

    dialog.showModal();
    inputRef.current?.focus();

    return () => {
      if (dialog.open) dialog.close();
    };
  }, [inputRef, overlayRef]);

  return (
    <dialog
      ref={overlayRef}
      className="spotlight_overlay"
      aria-label="Spotlight search"
      onCancel={onClose}
    >
      <button
        type="button"
        className="spotlight_backdrop"
        aria-label="Close Spotlight search"
        onClick={onClose}
      />
      <div className="spotlight_container">
        <div className="search_header">
          {validUrl ? (
            <GlobeIcon size={24} className="search_icon" />
          ) : (
            <SearchIcon size={24} className="search_icon" />
          )}
          <label htmlFor="spotlight-search" className="search_label">
            Search
          </label>
          <input
            ref={inputRef}
            id="spotlight-search"
            autoFocus={true}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            name="search"
            type="text"
            value={searchValue}
            className="search_input"
            placeholder="Search or Enter URL...."
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={onKeyDown}
          />
        </div>
        <ActiveTabs
          results={results}
          selectedIndex={selectedTabIndex}
          onSelectResult={onSelectResult}
        />
      </div>
    </dialog>
  );
};
