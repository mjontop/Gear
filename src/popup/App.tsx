import { useState } from "react";
import { AlertCircleIcon, CheckIcon } from "lucide-react";
import { BangForm } from "./components/BangForm";
import { BangsList } from "./components/BangsList";
import { BookmarkForm } from "./components/BookmarkForm";
import { BookmarksList } from "./components/BookmarksList";
import { NavigationTabs, type PopupTab } from "./components/NavigationTabs";
import { PopupFooter } from "./components/PopupFooter";
import { PopupHeader } from "./components/PopupHeader";
import { useBangsManager } from "./hooks/useBangsManager";
import { useBookmarksManager } from "./hooks/useBookmarksManager";
import "./App.css";

export default function App() {
  const [activeTab, setActiveTab] = useState<PopupTab>("bangs");
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const showStatus = (text: string, type: "success" | "error" = "success") => {
    setStatusMessage({ text, type });
    window.setTimeout(() => {
      setStatusMessage(null);
    }, 2800);
  };

  const bangsManager = useBangsManager(showStatus);
  const bookmarksManager = useBookmarksManager(showStatus);

  const currentCount =
    activeTab === "bangs"
      ? Object.keys(bangsManager.allBangs).length
      : bookmarksManager.bookmarks.length;

  return (
    <div className="popup_container">
      <PopupHeader activeTab={activeTab} totalCount={currentCount} />

      <NavigationTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        bangsCount={Object.keys(bangsManager.allBangs).length}
        bookmarksCount={bookmarksManager.bookmarks.length}
      />

      {statusMessage && (
        <div className={`status_banner status_${statusMessage.type}`}>
          {statusMessage.type === "success" ? (
            <CheckIcon size={16} />
          ) : (
            <AlertCircleIcon size={16} />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {activeTab === "bangs" ? (
        <>
          <BangForm
            prefixInput={bangsManager.prefixInput}
            urlInput={bangsManager.urlInput}
            editingPrefix={bangsManager.editingPrefix}
            formErrors={bangsManager.formErrors}
            onPrefixChange={(val) => {
              bangsManager.setPrefixInput(val);
              if (bangsManager.formErrors.prefix) {
                bangsManager.setFormErrors((prev) => ({
                  ...prev,
                  prefix: undefined,
                }));
              }
            }}
            onUrlChange={(val) => {
              bangsManager.setUrlInput(val);
              if (bangsManager.formErrors.url) {
                bangsManager.setFormErrors((prev) => ({
                  ...prev,
                  url: undefined,
                }));
              }
            }}
            onSubmit={bangsManager.handleSubmit}
            onCancelEdit={bangsManager.handleCancelEdit}
          />
          <BangsList
            bangs={bangsManager.filteredBangsList}
            searchFilter={bangsManager.searchFilter}
            customCount={Object.keys(bangsManager.customBangs).length}
            onSearchFilterChange={bangsManager.setSearchFilter}
            onEdit={bangsManager.handleEditClick}
            onDelete={bangsManager.handleDelete}
            onResetDefaults={bangsManager.handleResetDefaults}
          />
        </>
      ) : (
        <>
          <BookmarkForm
            titleInput={bookmarksManager.titleInput}
            urlInput={bookmarksManager.urlInput}
            editingId={bookmarksManager.editingId}
            formErrors={bookmarksManager.formErrors}
            onTitleChange={(val) => {
              bookmarksManager.setTitleInput(val);
              if (bookmarksManager.formErrors.title) {
                bookmarksManager.setFormErrors((prev) => ({
                  ...prev,
                  title: undefined,
                }));
              }
            }}
            onUrlChange={(val) => {
              bookmarksManager.setUrlInput(val);
              if (bookmarksManager.formErrors.url) {
                bookmarksManager.setFormErrors((prev) => ({
                  ...prev,
                  url: undefined,
                }));
              }
            }}
            onSubmit={bookmarksManager.handleSubmit}
            onCancelEdit={bookmarksManager.handleCancelEdit}
          />
          <BookmarksList
            bookmarks={bookmarksManager.filteredBookmarks}
            searchFilter={bookmarksManager.searchFilter}
            onSearchFilterChange={bookmarksManager.setSearchFilter}
            onEdit={bookmarksManager.handleEditClick}
            onDelete={bookmarksManager.handleDelete}
          />
        </>
      )}

      <PopupFooter />
    </div>
  );
}
