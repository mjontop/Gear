import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { SearchIcon } from "lucide-react";
import styles from "./spotlight.module.css";
import { getRedirectUrl } from "@/lib/redirect";

export const Spotlight = () => {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleMessage = (message: { type?: string }) => {
      if (message.type === "TOGGLE_SPOTLIGHT") {
        setIsOpen((prev) => !prev);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const handleKeydown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
    if (e.key === "Enter" && inputRef.current) {
      const redirectUrl = getRedirectUrl(inputRef.current.value);
      window.open(redirectUrl, "_blank");
      setIsOpen(false);
      inputRef.current.value = "";
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.spotlight_overlay} onClick={() => setIsOpen(false)}>
      <div
        className={styles.spotlight_container}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.search_header}>
          <SearchIcon size={24} className={styles.search_icon} />
          <input
            ref={inputRef}
            autoFocus={true}
            name="search"
            type="text"
            // on tab change it should close the spotlight
            className={styles.search_input}
            placeholder="Search or Enter URL...."
            onKeyDown={handleKeydown}
          />
        </div>
      </div>
    </div>
  );
};
