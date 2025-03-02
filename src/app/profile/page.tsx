"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosInstance";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Types for user, session, and scores.
interface User {
  user_id: number;
  username: string;
}

interface Session {
  sessionid: number;
  sessionname: string;
  moveduration: number;
  max_player_count: number;
  status: string;
  sessiondate: string;
}

interface UserSessionsResponse {
  success: boolean;
  message: string;
  user_id: number;
  sessions: Session[];
}

interface UserResponse {
  success: boolean;
  message: string;
  user: User;
}

interface PlayerScore {
  username: string;
  score: number;
}

interface PlayerScoresResponse {
  success: boolean;
  result_message: string;
  players: PlayerScore[];
}

export default function ProfilePage() {
  const router = useRouter();
  const token = Cookies.get("token") || "";
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  console.log(error);
  // For modal dialog (score results)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    null
  );
  console.log(selectedSessionId);
  const [playerScore, setPlayerScore] = useState<PlayerScore[] | null>(null);

  // Fetch current user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axiosInstance.get<UserResponse>("/api/user");
        if (res.data.success) {
          setUser(res.data.user);
        } else {
          setError(res.data.message);
        }
      } catch (err) {
        console.log(err);
        setError("Error fetching user data");
      }
    };
    fetchUser();
  }, [token]);

  // Fetch sessions that the user joined
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await axiosInstance.get<UserSessionsResponse>(
          "/api/user-sessions"
        );
        if (res.data.success) {
          setSessions(res.data.sessions);
        } else {
          setError(res.data.message);
        }
      } catch (err) {
        console.log(err);
        setError("Error fetching sessions");
      } finally {
        setLoadingSessions(false);
      }
    };
    fetchSessions();
  }, [token]);

  // Navigate to game page
  const handleGoToGame = (sessionId: number) => {
    router.push(`/games/${sessionId}`);
  };

  // Open modal and fetch player scores for a given session
  const handleSeeResults = async (sessionId: number) => {
    setSelectedSessionId(sessionId);
    setIsModalOpen(true);
    try {
      const res = await axiosInstance.get<PlayerScoresResponse>(
        `/api/scores/${sessionId}`
      );
      console.log(res.data);
      if (res.data) {
        setPlayerScore(res.data.players);
      } else {
        setPlayerScore(null);
      }
    } catch (err) {
      console.log(err);
      setError("Error fetching player scores");
    }
  };

  return (
    <div className="min-h-screen  text-gray-100 p-8">
      <div className="">
        <Link href={"/games"}>
          <button className="text-blue-200">{`<- `}Back to games</button>
        </Link>
      </div>
      <div className="max-w-4xl mx-auto mt-4">
        {/* User Welcome */}
        {user ? (
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Welcome, {user.username}!</h1>
          </div>
        ) : (
          <p>Loading user data...</p>
        )}
        <div className="bg-background rounded-lg p-8">
          {/* Sessions Table */}
          <h2 className="text-2xl font-semibold mb-4">Your Sessions</h2>
          {loadingSessions ? (
            <p>Loading sessions...</p>
          ) : sessions.length > 0 ? (
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left">Session Name</th>
                  <th className="px-4 py-2 text-left">Move Duration</th>
                  <th className="px-4 py-2 text-left">Max Players</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session, index) => (
                  <tr key={index} className="border-b">
                    <td className="px-4 py-2">{session.sessionname}</td>
                    <td className="px-4 py-2">{session.moveduration}</td>
                    <td className="px-4 py-2">{session.max_player_count}</td>
                    <td className="px-4 py-2 capitalize">
                      <StatusBadge status={session.status} />
                    </td>
                    <td className="px-4 py-2">
                      {session.status === "pending" ||
                      session.status === "ongoing" ? (
                        <button
                          onClick={() => handleGoToGame(session.sessionid)}
                          className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded"
                        >
                          Go to Game
                        </button>
                      ) : session.status === "ended" ? (
                        <button
                          onClick={() => handleSeeResults(session.sessionid)}
                          className="bg-primary hover:bg-primaryHover text-white px-4 py-2 rounded"
                        >
                          See Results
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>You have not joined any sessions.</p>
          )}
        </div>
      </div>
      {/* Modal for displaying session scores */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-background text-white p-6 rounded-md w-80">
            <h3 className="text-xl font-semibold mb-4">Game Results</h3>
            {playerScore && playerScore.length > 0 ? (
              <div>
                {playerScore.map((player, index) => (
                  <div className="mb-2">
                    <span>{index + 1}.</span>
                    <span key={player.username} className="mb-4 mx-2">
                      <strong>{player.username}:</strong>
                    </span>
                    <span className="text-primary font-bold text-xl">
                      {player.score}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No score data available.</p>
            )}

            <button
              onClick={() => {
                setIsModalOpen(false);
                setPlayerScore(null);
              }}
              className="mt-4 bg-primary hover:bg-primaryHover text-white px-4 py-2 rounded w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-500 text-yellow-900";
      case "ongoing":
        return "bg-blue-500 text-blue-900";
      case "ended":
        return "bg-red-500 text-red-900";
      default:
        return "bg-gray-500 text-gray-900";
    }
  };

  return (
    <span
      className={`px-3 py-1 text-sm font-semibold rounded-md ${getStatusColor(
        status
      )}`}
    >
      {status}
    </span>
  );
};
