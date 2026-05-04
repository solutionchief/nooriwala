import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { applyPrefs, loadPrefs } from "./lib/appearance";
import { PHOTO_WALLPAPERS } from "./lib/photoWallpapers";

(window as any).__PHOTO_WP_URL = Object.fromEntries(PHOTO_WALLPAPERS.map(p => [p.id, p.url]));
applyPrefs(loadPrefs());

createRoot(document.getElementById("root")!).render(<App />);
