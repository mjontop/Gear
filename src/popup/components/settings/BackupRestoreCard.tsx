import type { RefObject, ChangeEvent } from "react";
import { DownloadIcon, UploadIcon } from "lucide-react";

export type BackupRestoreCardProps = {
  onExport: () => void;
  onImportClick: () => void;
  onImportFile: (e: ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
};

export const BackupRestoreCard = ({
  onExport,
  onImportClick,
  onImportFile,
  fileInputRef,
}: BackupRestoreCardProps) => (
  <div className="form_card">
    <div className="form_header">
      <div className="settings_card_title_row">
        <DownloadIcon size={18} className="settings_title_icon" />
        <span className="form_title">Backup & Restore</span>
      </div>
    </div>

    <p className="settings_subtitle">
      Export your custom bangs and preferences to a backup file, or restore from
      a previous backup.
    </p>

    <div className="backup_actions">
      <button
        type="button"
        className="btn btn_secondary backup_btn"
        onClick={onExport}
      >
        <DownloadIcon size={14} />
        <span>Export Backup (.json)</span>
      </button>

      <button
        type="button"
        className="btn btn_secondary backup_btn"
        onClick={onImportClick}
      >
        <UploadIcon size={14} />
        <span>Import Backup</span>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={onImportFile}
        className="sr_only"
        aria-label="Upload backup JSON file"
      />
    </div>
  </div>
);
