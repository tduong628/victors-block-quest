import { useMemo } from "react";
import StarterVillageMap from "./components/StarterVillageMap";
import { starterVillagePack } from "./data/lessonPacks/starter-village";

export default function App() {
  const sessionId = useMemo(() => crypto.randomUUID(), []);
  return (
    <div data-testid="app-shell" className="h-screen w-screen bg-slate-900 text-white">
      <StarterVillageMap pack={starterVillagePack} sessionId={sessionId} />
    </div>
  );
}
