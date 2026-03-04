import { useState } from "react";
import { useNavigate } from "react-router";
import { Folder, FileImage, Plus, Grid3x3, LayoutGrid, Search } from "lucide-react";

// Mock data - replace with real data later
const mockProjects = [
  { id: 1, name: "Brand Redesign", canvasCount: 8, lastModified: "2 hours ago", color: "from-terracotta to-warm-orange" },
  { id: 2, name: "Product Mockups", canvasCount: 12, lastModified: "Yesterday", color: "from-warm-orange to-terracotta" },
  { id: 3, name: "Website Wireframes", canvasCount: 6, lastModified: "3 days ago", color: "from-terracotta to-[#e89863]" },
];

const mockCanvases = [
  { id: 1, name: "Hero Section v3", project: "Brand Redesign", lastModified: "1 hour ago", thumbnail: "gradient-1" },
  { id: 2, name: "Mobile App Flow", project: "Product Mockups", lastModified: "3 hours ago", thumbnail: "gradient-2" },
  { id: 3, name: "Dashboard Layout", project: "Website Wireframes", lastModified: "5 hours ago", thumbnail: "gradient-3" },
  { id: 4, name: "Landing Page", project: "Brand Redesign", lastModified: "Yesterday", thumbnail: "gradient-4" },
  { id: 5, name: "Color Palette", project: "Brand Redesign", lastModified: "2 days ago", thumbnail: "gradient-5" },
  { id: 6, name: "Component Library", project: "Product Mockups", lastModified: "3 days ago", thumbnail: "gradient-6" },
];

type ViewMode = "grid" | "list";

export default function Home() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="h-screen bg-bg-deep text-white relative overflow-hidden flex flex-col">
      {/* Decorative background elements */}
      <div className="fixed top-20 right-[-10%] w-96 h-96 bg-terracotta/10 rounded-full blur-[120px] animate-pulse" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-terracotta/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 max-w-[1800px] mx-auto w-full flex flex-col h-full">
        {/* Fixed Header Section */}
        <div className="flex-shrink-0 px-8 pt-12 pb-8">
          {/* Header */}
          <header className="animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h1 className="text-7xl font-black tracking-tighter mb-2 bg-gradient-to-br from-white via-white to-gray-500 bg-clip-text text-transparent leading-[1.1]">
                Your Work
              </h1>
              <p className="text-gray-400 text-lg font-medium mt-1">
                {mockProjects.length} projects · {mockCanvases.length} canvases
              </p>
            </div>

            <button className="group relative px-8 py-4 bg-gradient-to-r from-terracotta to-warm-orange text-white font-bold text-lg rounded-xl hover:shadow-[0_0_30px_rgba(212,132,94,0.4)] transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative flex items-center gap-2">
                <Plus className="w-6 h-6" strokeWidth={2.5} />
                New Canvas
              </span>
            </button>
          </div>

          {/* Search and filters */}
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary group-focus-within:text-terracotta transition-colors" strokeWidth={2} />
              <input
                type="text"
                placeholder="Search canvases and projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-bg-panel/60 border border-terracotta/20 rounded-xl text-white placeholder:text-text-secondary focus:outline-none focus:border-terracotta/50 focus:bg-bg-panel/80 backdrop-blur-sm transition-all duration-300"
              />
            </div>

            <div className="flex gap-2 bg-bg-panel/60 p-2 rounded-xl border border-terracotta/20">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-3 rounded-lg transition-all duration-300 ${
                  viewMode === "grid"
                    ? "bg-terracotta text-white shadow-lg"
                    : "text-text-secondary hover:text-white hover:bg-terracotta/20"
                }`}
              >
                <LayoutGrid className="w-5 h-5" strokeWidth={2} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-3 rounded-lg transition-all duration-300 ${
                  viewMode === "list"
                    ? "bg-terracotta text-white shadow-lg"
                    : "text-text-secondary hover:text-white hover:bg-terracotta/20"
                }`}
              >
                <Grid3x3 className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
          </div>
          </header>
        </div>

        {/* Scrollable Content Section */}
        <div className="flex-1 overflow-y-auto px-8 pb-12 relative">
          {/* Subtle fade indicator at top */}
          <div className="sticky top-0 left-0 right-0 h-4 bg-gradient-to-b from-bg-deep to-transparent pointer-events-none z-10" />
        {/* Projects Section */}
        <section className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-4 mb-6">
            <Folder className="w-7 h-7 text-terracotta" strokeWidth={2} />
            <h2 className="text-3xl font-black tracking-tight">Projects</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockProjects.map((project, index) => (
              <div
                key={project.id}
                onClick={() => navigate(`/project/${project.id}`)}
                className="group relative bg-bg-panel/60 backdrop-blur-sm border border-terracotta/20 rounded-2xl p-6 hover:border-terracotta/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(212,132,94,0.15)] cursor-pointer animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${200 + index * 100}ms` }}
              >
                {/* Color accent */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${project.color} rounded-t-2xl`} />

                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 bg-gradient-to-br ${project.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <Folder className="w-7 h-7 text-white" strokeWidth={2} />
                  </div>
                  <span className="text-xs font-mono text-text-secondary bg-terracotta/10 px-3 py-1.5 rounded-full">
                    {project.canvasCount} canvases
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-2 group-hover:text-terracotta transition-colors">
                  {project.name}
                </h3>
                <p className="text-sm text-text-secondary font-medium">
                  Modified {project.lastModified}
                </p>
              </div>
            ))}

            {/* New Project Card */}
            <div className="group relative bg-bg-panel/40 backdrop-blur-sm border border-dashed border-terracotta/20 rounded-2xl p-6 hover:border-terracotta/50 hover:bg-bg-panel/60 transition-all duration-500 cursor-pointer flex flex-col items-center justify-center min-h-[180px] animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '500ms' }}>
              <Plus className="w-12 h-12 text-text-secondary group-hover:text-terracotta transition-colors mb-3 group-hover:scale-110 transition-transform" strokeWidth={2} />
              <span className="text-text-secondary group-hover:text-white font-bold transition-colors">
                New Project
              </span>
            </div>
          </div>
        </section>

        {/* Recent Canvases Section */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center gap-4 mb-6">
            <FileImage className="w-7 h-7 text-terracotta" strokeWidth={2} />
            <h2 className="text-3xl font-black tracking-tight">Recent Canvases</h2>
          </div>

          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {mockCanvases.map((canvas, index) => (
                <div
                  key={canvas.id}
                  onClick={() => navigate(`/canvas/${canvas.id}`)}
                  className="group relative bg-bg-panel/60 backdrop-blur-sm border border-terracotta/20 rounded-2xl overflow-hidden hover:border-terracotta/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(212,132,94,0.15)] cursor-pointer animate-in fade-in zoom-in-50"
                  style={{ animationDelay: `${400 + index * 80}ms` }}
                >
                  {/* Canvas Thumbnail */}
                  <div className={`aspect-video bg-gradient-to-br ${getThumbnailGradient(canvas.thumbnail)} relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-16 h-16 rounded-full bg-terracotta flex items-center justify-center shadow-lg">
                        <FileImage className="w-8 h-8 text-white" strokeWidth={2} />
                      </div>
                    </div>
                  </div>

                  {/* Canvas Info */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold mb-1 group-hover:text-terracotta transition-colors truncate">
                      {canvas.name}
                    </h3>
                    <p className="text-sm text-text-secondary font-medium mb-1 truncate">
                      {canvas.project}
                    </p>
                    <p className="text-xs text-text-secondary font-mono">
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
                  className="group flex items-center gap-4 bg-bg-panel/60 backdrop-blur-sm border border-terracotta/20 rounded-xl p-4 hover:border-terracotta/50 transition-all duration-300 hover:bg-bg-panel/80 cursor-pointer animate-in fade-in slide-in-from-left-4"
                  style={{ animationDelay: `${400 + index * 60}ms` }}
                >
                  <div className={`w-20 h-14 rounded-lg bg-gradient-to-br ${getThumbnailGradient(canvas.thumbnail)} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold truncate group-hover:text-terracotta transition-colors">
                      {canvas.name}
                    </h3>
                    <p className="text-sm text-text-secondary font-medium truncate">
                      {canvas.project}
                    </p>
                  </div>
                  <p className="text-sm text-text-secondary font-mono flex-shrink-0">
                    {canvas.lastModified}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
        </div>
      </div>
    </div>
  );
}

// Helper function for thumbnail gradients (warm terracotta/earthy palette)
function getThumbnailGradient(thumbnail: string): string {
  const gradients: Record<string, string> = {
    "gradient-1": "from-terracotta via-warm-orange to-golden-earth", // Terracotta Sunset
    "gradient-2": "from-warm-orange via-terracotta to-[#c97a54]", // Warm Clay
    "gradient-3": "from-[#e89863] via-terracotta to-warm-orange", // Soft Terracotta
    "gradient-4": "from-terracotta via-[#e89863] to-[#f0ac7b]", // Light Warmth
    "gradient-5": "from-terracotta to-warm-orange", // Classic Terracotta
    "gradient-6": "from-golden-earth via-warm-orange to-terracotta", // Golden Earth
  };
  return gradients[thumbnail] || gradients["gradient-1"];
}
