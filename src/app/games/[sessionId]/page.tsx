"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import io from "socket.io-client";
import Cookies from "js-cookie";
import axiosInstance from "../../../utils/axiosInstance";
import Link from "next/link";

interface SessionData {
  session_id: number;
  session_name: string;
  move_duration: number;
  round_number: number;
  session_date: string;
  current_player_count: number;
  max_player_count: number;
  status: string;
  scheduled_time: string;
  remaining_time: string;
}

interface Card {
  tablecard_id: number;
  sessioncard_id: number;
  card_id: number;
  card_type: string;
  card_description: string;
  points: number;
  under_table_card?: Card | null;
}

interface PlayerTable {
  player_id: number;
  username: string;
  cards: Card[];
}

interface TableCardsResponse {
  success: boolean;
  result_message: string;
  players: PlayerTable[];
}

interface Player {
  player_id: number;
  username: string;
}

interface GameState {
  players: Player[];
  countdown: number;
}

function reverseStack(card: Card): Card {
  // If this card has no child, it's already the bottom—just return it.
  if (!card.under_table_card) {
    return card;
  }

  // Recurse to find the bottommost card (newRoot).
  const newRoot = reverseStack(card.under_table_card);

  // The child's under_table_card now points back up to the current card,
  // effectively reversing the link.
  card.under_table_card.under_table_card = card;

  // Remove the old forward link to avoid cycles.
  card.under_table_card = undefined;

  // Return the bottommost card, which is now the root of the reversed chain.
  return newRoot;
}

let socket: ReturnType<typeof io>;

export default function GamePage({
  params: { sessionId },
}: {
  params: { sessionId: string };
}) {
  const token = Cookies.get("token") || "";
  const router = useRouter();

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    countdown: 0,
  });
  const [players, setPlayers] = useState<PlayerTable[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [handCards, setHandCards] = useState<any[]>([]);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [round, setRound] = useState<number>(1);
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [scores, setScores] = useState<any>(null);
  const [placeDisabled, setPlaceDisabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  console.log(scores, loading, error);
  const [showGameEndDialog, setShowGameEndDialog] = useState(false);
  const [gameEndResults, setGameEndResults] = useState<any>(null);

  const checkPlayerBelongs = async () => {
    try {
      const response = await axiosInstance.post("/api/is-player-belongs", {
        sessionId,
      });
      console.log(response);
      return response.data;
    } catch (err) {
      console.error("Error checking if player belongs to session:", err);
      return { success: false };
    }
  };

  // Fetch session details.
  const fetchSessionData = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/api/sessions/${sessionId}`);
      const data = res.data;
      if (data.success) {
        setSessionData(data.session);
        console.log(data.session);
        if (data.session.status === "ongoing") {
          setIsGameStarted(true);
        }
        console.log(data);
        return data;
      } else {
        console.error("Error fetching session:", data.result_message);
      }
    } catch (error) {
      console.error("Error fetching session data:", error);
    }
  }, [sessionId]);

  // Fetch player's hand cards.
  const fetchPlayerCards = async () => {
    try {
      const res = await axiosInstance.post("/api/get-player-cards", {
        token,
        sessionId,
      });
      const data = res.data;
      if (data.success) {
        // Reverse each card's chain so the bottommost card becomes the root
        const reversedCards = data.cards.map((c: Card) => reverseStack(c));
        setHandCards(reversedCards);
      }
    } catch (error) {
      console.error("Error fetching player cards:", error);
    }
  };

  // Fetch table cards.
  const fetchTableCards = async () => {
    try {
      const response = await axiosInstance.post<TableCardsResponse>(
        "/api/get-table-cards",
        { token, sessionId }
      );
      if (response.data.success) {
        console.log(response.data.players);
        setPlayers(response.data.players);
      } else {
        setError(response.data.result_message);
      }
    } catch (err: any) {
      console.log(err);
      setError("Failed to fetch table cards.");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveSession = async () => {
    try {
      const res = await axiosInstance.post("/api/leave-session", {
        sessionId,
      });
      console.log(res);
      const data = res.data;
      if (data.success) {
        router.push("/games");
      }
    } catch (error) {
      console.error("Error fetching table cards:", error);
    }
  };

  // Fetch scores.
  // const fetchScores = async () => {
  //   try {
  //     const res = await axiosInstance.post("/api/score-round", { sessionId });
  //     const data = res.data;
  //     setScores(data);
  //   } catch (error) {
  //     console.error("Error fetching scores:", error);
  //   }
  // };

  const joinSession = async () => {
    try {
      await axiosInstance.post("/api/join-session", {
        sessionId,
        token,
      });
    } catch (error) {
      console.error("Error fetching scores:", error);
    }
  };

  // Socket connection and event listeners.
  useEffect(() => {
    socket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "https://api.sushi.psyche.mn"
    );

    // Join the session room.
    socket.emit("joinSessionRoom", { sessionId, token });
    const initSession = async () => {
      const data = await fetchSessionData();
      if (!data) return;

      // Check if player belongs.
      const playerCheck = await checkPlayerBelongs();
      // console.log(playerCheck.belong);
      const session = data.session;
      if (playerCheck) {
        // User belongs to this session.
        console.log("shalda", session.status);
        if (session.status === "ended") {
          // If the session has ended, show the game end dialog.
          // setGameEndResults(/* you might want to pass session results if available */);
          console.log("yes-ended");
          setShowGameEndDialog(true);
        } else if (session.status === "ongoing") {
          console.log("yes-ongoing");
          fetchPlayerCards();
          fetchTableCards();
          // if (session?.scheduled_time) {
          //   const scheduledTime = new Date(session.scheduled_time).getTime();
          //   const currentTime = Date.now();
          //   const countdown = Math.max(
          //     0,
          //     Math.floor((scheduledTime - currentTime) / 1000)
          //   );
          //   console.log("Countdown (s):", session.remaining_time);
          // }

          // const countdown = Math.max(
          //   0,
          //   (new Date(session.scheduled_time).getTime() - Date.now()) / 1000
          // );
          console.log(countdown);
          setCountdown(session.remaining_time);
          setRound(session.round_number);
          // Game is running, so display game UI.
          setIsGameStarted(true);
        } else if (session.status === "pending") {
          console.log("yes-pending");

          // Still waiting to start, so show the wait room.
          setIsGameStarted(false);
        }
      } else {
        // User does not belong to the session.
        if (session.status === "pending") {
          console.log("no-pending");

          // If session is still pending, allow them to join.
          joinSession();
        } else {
          // For any other status, indicate that this is not their session.
          setShowGameEndDialog(true); // This flag can trigger an error message with an exit button.
          console.log("fuck you self");
        }
      }
    };

    initSession();

    // Listen for events.
    socket.on("updatePlayers", (data: { players: Player[] }) => {
      console.log("Received updatePlayers event:", data);
      setGameState((prev) => ({ ...prev, players: data.players }));
    });

    socket.on(
      "game_started",
      (data: { session_id: string; move_duration: number }) => {
        setIsGameStarted(true);
        fetchPlayerCards();
        fetchTableCards();
        setCountdown(data.move_duration);
      }
    );

    socket.on(
      "round_started",
      (data: { session_id: string; move_duration: number }) => {
        fetchPlayerCards();
        fetchTableCards();
        setRound((prev) => prev + 1);
        setCountdown(data.move_duration);
      }
    );

    socket.on("move_timeout", (data) => {
      console.log("Move timeout event received:", data);
      fetchPlayerCards();
      fetchTableCards();
      setPlaceDisabled(false);
      setCountdown(data.move_duration);
    });

    socket.on("score_round", (data: { session_id: string; results: any }) => {
      setScores(data.results);
      console.log("Round scores:", data.results);
    });

    socket.on("game_end", (data: { results: any }) => {
      fetchPlayerCards();
      fetchTableCards();
      setScores(data.results);
      setGameEndResults(data.results);
      setShowGameEndDialog(true);
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId, token, fetchSessionData]);

  // Countdown effect.
  useEffect(() => {
    if (countdown === 0) return;
    const interval = setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown > 0) {
          return prevCountdown - 1;
        } else {
          clearInterval(interval);
          return 0;
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const handleCardSelect = (sessioncardid: number) => {
    setSelectedCard(sessioncardid);
  };

  // Function to handle dialog close
  const handleGameEndDialogClose = () => {
    localStorage.removeItem("session_id");
    router.push("/games");
  };

  const submitCard = async () => {
    if (selectedCard === null) return;
    try {
      setPlaceDisabled(true);
      const res = await axiosInstance.post("/api/place-card", {
        token,
        sessionId,
        sessionCardId: selectedCard,
      });
      const data = res.data;
      if (data.success) {
        socket.emit("cardSelected", {
          token,
          sessionId,
          sessionCardId: selectedCard,
        });
      }
    } catch (error) {
      console.error("Error placing card:", error);
    }
  };

  if (!isGameStarted && !showGameEndDialog) {
    return (
      <main className="h-screen flex justify-center items-center w-full">
        {sessionData && (
          <div className="my-8 bg-background rounded-lg py-8 px-16 flex flex-col gap-6">
            <Link href={"/games"}>
              <button>Back</button>
            </Link>
            <h1 className="text-3xl">{sessionData.session_name}</h1>
            <div className="mb-4">
              <h2 className="text-2xl py-8 px-4 rounded text-gray-300 bg-[#1b1b1b]">
                Waiting for players...
              </h2>
              <p className="mt-4">Joined players:</p>
              <ul className="list-disc pl-5 mt-2">
                {gameState.players.map((player) => (
                  <li key={player.player_id} className="text-gray-300">
                    {player.username}
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-4S">
              <span className="">Move Duration:</span>{" "}
              {sessionData.move_duration} seconds
            </p>
            <p className="">
              <span className="">Players:</span>{" "}
              {sessionData.current_player_count}/{sessionData.max_player_count}
            </p>
            <button
              className="mt-8 bg-[#1b1b1b] py-2 rounded hover:text-red-300"
              onClick={handleLeaveSession}
            >
              Leave session
            </button>
          </div>
        )}
      </main>
    );
  } else {
    return (
      <main className="h-screen ">
        <div className="">
          <div className="w-full">
            <h2 className="text-2xl font-semibold mb-2 w-full">
              Round: {round}
            </h2>
            <h3 className="text-xl mb-4">Time Left: {countdown} seconds</h3>
          </div>
          <h3 className="text-xl font-semibold mb-2 w-full">
            Table Cards (All Players)
          </h3>
          <div className="flex flex-col w-full">
            <div className="flex">
              <div className="flex flex-wrap gap-6 justify-center">
                {players.map((player) => (
                  <div
                    key={player.player_id}
                    className="bg-gray-800 p-4 rounded-lg shadow-lg w-fit"
                  >
                    <h2 className="text-xl font-semibold text-center mb-3">
                      {player.username}
                    </h2>
                    <div className="flex gap-4 justify-start items-start relative">
                      {player.cards.length > 0 ? (
                        player.cards.map((card) => (
                          <CardDisplay key={card.tablecard_id} card={card} />
                        ))
                      ) : (
                        <p className="text-gray-400 text-center">
                          No cards played yet.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="">
              <h3 className="text-xl font-semibold mb-2">Your Hand</h3>
              <ul className="flex space-y-2">
                {handCards.map((card) => {
                  // Build the image file name. For Maki Roll cards, include the score.
                  const imageName =
                    card.card_type === "Maki Roll"
                      ? `${card.card_type} ${card.points}` // e.g., "Maki Roll 1"
                      : card.card_type; // e.g., "Tempura", "Sashimi", etc.

                  return (
                    <li
                      key={card.playercard_sessioncardid}
                      className="p-3 rounded"
                    >
                      <img
                        src={`/cards/${imageName}.webp`}
                        alt={card.card_type}
                        style={{ height: "180px", width: "120px" }}
                        onClick={() =>
                          handleCardSelect(card.playercard_sessioncardid)
                        }
                        className={`border border-white rounded ${
                          selectedCard === card.playercard_sessioncardid
                            ? "border-primary border-2 scale-2"
                            : "border-white border"
                        }`}
                      />
                    </li>
                  );
                })}
              </ul>
              <button
                className="mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded w-full disabled:bg-gray-700"
                onClick={submitCard}
                disabled={placeDisabled}
              >
                {placeDisabled ? "Card placed" : "Place Card"}
              </button>
            </div>
          </div>
        </div>
        {showGameEndDialog && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-background p-6 rounded shadow-md max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Game Ended!</h2>
              <div className="mb-4">
                <p className="font-semibold">Final Scores:</p>
                <pre className="bg-[#1b1b1b] p-4 rounded overflow-auto">
                  {JSON.stringify(gameEndResults, null, 2)}
                </pre>
              </div>
              <button
                onClick={handleGameEndDialogClose}
                className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Exit Game
              </button>
            </div>
          </div>
        )}
      </main>
    );
  }
}
// interface CardDisplayProps {
//   card: Card;
//   /** Used internally to calculate how far down each subsequent card should appear. */
//   depth?: number;
// }

const CardDisplay = ({ card }: { card: Card }) => {
  // Build the image name. For Maki Roll, include its points.
  const imageName =
    card.card_type === "Maki Roll"
      ? `${card.card_type} ${card.points}`
      : card.card_type;

  // If there's an under_table_card, offset the top card by a bit; otherwise, no offset.
  const topOffset = card.under_table_card ? "top-10" : "top-0";

  return (
    <div className="relative w-[120px] h-[240px]">
      {/* Render the under_table_card first (so it stays behind) */}
      {card.under_table_card && (
        <div className="absolute top-0 left-0 z-0">
          <CardDisplay card={card.under_table_card} />
        </div>
      )}

      {/* Render the current (top) card with an offset if under_table_card exists */}
      <img
        src={`/cards/${imageName}.webp`}
        alt={card.card_type}
        className={`absolute ${topOffset} left-0 w-[120px] h-[180px] z-10 rounded-md border border-gray-600`}
      />
    </div>
  );
};
