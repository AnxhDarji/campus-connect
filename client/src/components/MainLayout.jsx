import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function MainLayout() {
  const [placeholderModule, setPlaceholderModule] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar onShowPlaceholder={(name) => setPlaceholderModule(name)} />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet context={{ setPlaceholderModule }} />
      </main>

      {/* Modern Glassmorphic Coming Soon Modal */}
      {placeholderModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 transition-all duration-300">
          <div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <span className="text-3xl">🛠️</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{placeholderModule}</h3>
            <p className="text-xs text-gray-500 mb-6">
              This module is currently under development. Stay tuned for exciting updates!
            </p>
            <button
              onClick={() => setPlaceholderModule(null)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              Back to Campus Connect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
