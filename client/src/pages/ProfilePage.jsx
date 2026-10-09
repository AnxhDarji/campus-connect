import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyRequests } from "../services/eventService";
import api from "../services/api";

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

  // Instagram state
  const [instagramAccount, setInstagramAccount] = useState(null);
  const [instagramLoading, setInstagramLoading] = useState(true);
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

  useEffect(() => {
    getMyRequests()
      .then((res) => setRequests(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let active = true;
    api.get("/api/instagram/account")
      .then((res) => { if (active) setInstagramAccount(res.data.account); })
      .catch(() => { if (active) setInstagramMessage("Could not load connected accounts. Please try again."); })
      .finally(() => { if (active) setInstagramLoading(false); });
    return () => { active = false; };
  }, []);

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
        <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
        <p className="text-xs text-gray-400 mt-1">Manage your institution account and track your submitted event requests.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-extrabold shadow-md mb-4">
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-base font-bold text-gray-900">{user?.fullName}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
            <span className="inline-block mt-3 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">
              {user?.role}
            </span>
            <div className="w-full mt-8 space-y-4 pt-6 border-t border-gray-50 text-left text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Institution ID</span>
                <span className="font-semibold text-gray-700 uppercase">{user?.institutionId || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Department</span>
                <span className="font-semibold text-gray-700 truncate max-w-[150px]">{user?.department_id?.name || "All Departments"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Total Submissions</span>
                <span className="font-semibold text-gray-700">{requests.length}</span>
              </div>
            </div>
          </div>

          {/* Connected Accounts */}
          <section className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Connected Accounts</h3>
              <p className="text-xs text-gray-400 mt-1">Connect a professional Instagram account to publish event posts.</p>
            </div>

            {instagramLoading ? (
              <p className="text-xs text-gray-400">Checking Instagram connection...</p>
            ) : instagramAccount ? (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Instagram</p>
                  <p className="text-xs text-gray-500">@{instagramAccount.username}</p>
                  <p className="text-[11px] text-green-600 mt-1">✓ Connected</p>
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
                      <p className="text-[10px] text-amber-600 font-medium">
                        ⚠ Dev mode only — paste your Instagram access token below.
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
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Submission History</h3>

            {loading ? (
              <div className="py-12 text-center text-xs text-gray-400">Loading submission history...</div>
            ) : requests.length === 0 ? (
              <div className="py-16 text-center text-xs text-gray-400 border border-dashed border-gray-150 rounded-2xl p-6">
                <span className="text-3xl">📝</span>
                <h4 className="font-bold text-gray-900 mt-3">No event requests yet</h4>
                <p className="mt-1">You haven't submitted any event requests. Create your first draft today!</p>
                <button
                  onClick={() => navigate("/events/create")}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow hover:bg-blue-700 transition cursor-pointer"
                >
                  Create Event Request
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-50">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-3 text-left font-bold text-gray-500">Event Title</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-500">Category</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-500">Submitted Date</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-500">Status</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r) => (
                      <tr key={r._id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-semibold text-gray-900 truncate max-w-[180px]">{r.title}</td>
                        <td className="px-4 py-3 text-gray-500">{r.category}</td>
                        <td className="px-4 py-3 text-gray-400">{new Date(r.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-semibold whitespace-nowrap ${STATUS_BADGE[r.status] || "bg-gray-50 text-gray-500 border-gray-100"}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate(`/events/${r._id}`)}
                              className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                            >
                              View
                            </button>
                            {r.status === "Pending Approval" && (
                              <>
                                <span className="text-gray-200">|</span>
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
