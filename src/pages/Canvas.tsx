import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Download, Share2, Trash2, Settings } from "lucide-react";

export default function Canvas() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
            </button>
            <div>
              <h1 className="text-xl font-bold">Canvas {id}</h1>
              <p className="text-sm text-gray-500">Project Name</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2.5 rounded-lg hover:bg-white/10 transition-colors">
              <Settings className="w-5 h-5" strokeWidth={2.5} />
            </button>
            <button className="p-2.5 rounded-lg hover:bg-white/10 transition-colors">
              <Share2 className="w-5 h-5" strokeWidth={2.5} />
            </button>
            <button className="p-2.5 rounded-lg hover:bg-white/10 transition-colors">
              <Download className="w-5 h-5" strokeWidth={2.5} />
            </button>
            <button className="p-2.5 rounded-lg hover:bg-red-500/20 text-red-500 transition-colors">
              <Trash2 className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </header>

      {/* Canvas Area */}
      <main className="flex items-center justify-center p-8 min-h-[calc(100vh-80px)]">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#FF6B5A] to-[#FB923C] flex items-center justify-center">
            <span className="text-4xl font-black">🎨</span>
          </div>
          <h2 className="text-3xl font-black mb-2">Canvas {id}</h2>
          <p className="text-gray-500">Canvas editor will be implemented here</p>
        </div>
      </main>
    </div>
  );
}
