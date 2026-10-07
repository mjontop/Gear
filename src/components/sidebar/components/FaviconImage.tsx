import { GlobeIcon } from "lucide-react";
import { useEffect, useState } from "react";

export type FaviconImageProps = {
  favIconUrl?: string;
  size?: number;
  className?: string;
};

export const FaviconImage = ({
  favIconUrl,
  size = 18,
  className = "",
}: FaviconImageProps) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [favIconUrl]);

  if (favIconUrl && !imageError) {
    return (
      <span className={`sidebar_favicon_box ${className}`} aria-hidden="true">
        <img
          src={favIconUrl}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setImageError(true)}
          className="sidebar_favicon_img"
        />
      </span>
    );
  }

  return (
    <span className={`sidebar_favicon_box ${className}`} aria-hidden="true">
      <GlobeIcon size={size - 2} className="sidebar_fallback_icon" />
    </span>
  );
};
