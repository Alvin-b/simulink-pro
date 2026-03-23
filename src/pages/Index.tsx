import { ComponentLibrary } from "@/components/simulation/ComponentLibrary";
import { Viewport3D } from "@/components/simulation/Viewport3D";
import { PropertiesPanel } from "@/components/simulation/PropertiesPanel";
import { ConsolePanel } from "@/components/simulation/ConsolePanel";
import { TopToolbar } from "@/components/simulation/TopToolbar";
import { CodeEditor } from "@/components/simulation/CodeEditor";
import { useArduinoVM } from "@/hooks/useArduinoVM";

const Index = () => {
  // Initialize the Arduino VM
  useArduinoVM();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <TopToolbar />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-60 flex-shrink-0 border-r border-border bg-card overflow-hidden">
          <ComponentLibrary />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 relative">
            <Viewport3D />
            <CodeEditor />
          </div>
          <ConsolePanel />
        </div>
        <div className="w-56 flex-shrink-0 border-l border-border bg-card overflow-hidden">
          <PropertiesPanel />
        </div>
      </div>
    </div>
  );
};

export default Index;
