"use client";

import { useState, useEffect, FormEvent } from "react";
import axiosInstance from "../../utils/axiosInstance";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import io from "socket.io-client";

interface Session {
  session_id: number;
  session_name: string;
  current_player_count: number;
  max_player_count: number;
}

export default function Games() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [sessionName, setSessionName] = useState<string>("");
  const [moveDuration, setMoveDuration] = useState<number>(30);
  const [maxPlayers, setMaxPlayers] = useState<number>(4);

  const router = useRouter();
  const token = Cookies.get("token");

  // Fetch sessions from backend.
  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const { data } = await axiosInstance.get("/api/sessions");
      if (data.success) {
        setSessions(data.sessions);
      } else {
        setError(data.result_message);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Error fetching sessions");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Socket.IO: listen for session list changes.
  useEffect(() => {
    const socket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "https://api.sushi.psyche.mn"
    );
    socket.emit("session_list", {});
    socket.on("sessions_changed", (data) => {
      console.log("Received sessions_changed event:", data);
      fetchSessions();
    });
    return () => {
      socket.disconnect();
    };
  }, [token]);

  // Close dropdown if click is outside.

  // Create new session and auto-join it.
  const handleCreateSession = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const createRes = await axiosInstance.post("/api/sessions", {
        token,
        sessionName,
        moveDuration,
        playerCount: maxPlayers,
      });
      if (!createRes.data.success) {
        alert(createRes.data.result_message);
        return;
      }
      const newSessionId = createRes.data.session_id;
      router.push(`/games/${newSessionId}`);
    } catch (err: any) {
      alert(err.response?.data?.error || "Error creating session");
    }
  };

  // Join an existing session.
  const handleJoinSession = async (sessionId: number) => {
    try {
      router.push(`/games/${sessionId}`);
    } catch (err: any) {
      alert(err.response?.data?.error || "Error joining session");
    }
  };

  return (
    <main className="flex-grow overflow-auto p-4 flex items-center justify-center w-full flex-col">
      <h1 className="mt-8 text-[32px] w-[600px] text-center bg-background py-8 rounded-t-lg">
        Game sessions
      </h1>
      <section
        className="flex-grow w-[600px] bg-background overflow-auto py-4 px-8 rounded-t 
          [&::-webkit-scrollbar]:w-2
          [&::-webkit-scrollbar-track]:rounded-full
          [&::-webkit-scrollbar-track]:bg-gray-100
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-gray-300
          dark:[&::-webkit-scrollbar-track]:bg-neutral-700
          dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500"
      >
        <div>
          {error && <p className="text-red-500">{error}</p>}
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-10 bg-gray-700 rounded animate-pulse" />
              <div className="h-10 bg-gray-700 rounded animate-pulse" />
              <div className="h-10 bg-gray-700 rounded animate-pulse" />
            </div>
          ) : sessions.length > 0 ? (
            <ul className="space-y-3">
              {sessions.map((session) => (
                <li
                  key={session.session_id}
                  className="border border-gray-700 flex justify-between items-center p-4 rounded-lg hover:bg-[#1b1b1b]"
                >
                  <div>
                    <p className="font-semibold text-lg">
                      {session.session_name}
                    </p>
                    <p className="font-light text-sm">
                      Players: {session.current_player_count} /{" "}
                      {session.max_player_count}
                    </p>
                  </div>
                  <div>
                    <button
                      className="bg-primary px-4 py-1 rounded"
                      onClick={() => handleJoinSession(session.session_id)}
                    >
                      Join
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No sessions available.</p>
          )}
        </div>
      </section>
      <div className="w-[600px] bg-background px-6 rounded-b-lg">
        <button
          onClick={() => setShowModal(true)}
          className="w-full my-8 bg-primary hover:bg-primaryHover hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create session
        </button>
      </div>
      {/* Create Session Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-20">
          <div className="bg-background border border-gray-700 text-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4">Create New Session</h2>
            <form onSubmit={handleCreateSession}>
              <div className="mb-4">
                <label className="block mb-1">Session Name</label>
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="w-full border p-2 rounded text-white bg-[#1b1b1b] border-gray-700"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1">Move Duration (sec)</label>
                <input
                  type="number"
                  value={moveDuration}
                  onChange={(e) => setMoveDuration(parseInt(e.target.value))}
                  className="w-full border p-2 rounded text-white bg-[#1b1b1b] border-gray-700"
                  min={1}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1">Number of players</label>
                <input
                  type="number"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                  className="w-full border p-2 rounded text-white bg-[#1b1b1b] border-gray-700"
                  min={2}
                  required
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded w-1/2 bg-[#1b1b1b]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white w-1/2 px-4 py-2 rounded"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
