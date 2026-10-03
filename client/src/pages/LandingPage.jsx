import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  const featurePills = [
    "📢 Events",
    "📰 Campus News",
    "🏠 Hostel Finder",
    "🚌 Bus Schedules",
    "🎓 Scholarships",
  ];

  const avatars = [
    { initials: "KB", bg: "bg-blue-500" },
    { initials: "AP", bg: "bg-violet-500" },
    { initials: "DS", bg: "bg-indigo-500" },
    { initials: "RN", bg: "bg-emerald-500" },
    { initials: "VK", bg: "bg-amber-500" },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#0d0d14] lg:h-screen lg:overflow-hidden">
      {/* =========================================================================
          LEFT PANEL — Brand & Hero (60% width on desktop, bottom on mobile)
          ========================================================================= */}
      <div className="order-2 lg:order-1 w-full lg:w-[60%] relative overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16">
        {/* Decorative Blurred Glowing Orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Subtle Geometric Radial Grid Pattern Overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Top Left Navigation Bar Row */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)] animate-pulse" />
            <span className="font-extrabold text-white text-base sm:text-lg tracking-tight">
              CampusConnect
            </span>
          </div>

          <span className="text-xs text-white/40 font-mono tracking-wider uppercase font-semibold">
            CHARUSAT University
          </span>
        </div>

        {/* Center Content (Hero) */}
        <div className="relative z-10 my-8 sm:my-auto max-w-xl">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border border-white/10 bg-white/5 text-white/60 backdrop-blur-sm mb-6 shadow-sm">
            <span>🎓 Campus Intelligence Platform</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08]">
            <div>One Platform.</div>
            <div className="bg-gradient-to-r from-blue-400 via-violet-400 to-indigo-300 bg-clip-text text-transparent">
              Every Campus Service.
            </div>
          </h1>

          {/* Subheadline */}
          <p className="text-sm sm:text-base text-white/50 leading-relaxed max-w-md mt-4 font-normal">
            Events. News. Hostels. Buses. Scholarships. All connected for CHARUSAT
            students and faculty.
          </p>

          {/* Feature Pills Row */}
          <div className="flex flex-wrap gap-2 pt-6">
            {featurePills.map((pill) => (
              <span
                key={pill}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 text-xs px-3 py-1 rounded-full transition-colors backdrop-blur-sm select-none"
              >
                {pill}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Social Proof Line */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex flex-wrap items-center gap-3">
          <div className="flex -space-x-2">
            {avatars.map((av, index) => (
              <div
                key={index}
                className={`w-7 h-7 rounded-full ${av.bg} flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-[#1b173d] shadow-sm`}
              >
                {av.initials}
              </div>
            ))}
          </div>

          <div className="text-xs text-white/50 font-medium">
            <span className="text-white/80 font-bold">500+ users</span>
            <span className="mx-1.5 text-white/30">·</span>
            <span>Trusted by students & faculty at CHARUSAT</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RIGHT PANEL — Auth Card (40% width on desktop, top on mobile)
          ========================================================================= */}
      <div className="order-1 lg:order-2 w-full lg:w-[40%] bg-[#0d0d14] flex items-center justify-center p-4 sm:p-8 lg:p-12 relative">
        {/* Subtle background glow for auth panel */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-sm bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-2xl transition-all duration-300">
          {/* Logo Mark */}
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/25 mb-6">
            <span className="text-white font-black text-xl tracking-tight">C</span>
          </div>

          {/* Heading & Subtext */}
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Welcome back
          </h2>
          <p className="text-sm text-white/40 mt-1 mb-8 leading-relaxed">
            Sign in to your CampusConnect account or create a new one.
          </p>

          {/* Stacked Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate("/login")}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span>Sign In</span>
              <span className="font-bold">→</span>
            </button>

            <button
              onClick={() => navigate("/signup")}
              className="w-full py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/80 hover:text-white text-sm font-semibold transition-all duration-200 cursor-pointer active:scale-95 text-center"
            >
              Create Account
            </button>
          </div>

          {/* Card Footer Divider */}
          <div className="border-t border-white/5 mt-8 pt-6 text-center">
            <div className="text-xs text-white/25 font-mono">
              CHARUSAT University · Anand, Gujarat
            </div>
            <div className="text-[10px] text-white/20 mt-2.5 flex items-center justify-center gap-1">
              <span>🔒</span>
              <span>Secure login · CHARUSAT verified emails only</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
