import { Link } from "react-router-dom";
import ThemePreference from "../components/ThemePreference";
import PageTransition from "../components/PageTransition";

export default function LandingPage() {
  return (
    <PageTransition>
      <main className="min-h-dvh bg-gray-50 text-gray-900">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-4 py-5 sm:gap-4 sm:px-8 lg:px-12">
        <Link to="/" className="max-[360px]:text-xs text-base font-semibold tracking-tight text-gray-900">
          CampusConnect
        </Link>
        <div className="flex items-center gap-2 sm:gap-6">
          <ThemePreference />
          <Link
            to="/login"
            className="max-[360px]:hidden rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] duration-200 hover:bg-blue-800 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 sm:px-4"
          >
            Sign in
          </Link>
        </div>
      </header>

      <section className="cc-landing-hero relative mx-auto grid min-h-[calc(100dvh-81px)] w-full max-w-7xl items-center gap-12 overflow-hidden px-5 pb-16 pt-12 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20 lg:px-12 lg:pb-24 lg:pt-16">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
            CHARUSAT campus portal
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Campus activities,
            <br className="hidden sm:block" /> connected in one place.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-gray-600">
            Browse campus events, submit an event request, and keep track of
            your submissions with your university account.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/signup"
              className="rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] duration-200 hover:bg-blue-800 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
            >
              Create an account
            </Link>
            <Link
              to="/login"
              className="rounded-md border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-[background-color,border-color,box-shadow,transform] duration-200 hover:border-gray-400 hover:bg-gray-100 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
            >
              Sign in
            </Link>
          </div>
        </div>

        <div className="border-y border-gray-200 py-8 lg:border-y-0 lg:border-l lg:py-5 lg:pl-12">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
            On CampusConnect
          </p>
          <ul className="mt-5 divide-y divide-gray-200 border-y border-gray-200">
            <li className="py-4">
              <h2 className="text-sm font-semibold text-gray-900">Campus events</h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                Explore the events available through the portal.
              </p>
            </li>
            <li className="py-4">
              <h2 className="text-sm font-semibold text-gray-900">Event requests</h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                Create and follow your submitted event requests.
              </p>
            </li>
            <li className="py-4">
              <h2 className="text-sm font-semibold text-gray-900">Your account</h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                Review your account information with your CHARUSAT account.
              </p>
            </li>
          </ul>
          <p className="mt-5 text-xs text-gray-500">
            For CHARUSAT students and faculty.
          </p>
        </div>
      </section>
      </main>
    </PageTransition>
  );
}
