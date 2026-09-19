import { CheckIcon, PlusIcon, XIcon } from "lucide-react";

type BangFormProps = {
  prefixInput: string;
  urlInput: string;
  editingPrefix: string | null;
  formErrors: {
    prefix?: string;
    url?: string;
  };
  onPrefixChange: (value: string) => void;
  onUrlChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancelEdit: () => void;
};

export const BangForm = ({
  prefixInput,
  urlInput,
  editingPrefix,
  formErrors,
  onPrefixChange,
  onUrlChange,
  onSubmit,
  onCancelEdit,
}: BangFormProps) => {
  return (
    <div className="form_card">
      <div className="form_header">
        <span className="form_title">
          {editingPrefix ? `Edit Bang: ${editingPrefix}` : "Add Custom Bang"}
        </span>
        {editingPrefix && (
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
          <label htmlFor="bang-prefix" className="input_label">
            Bang Prefix
          </label>
          <input
            id="bang-prefix"
            type="text"
            placeholder="e.g. !gh, !ddg"
            value={prefixInput}
            onChange={(e) => onPrefixChange(e.target.value)}
            className="form_input"
          />
          {formErrors.prefix ? (
            <span className="input_error">{formErrors.prefix}</span>
          ) : (
            <span className="input_helper">
              Starts with ! (e.g. !gh for GitHub)
            </span>
          )}
        </div>

        <div className="input_group">
          <label htmlFor="bang-url" className="input_label">
            Target Search URL
          </label>
          <input
            id="bang-url"
            type="text"
            placeholder="https://github.com/search?q=%s"
            value={urlInput}
            onChange={(e) => onUrlChange(e.target.value)}
            className="form_input"
          />
          {formErrors.url ? (
            <span className="input_error">{formErrors.url}</span>
          ) : (
            <span className="input_helper">
              Must include %s where the query goes
            </span>
          )}
        </div>

        <div className="form_actions">
          {editingPrefix && (
            <button
              type="button"
              className="btn btn_secondary"
              onClick={onCancelEdit}
            >
              Cancel
            </button>
          )}
          <button type="submit" className="btn btn_primary">
            {editingPrefix ? (
              <>
                <CheckIcon size={14} />
                Update Bang
              </>
            ) : (
              <>
                <PlusIcon size={14} />
                Add Bang
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
