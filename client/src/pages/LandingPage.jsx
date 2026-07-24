import { useNavigate } from 'react-router-dom';
import heroImg from '../assets/hero.png';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImg})` }}
      />
      <div className="absolute inset-0 bg-black/55" />

      {/* Card */}
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl px-10 py-12 w-full max-w-md mx-4 text-center">
        {/* University name */}
        <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase mb-1">
          CHARUSAT
        </p>
        <p className="text-xs text-gray-400 mb-6">
          Charotar University of Science and Technology
        </p>

        {/* Brand */}
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">
          CampusConnect
        </h1>
        <p className="text-sm text-gray-400 mb-10">
          One Platform. Every Campus Service.
        </p>

        {/* Divider */}
        <div className="border-t border-gray-100 mb-8" />

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/login')}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors duration-150 cursor-pointer"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors duration-150 cursor-pointer"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}
