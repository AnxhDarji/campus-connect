import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyRequests } from "../services/eventService";
import api from "../services/api";
import LoadingState from "../components/LoadingState";

const STATUS_BADGE = {
  "Pending Approval": "bg-amber-50 text-amber-700 border-amber-100",
  "Approved": "bg-green-50 text-green-700 border-green-100",
  "Rejected": "bg-red-50 text-red-700 border-red-100",
  "Returned for Changes": "bg-blue-50 text-blue-700 border-blue-100",
  "Published": "bg-purple-50 text-purple-700 border-purple-100",
  "Archived": "bg-gray-50 text-gray-500 border-gray-100",
};

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestsError, setRequestsError] = useState("");

  // Instagram state
  const [instagramAccount, setInstagramAccount] = useState(null);
  const [instagramLoading, setInstagramLoading] = useState(true);
  const [instagramLoadError, setInstagramLoadError] = useState("");
  const [instagramBusy, setInstagramBusy] = useState(false);
  const [instagramMessage, setInstagramMessage] = useState(() => {
    const status = new URLSearchParams(window.location.search).get("instagram");
    if (status === "connected") return "Instagram connected successfully.";
    if (status === "error") return "Instagram connection failed or was cancelled.";
    return "";
  });

  // Dev token shortcut state
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [devToken, setDevToken] = useState("");

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setRequestsError("");
    try {
      const response = await getMyRequests();
      if (!Array.isArray(response.data.data)) {
        throw new Error("The request service returned an invalid response.");
      }
      setRequests(response.data.data);
    } catch (error) {
      setRequestsError(error.response?.data?.message || error.message || "Submission history could not be loaded. Please retry.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadInstagramAccount = useCallback(async () => {
    setInstagramLoading(true);
    setInstagramLoadError("");
    try {
      const response = await api.get("/api/instagram/account");
      setInstagramAccount(response.data.account);
    } catch {
      setInstagramLoadError("Could not check the Instagram connection. Retry before connecting or disconnecting an account.");
    } finally {
      setInstagramLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(loadRequests, 0);
    return () => window.clearTimeout(timeout);
  }, [loadRequests]);
  useEffect(() => {
    const timeout = window.setTimeout(loadInstagramAccount, 0);
    return () => window.clearTimeout(timeout);
  }, [loadInstagramAccount]);

  const disconnectInstagram = async () => {
    setInstagramBusy(true);
    setInstagramMessage("");
    try {
      await api.delete("/api/instagram/account");
      setInstagramAccount(null);
      setInstagramMessage("Instagram disconnected.");
    } catch {
      setInstagramMessage("Could not disconnect Instagram. Please try again.");
    } finally {
      setInstagramBusy(false);
    }
  };

  const connectWithDevToken = async () => {
    if (!devToken.trim()) {
      setInstagramMessage("Please paste your access token.");
      return;
    }
    setInstagramBusy(true);
    setInstagramMessage("");
    try {
      const res = await api.post("/api/instagram/connect-token", { access_token: devToken.trim() });
      setInstagramAccount({ username: res.data.account.username, connected: true, connectedAt: res.data.account.connectedAt });
      setInstagramMessage("Instagram connected via token.");
      setShowTokenInput(false);
      setDevToken("");
    } catch (e) {
      setInstagramMessage(e.response?.data?.message || "Token connection failed.");
    } finally {
      setInstagramBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Account</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">My Profile</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage your institution account and review event submissions.</p>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-3">
        {/* Profile Card */}
        <div className="space-y-5 xl:col-span-1">
          <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm sm:p-6">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white">
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-base font-bold text-gray-900">{user?.fullName}</h2>
            <p className="mt-1 break-all text-xs text-gray-500">{user?.email}</p>
            <span className="mt-3 inline-block rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {user?.role}
            </span>
            <div className="mt-5 w-full space-y-3 border-t border-gray-100 pt-4 text-left text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-gray-500">Institution ID</span>
                <span className="break-all text-right font-semibold uppercase text-gray-800">{user?.institutionId || "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-gray-500">Department</span>
                <span className="max-w-[60%] truncate text-right font-semibold text-gray-800">{user?.department_id?.name || "All Departments"}</span>
              </div>
              {requestsError ? (
                <p className="text-gray-500">Total submissions unavailable until history loads.</p>
              ) : !loading ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-gray-500">Total submissions</span>
                  <span className="font-semibold text-gray-800">{requests.length}</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Connected Accounts */}
          <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Connected Accounts</h3>
              <p className="mt-1 text-xs text-gray-500">Connect a professional Instagram account to publish event posts.</p>
            </div>

            {instagramLoading ? (
              <LoadingState message="Checking Instagram connection..." size={28} className="py-3" />
            ) : instagramLoadError ? (
              <div role="alert" className="space-y-3 rounded-lg border border-amber-100 bg-amber-50 p-3">
                <p className="text-xs text-amber-800">{instagramLoadError}</p>
                <button onClick={loadInstagramAccount} disabled={instagramLoading} className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-50">
                  {instagramLoading ? "Retrying..." : "Retry connection check"}
                </button>
              </div>
            ) : instagramAccount ? (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Instagram</p>
                  <p className="text-xs text-gray-500">@{instagramAccount.username}</p>
                  <p className="mt-1 text-[11px] font-medium text-green-700">Connected</p>
                </div>
                <button
                  disabled={instagramBusy}
                  onClick={disconnectInstagram}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  {instagramBusy ? "Disconnecting..." : "Disconnect"}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Primary: OAuth flow */}
                <a
                  href="http://localhost:5001/api/instagram/connect"
                  className="inline-flex w-full justify-center px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-semibold hover:opacity-90"
                >
                  Connect Instagram (OAuth)
                </a>

                {/* Dev shortcut: paste token */}
                <div className="border-t border-gray-100 pt-3">
                  <button
                    onClick={() => setShowTokenInput((v) => !v)}
                    className="text-[11px] text-gray-400 hover:text-gray-600 underline"
                  >
                    {showTokenInput ? "Hide" : "Use access token directly (dev/test)"}
                  </button>

                  {showTokenInput && (
                    <div className="mt-2 space-y-2">
                      <p className="text-[10px] font-medium text-amber-700">
                        Development mode only. Paste your Instagram access token below.
                      </p>
                      <textarea
                        value={devToken}
                        onChange={(e) => setDevToken(e.target.value)}
                        rows={3}
                        placeholder="Paste your Instagram access token here..."
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none font-mono"
                      />
                      <button
                        onClick={connectWithDevToken}
                        disabled={instagramBusy || !devToken.trim()}
                        className="w-full py-2 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-60"
                      >
                        {instagramBusy ? "Connecting..." : "Connect with Token"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {instagramMessage && (
              <p role="status" className={`text-xs font-medium ${instagramMessage.includes("success") || instagramMessage.includes("connected") ? "text-green-600" : "text-gray-500"}`}>
                {instagramMessage}
              </p>
            )}
          </section>
        </div>

        {/* Request History Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5 xl:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Submission History</h3>
                {!loading && !requestsError && <p className="mt-1 text-xs text-gray-500">{requests.length} submission{requests.length === 1 ? "" : "s"}</p>}
              </div>
              {!loading && !requestsError && requests.length > 0 && (
                <button onClick={() => navigate("/events/create")} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">
                  New event request
                </button>
              )}
            </div>

            {loading ? (
              <LoadingState message="Loading submission history..." size={32} className="py-8" />
            ) : requestsError ? (
              <div role="alert" className="flex flex-col items-start justify-between gap-3 rounded-xl border border-red-100 bg-red-50 p-5 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-semibold text-red-800">Submission history unavailable</p>
                  <p className="mt-1 text-xs text-red-700">{requestsError}</p>
                </div>
                <button onClick={loadRequests} disabled={loading} className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">
                  {loading ? "Retrying..." : "Retry"}
                </button>
              </div>
            ) : requests.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
                <h4 className="text-sm font-bold text-gray-900">No event requests yet</h4>
                <p className="mt-1">You haven't submitted any event requests. Create your first draft today!</p>
                <button
                  onClick={() => navigate("/events/create")}
                  className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                >
                  Create Event Request
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full min-w-[680px] text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th scope="col" className="px-3 py-3 text-left font-bold text-gray-500">Event Title</th>
                      <th scope="col" className="px-3 py-3 text-left font-bold text-gray-500">Category</th>
                      <th scope="col" className="px-3 py-3 text-left font-bold text-gray-500">Submitted date</th>
                      <th scope="col" className="px-3 py-3 text-left font-bold text-gray-500">Status</th>
                      <th scope="col" className="px-3 py-3 text-left font-bold text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r) => (
                      <tr key={r._id} className="border-b border-gray-50 transition hover:bg-gray-50">
                        <td className="max-w-[240px] truncate px-3 py-3 font-semibold text-gray-900">{r.title}</td>
                        <td className="px-3 py-3 text-gray-500">{r.category}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-gray-500">{new Date(r.created_at).toLocaleDateString()}</td>
                        <td className="px-3 py-3">
                          <span className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold ${STATUS_BADGE[r.status] || "bg-gray-50 text-gray-500 border-gray-100"}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate(`/events/${r._id}`)}
                              className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                            >
                              View
                            </button>
                            {r.status === "Pending Approval" && (
                              <>
                                <button
                                  onClick={() => navigate(`/events/${r._id}/edit`)}
                                  className="text-gray-500 hover:text-gray-700 font-semibold cursor-pointer"
                                >
                                  Edit
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
