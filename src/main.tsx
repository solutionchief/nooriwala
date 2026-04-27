import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { applyPrefs, loadPrefs } from "./lib/appearance";

applyPrefs(loadPrefs());

createRoot(document.getElementById("root")!).render(<App />);
