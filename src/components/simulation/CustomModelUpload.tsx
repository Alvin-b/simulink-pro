import { useState, useRef, useCallback } from "react";
import { Upload, FileBox, Trash2, AlertCircle } from "lucide-react";
import { useSimulationStore } from "@/stores/simulationStore";

/**
 * Custom GLB/GLTF Model Upload
 * Allows users to upload their own 3D models for use as components.
 */

interface CustomModel {
  id: string;
  name: string;
  url: string;
  fileSize: string;
  timestamp: number;
}

// Store uploaded models in memory (persists during session)
const uploadedModels: CustomModel[] = [];

export function CustomModelUpload() {
  const [models, setModels] = useState<CustomModel[]>(uploadedModels);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addComponent = useSimulationStore((s) => s.addComponent);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const handleFile = useCallback((file: File) => {
    setError(null);
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "glb" && ext !== "gltf") {
      setError("Only .glb and .gltf files are supported");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("File too large (max 50MB)");
      return;
    }

    const url = URL.createObjectURL(file);
    const model: CustomModel = {
      id: `custom-${Date.now()}`,
      name: file.name.replace(/\.(glb|gltf)$/i, ""),
      url,
      fileSize: formatSize(file.size),
      timestamp: Date.now(),
    };
    uploadedModels.push(model);
    setModels([...uploadedModels]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const removeModel = useCallback((id: string) => {
    const idx = uploadedModels.findIndex((m) => m.id === id);
    if (idx >= 0) {
      URL.revokeObjectURL(uploadedModels[idx].url);
      uploadedModels.splice(idx, 1);
      setModels([...uploadedModels]);
    }
  }, []);

  return (
    <div className="p-2 border-t border-border">
      <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1.5 px-1">
        Custom Models
      </p>

      {/* Drop zone */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
        <p className="text-[10px] text-muted-foreground">
          Drop .glb/.gltf or click to upload
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".glb,.gltf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <div className="flex items-center gap-1.5 mt-1.5 px-1 text-[10px] text-destructive">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}

      {/* Uploaded models list */}
      {models.length > 0 && (
        <div className="mt-2 space-y-1">
          {models.map((model) => (
            <div
              key={model.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-secondary/50 group"
            >
              <FileBox className="w-3.5 h-3.5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-foreground truncate">{model.name}</p>
                <p className="text-[9px] text-muted-foreground">{model.fileSize}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeModel(model.id); }}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
