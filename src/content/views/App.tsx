import { useEffect } from "react";
import { Spotlight } from "@/components/spotlight";
import { CopyUrlToast } from "../components/CopyUrlToast";
import { useSpotlightPreferences, useTheme } from "@/lib/preferences";

function App() {
  const { preferences } = useSpotlightPreferences();
  const activeTheme = useTheme(preferences.theme);

  useEffect(() => {
    const host = document.getElementById("crxjs-app");
    if (host) {
      host.setAttribute("data-theme", activeTheme);
    }
  }, [activeTheme]);

  return (
    <div data-theme={activeTheme} style={{ display: "contents" }}>
      <Spotlight />
      <CopyUrlToast />
    </div>
  );
}

export default App;
