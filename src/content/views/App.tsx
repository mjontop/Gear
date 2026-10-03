import { useEffect } from "react";
import { Spotlight } from "@/components/spotlight";
import { CopyUrlToast } from "../components/CopyUrlToast";
import {
  getSpotlightStyleVariables,
  useSpotlightPreferences,
  useTheme,
} from "@/lib/preferences";

function App() {
  const { preferences } = useSpotlightPreferences();
  const activeTheme = useTheme(preferences.theme);

  useEffect(() => {
    const host = document.getElementById("crxjs-app");
    if (host) {
      host.setAttribute("data-theme", activeTheme);
      const styleVars = getSpotlightStyleVariables(preferences) as Record<
        string,
        string
      >;
      for (const [key, value] of Object.entries(styleVars)) {
        if (value) {
          host.style.setProperty(key, value);
        } else {
          host.style.removeProperty(key);
        }
      }
    }
  }, [activeTheme, preferences]);

  return (
    <div
      data-theme={activeTheme}
      style={{
        display: "contents",
        ...getSpotlightStyleVariables(preferences),
      }}
    >
      <Spotlight />
      <CopyUrlToast />
    </div>
  );
}

export default App;
