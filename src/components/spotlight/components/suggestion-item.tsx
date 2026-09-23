import { ArrowRightIcon, Volume2Icon, VolumeXIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

export type SuggestionItemData = {
  id: number | string;
  title: string;
  url: string;
  favIconUrl?: string;
  audible?: boolean;
  muted?: boolean;
};

type SuggestionItemProps<T extends SuggestionItemData> = {
  item: T;
  isSelected: boolean;
  isActive?: boolean;
  actionLabel?: string;
  fallbackIcon?: ReactNode;
  onSelect: (item: T) => void;
};

const getFallbackLabel = (title: string) => {
  const trimmedTitle = title.trim();

  return trimmedTitle ? trimmedTitle.charAt(0).toUpperCase() : "?";
};

export const SuggestionItem = <T extends SuggestionItemData>({
  item,
  isSelected,
  isActive = false,
  actionLabel,
  fallbackIcon,
  onSelect,
}: SuggestionItemProps<T>) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [item.favIconUrl]);

  const showFavicon = Boolean(item.favIconUrl) && !imageError;

  return (
    <button
      type="button"
      className={`suggestion_item ${
        isSelected || isActive ? "suggestion_item_active" : ""
      }`}
      onClick={() => onSelect(item)}
    >
      <span className="favicon_wrap" aria-hidden="true">
        {showFavicon ? (
          <img
            className="favicon"
            src={item.favIconUrl}
            alt=""
            width={20}
            height={20}
            loading="eager"
            decoding="async"
            onError={() => setImageError(true)}
          />
        ) : fallbackIcon ? (
          fallbackIcon
        ) : (
          <span className="favicon_fallback">
            {getFallbackLabel(item.title)}
          </span>
        )}
      </span>
      <span className="suggestion_title">{item.title}</span>
      {(item.audible || item.muted) && (
        <span
          className={`tab_audible_indicator ${item.muted ? "tab_audible_muted" : ""}`}
          title={item.muted ? "Tab is muted" : "Playing audio"}
          aria-label={item.muted ? "Tab is muted" : "Playing audio"}
        >
          {item.muted ? (
            <VolumeXIcon size={14} className="tab_audible_icon" />
          ) : (
            <Volume2Icon size={14} className="tab_audible_icon" />
          )}
        </span>
      )}
      {actionLabel && (
        <span className="suggestion_action">
          {actionLabel}
          <ArrowRightIcon size={18} className="suggestion_action_icon" />
        </span>
      )}
    </button>
  );
};
