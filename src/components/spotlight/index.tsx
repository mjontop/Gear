import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import styles from "./spotlight.module.css";

export const Spotlight = () => {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === "m") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.value = "";
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.spotlight_overlay} onClick={() => setIsOpen(false)}>
      <div
        className={styles.spotlight_container}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.search_header}>
          <Search size={24} className={styles.search_icon} />
          <input
            ref={inputRef}
            type="text"
            className={styles.search_input}
            placeholder="Search or Enter URL...."
          />
          <div className={styles.shortcut_hint}>
            <span>Alt</span>
            <span>+</span>
            <span>M</span>
          </div>
        </div>
      </div>
    </div>
  );
};
