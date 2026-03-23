import { ComponentLibrary } from "@/components/simulation/ComponentLibrary";
import { Viewport3D } from "@/components/simulation/Viewport3D";
import { PropertiesPanel } from "@/components/simulation/PropertiesPanel";
import { ConsolePanel } from "@/components/simulation/ConsolePanel";
import { TopToolbar } from "@/components/simulation/TopToolbar";

const Index = () => {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Top toolbar */}
      <TopToolbar />

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — Component Library */}
        <div className="w-60 flex-shrink-0 border-r border-border bg-card overflow-hidden">
          <ComponentLibrary />
        </div>

        {/* Center — 3D Viewport + Console */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 relative">
            <Viewport3D />
          </div>
          <ConsolePanel />
        </div>

        {/* Right sidebar — Properties */}
        <div className="w-56 flex-shrink-0 border-l border-border bg-card overflow-hidden">
          <PropertiesPanel />
        </div>
      </div>
    </div>
  );
};

export default Index;
