import { useEffect, useRef, useState } from "react";
import { CheckIcon } from "lucide-react";

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below
    }
  }

  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}

export const CopyUrlToast = () => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const handleMessage = async (message: { type?: string; url?: string }) => {
      if (message.type === "COPY_CURRENT_URL") {
        const urlToCopy = message.url || window.location.href;
        await copyTextToClipboard(urlToCopy);

        setToastMessage("Copied Current URL");

        if (timerRef.current) {
          window.clearTimeout(timerRef.current);
        }

        timerRef.current = window.setTimeout(() => {
          setToastMessage(null);
        }, 2500);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  if (!toastMessage) return null;

  return (
    <aside className="copy_toast_container" aria-live="polite">
      <button
        type="button"
        className="copy_toast"
        onClick={() => setToastMessage(null)}
        title="Click to dismiss"
      >
        <span className="copy_toast_icon_wrap">
          <CheckIcon size={12} className="copy_toast_icon" />
        </span>
        <span className="copy_toast_text">{toastMessage}</span>
      </button>
    </aside>
  );
};
