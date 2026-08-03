import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setPlaceholderModule } = useOutletContext();

  const modules = [
    {
      id: "announcements",
      title: "Announcements & Events",
      description: "Submit event requests, browse approved campus activities, register for workshops, and track what's happening around university.",
      icon: "📢",
      comingSoon: false,
      buttonText: "Explore Module",
      action: () => navigate("/events")
    },
    {
      id: "lost-found",
      title: "Lost & Found",
      description: "Lost something on campus or found a misplaced item? Report it and track lost property instantly to return items to their owners.",
      icon: "🔍",
      comingSoon: true,
      buttonText: "Coming Soon",
      action: () => setPlaceholderModule("Lost & Found")
    },
    {
      id: "news",
      title: "CHARUSAT News",
      description: "Read official university press releases, campus updates, achievements, research breakthroughs, and student spotlight stories.",
      icon: "📰",
      comingSoon: true,
      buttonText: "Coming Soon",
      action: () => setPlaceholderModule("CHARUSAT News")
    }
  ];

  return (
    <div className="space-y-10 py-4">
      {/* Premium Hero Section */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-2xl p-8 sm:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent)] pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-6 backdrop-blur-sm">
            🏫 CHARUSAT University Portal
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Welcome to Campus Connect, <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">{user?.fullName}</span>!
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Your centralized hub for all university modules. Stay updated with campus events, report lost & found items, and read the latest CHARUSAT news.
          </p>
        </div>
      </div>

      {/* Modules Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Explore Platform Modules</h2>
          <p className="text-xs text-gray-400 mt-1">Select a module to view announcements, report items, or read articles.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modules.map((mod) => (
            <div
              key={mod.id}
              onClick={mod.action}
              className="group relative flex flex-col bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              {mod.comingSoon && (
                <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                  Coming Soon
                </span>
              )}
              
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform duration-300">
                {mod.icon}
              </div>

              <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {mod.title}
              </h3>
              
              <p className="text-xs text-gray-500 mt-2 leading-relaxed flex-1">
                {mod.description}
              </p>

              <button
                className={`mt-6 w-full py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
                  mod.comingSoon
                    ? "bg-gray-50 hover:bg-gray-100 text-gray-400 border border-gray-100"
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md"
                }`}
              >
                {mod.buttonText}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
