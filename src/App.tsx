import { useMemo, useState } from "react";
import StarterVillageMap from "./components/StarterVillageMap";
import ParentGate from "./components/ParentGate";
import ParentDashboard from "./components/ParentDashboard";
import { starterVillagePack } from "./data/lessonPacks/starter-village";
import WorldCanvas from "./world/WorldCanvas";

export default function App() {
  const sessionId = useMemo(() => crypto.randomUUID(), []);
  const [dashboardOpen, setDashboardOpen] = useState(false);

  return (
    <div data-testid="app-shell" className="h-screen w-screen bg-[var(--surface)] text-[var(--ink)] font-ui">
      {dashboardOpen ? (
        <ParentDashboard onClose={() => setDashboardOpen(false)} />
      ) : (
        <>
          <WorldCanvas sessionId={sessionId} />
          <ParentGate onUnlock={() => setDashboardOpen(true)} />
        </>
      )}
    </div>
  );
}
