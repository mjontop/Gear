import { CheckIcon, PlusIcon, XIcon } from "lucide-react";

type BookmarkFormProps = {
  titleInput: string;
  urlInput: string;
  editingId: string | null;
  formErrors: {
    title?: string;
    url?: string;
  };
  onTitleChange: (value: string) => void;
  onUrlChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancelEdit: () => void;
};

export const BookmarkForm = ({
  titleInput,
  urlInput,
  editingId,
  formErrors,
  onTitleChange,
  onUrlChange,
  onSubmit,
  onCancelEdit,
}: BookmarkFormProps) => {
  return (
    <div className="form_card">
      <div className="form_header">
        <span className="form_title">
          {editingId ? "Edit Bookmark" : "Add New Bookmark"}
        </span>
        {editingId && (
          <button
            type="button"
            className="icon_btn"
            onClick={onCancelEdit}
            title="Cancel edit"
          >
            <XIcon size={14} />
          </button>
        )}
      </div>

      <form onSubmit={onSubmit} className="form_fields">
        <div className="input_group">
          <label htmlFor="bookmark-title" className="input_label">
            Bookmark Title
          </label>
          <input
            id="bookmark-title"
            type="text"
            placeholder="e.g. !f Facebook, GitHub Dashboard"
            value={titleInput}
            onChange={(e) => onTitleChange(e.target.value)}
            className="form_input"
          />
          {formErrors.title ? (
            <span className="input_error">{formErrors.title}</span>
          ) : (
            <span className="input_helper">
              Can include custom shortcuts like !f
            </span>
          )}
        </div>

        <div className="input_group">
          <label htmlFor="bookmark-url" className="input_label">
            Bookmark URL
          </label>
          <input
            id="bookmark-url"
            type="text"
            placeholder="https://facebook.com"
            value={urlInput}
            onChange={(e) => onUrlChange(e.target.value)}
            className="form_input"
          />
          {formErrors.url ? (
            <span className="input_error">{formErrors.url}</span>
          ) : (
            <span className="input_helper">
              Website address (e.g. https://example.com)
            </span>
          )}
        </div>

        <div className="form_actions">
          {editingId && (
            <button
              type="button"
              className="btn btn_secondary"
              onClick={onCancelEdit}
            >
              Cancel
            </button>
          )}
          <button type="submit" className="btn btn_primary">
            {editingId ? (
              <>
                <CheckIcon size={15} />
                Update Bookmark
              </>
            ) : (
              <>
                <PlusIcon size={15} />
                Add Bookmark
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
