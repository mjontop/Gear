import { ArrowRightIcon } from "lucide-react";

export type SuggestionItemData = {
  id: number | string;
  title: string;
  url: string;
  favIconUrl?: string;
};

type SuggestionItemProps<T extends SuggestionItemData> = {
  item: T;
  isSelected: boolean;
  isActive?: boolean;
  actionLabel?: string;
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
  onSelect,
}: SuggestionItemProps<T>) => {
  return (
    <button
      type="button"
      className={`suggestion_item ${
        isSelected || isActive ? "suggestion_item_active" : ""
      }`}
      onClick={() => onSelect(item)}
    >
      <span className="favicon_wrap" aria-hidden="true">
        {item.favIconUrl ? (
          <img className="favicon" src={item.favIconUrl} alt="" />
        ) : (
          <span className="favicon_fallback">
            {getFallbackLabel(item.title)}
          </span>
        )}
      </span>
      <span className="suggestion_title">{item.title}</span>
      {actionLabel && (
        <span className="suggestion_action">
          {actionLabel}
          <ArrowRightIcon size={18} className="suggestion_action_icon" />
        </span>
      )}
    </button>
  );
};