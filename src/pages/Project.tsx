import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Plus, Grid3x3, LayoutGrid, Settings, Trash2 } from "lucide-react";
import { useState } from "react";

// Mock data
const mockCanvases = [
  { id: 1, name: "Hero Section v3", lastModified: "1 hour ago", thumbnail: "gradient-1" },
  { id: 2, name: "Mobile App Flow", lastModified: "3 hours ago", thumbnail: "gradient-2" },
  { id: 3, name: "Dashboard Layout", lastModified: "5 hours ago", thumbnail: "gradient-3" },
  { id: 4, name: "Landing Page", lastModified: "Yesterday", thumbnail: "gradient-5" },
];

type ViewMode = "grid" | "list";

export default function Project() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Grain texture */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Background elements */}
      <div className="fixed top-20 right-[-10%] w-96 h-96 bg-[#FF6B5A]/10 rounded-full blur-[120px]" />

      <div className="relative z-10 max-w-[1800px] mx-auto px-8 py-12">
        {/* Header */}
        <header className="mb-12">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" strokeWidth={2.5} />
            <span className="font-bold">Back to home</span>
          </button>

          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-6xl font-black tracking-tighter mb-2 bg-gradient-to-br from-white via-white to-gray-500 bg-clip-text text-transparent">
                Project {id}
              </h1>
              <p className="text-gray-400 text-lg font-medium">
                {mockCanvases.length} canvases
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button className="p-3 rounded-lg hover:bg-white/10 transition-colors">
                <Settings className="w-6 h-6" strokeWidth={2.5} />
              </button>
              <button className="p-3 rounded-lg hover:bg-red-500/20 text-red-500 transition-colors">
                <Trash2 className="w-6 h-6" strokeWidth={2.5} />
              </button>
              <button className="group relative px-6 py-3 bg-gradient-to-r from-[#FF6B5A] to-[#FB923C] text-white font-bold rounded-xl hover:shadow-[0_0_30px_rgba(255,107,90,0.4)] transition-all duration-300 hover:scale-105 active:scale-95">
                <span className="flex items-center gap-2">
                  <Plus className="w-5 h-5" strokeWidth={3} />
                  New Canvas
                </span>
              </button>
            </div>
          </div>

          {/* View controls */}
          <div className="flex justify-end mt-6">
            <div className="flex gap-2 bg-white/5 p-2 rounded-xl border-2 border-white/10">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-3 rounded-lg transition-all duration-300 ${
                  viewMode === "grid"
                    ? "bg-[#FF6B5A] text-white shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-white/10"
                }`}
              >
                <LayoutGrid className="w-5 h-5" strokeWidth={2.5} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-3 rounded-lg transition-all duration-300 ${
                  viewMode === "list"
                    ? "bg-[#FF6B5A] text-white shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-white/10"
                }`}
              >
                <Grid3x3 className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </header>

        {/* Canvases Grid */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {mockCanvases.map((canvas, index) => (
              <div
                key={canvas.id}
                onClick={() => navigate(`/canvas/${canvas.id}`)}
                className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] border-2 border-white/10 rounded-2xl overflow-hidden hover:border-[#FF6B5A]/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(255,107,90,0.15)] cursor-pointer animate-in fade-in zoom-in-50"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className={`aspect-video bg-gradient-to-br ${getThumbnailGradient(canvas.thumbnail)} relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-16 h-16 rounded-full bg-[#FF6B5A] flex items-center justify-center shadow-lg">
                      <span className="text-2xl">✏️</span>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-bold mb-1 group-hover:text-[#FF6B5A] transition-colors truncate">
                    {canvas.name}
                  </h3>
                  <p className="text-xs text-gray-600 font-medium">
                    {canvas.lastModified}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {mockCanvases.map((canvas, index) => (
              <div
                key={canvas.id}
                onClick={() => navigate(`/canvas/${canvas.id}`)}
                className="group flex items-center gap-4 bg-gradient-to-r from-white/5 to-white/[0.02] border-2 border-white/10 rounded-xl p-4 hover:border-[#FF6B5A]/50 transition-all duration-300 hover:bg-white/10 cursor-pointer animate-in fade-in slide-in-from-left-4"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className={`w-20 h-14 rounded-lg bg-gradient-to-br ${getThumbnailGradient(canvas.thumbnail)} flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate group-hover:text-[#FF6B5A] transition-colors">
                    {canvas.name}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 font-medium flex-shrink-0">
                  {canvas.lastModified}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getThumbnailGradient(thumbnail: string): string {
  const gradients: Record<string, string> = {
    "gradient-1": "from-[#FF6B5A] via-[#FB923C] to-[#FBBF24]", // Coral Sunset
    "gradient-2": "from-[#2DD4BF] via-[#06B6D4] to-[#0284C7]", // Teal Ocean
    "gradient-3": "from-[#FB923C] via-[#FF6B5A] to-[#EC4899]", // Warm Blend
    "gradient-4": "from-[#10B981] via-[#2DD4BF] to-[#06B6D4]", // Cool Mint
    "gradient-5": "from-[#FF6B5A] to-[#2DD4BF]", // Coral Teal
  };
  return gradients[thumbnail] || gradients["gradient-1"];
}
