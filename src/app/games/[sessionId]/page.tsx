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

interface PlayerScore {
  username: string;
  score: number;
}

interface ScoreResponse {
  sessionid: number;
  players: PlayerScore[];
}

function reverseStack(card: Card): Card {
  if (!card.under_table_card) {
    return card;
  }

  const newRoot = reverseStack(card.under_table_card);

  card.under_table_card.under_table_card = card;

  card.under_table_card = undefined;
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Simple function to show toast
  const showToast = (message: string) => {
    setToastMessage(message);
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleSomeAction = async (toast: string) => {
    try {
      console.log(toast);
      showToast(toast);
    } catch (error) {
      console.log(error);
      showToast(toast);
    }
  };
  const [players, setPlayers] = useState<PlayerTable[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [handCards, setHandCards] = useState<any[]>([]);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [round, setRound] = useState<number>(1);
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [scores, setScores] = useState<ScoreResponse | null>(null);
  const [placeDisabled, setPlaceDisabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  console.log(scores, loading, error);
  const [showGameEndDialog, setShowGameEndDialog] = useState(false);
  const [gameEndResults, setGameEndResults] = useState<any>(null);
  console.log(gameEndResults);
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

  const fetchScores = async () => {
    try {
      const res = await axiosInstance.get(`/api/scores/${sessionId}`);
      console.log("scores", res.data);
      setScores(res.data);
    } catch (error) {
      console.error("Error fetching scores:", error);
    }
  };

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
      // process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001"
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
          fetchScores();
          console.log(countdown);
          setCountdown(session.remaining_time);
          setRound(session.round_number);
          // Game is running, so display game UI.
          setIsGameStarted(true);
        } else if (session.status === "pending") {
          console.log("yes-pending");
          setIsGameStarted(false);
        }
      } else {
        if (session.status === "pending") {
          console.log("no-pending");
          joinSession();
        } else {
          setShowGameEndDialog(true);
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
        fetchScores();
        handleSomeAction("Game has started");
        setCountdown(data.move_duration);
      }
    );

    socket.on(
      "round_started",
      (data: { session_id: string; move_duration: number }) => {
        fetchPlayerCards();
        fetchTableCards();
        fetchScores();
        setPlaceDisabled(false);
        handleSomeAction("New round has started!");
        setRound((prev) => prev + 1);
        setCountdown(data.move_duration);
      }
    );

    socket.on("move_timeout", (data) => {
      console.log("Move timeout event received:", data);
      fetchPlayerCards();
      fetchTableCards();
      setPlaceDisabled(false);
      handleSomeAction("New turn has started!");
      setCountdown(data.move_duration);
    });

    socket.on("score_round", (data: { session_id: string; results: any }) => {
      fetchScores();
      console.log("Round scores:", data.results);
    });

    socket.on("game_end", (data: { results: any }) => {
      fetchPlayerCards();
      fetchTableCards();
      fetchScores();

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
              <h2 className="text-lg py-8 px-16 rounded text-gray-300 bg-[#1b1b1b]">
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
      <main className="h-screen w-full px-16 relative">
        {toastMessage && (
          <div className="absolute bottom-14 right-4 z-50 transition-all ease-in-out duration-300 opacity-100 animate-slide-down">
            <p className="bg-primary px-4 py-2 rounded shadow-lg text-lg font-light italic ">
              {toastMessage}
            </p>
          </div>
        )}

        <div className="absolute bottom-4 left-4">
          <ul className="space-y-2 border border-gray-600 bg-background rounded-lg">
            {scores?.players.map((player, index) => (
              <li key={index} className="flex justify-between p-3 gap-1  ">
                <span>{index + 1}.</span>
                <span className="font-semibold">{player.username}: </span>
                <span className="font-bold text-primary">
                  {player.score} pts
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="absolute bottom-4 right-4">
          <div className="w-full">
            <h2 className="text-2xl font-semibold mb-2 w-full">
              Round: {round}
            </h2>
          </div>
        </div>
        <div className="w-full">
          <div className="flex justify-between my-4">
            <button className="">Back to games</button>
            <div>
              <h3 className="text-3xl mb-4">Time Left: {countdown} seconds</h3>
            </div>
            <button className="text-red-400">
              <button>Leave session</button>
            </button>
          </div>
          <h3 className="text-xl font-semibold mb-2 w-full text-center">
            All players table cards
          </h3>
          <div className="flex flex-col w-full mt-4">
            <div className="flex">
              <div className="flex flex-wrap gap-6 justify-center items-center w-full">
                {players.map((player) => (
                  <div
                    key={player.player_id}
                    className="bg-gradient-to-r from-[#441e1d] to-background p-4 rounded-lg shadow-lg min-w-[400px] w-fit"
                  >
                    <h2 className="text-xl font-semibold text-center mb-3">
                      {player.username}
                    </h2>
                    <div className="flex gap-4 justify-start items-start relative  h-[200px]">
                      {player.cards.length > 0 ? (
                        player.cards.map((cardStack) => {
                          // Flatten and reverse each card chain
                          const reversedChain = flattenCardChain(cardStack);
                          return (
                            <div
                              key={cardStack.tablecard_id}
                              className="flex flex-col relative"
                            >
                              {reversedChain.map((card, index) => (
                                <CardDisplay
                                  key={card.tablecard_id}
                                  card={card}
                                  index={index}
                                />
                              ))}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-gray-300 text-center w-full">
                          Table is empty.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center flex-col w-full items-center mt-8">
              <h3 className="text-xl font-semibold mb-2">Your Hand</h3>
              <ul className="flex space-x-1">
                {handCards.map((card) => {
                  // Build the image file name. For Maki Roll cards, include the score.
                  const imageName =
                    card.card_type === "Maki Roll"
                      ? `${card.card_type} ${card.points}` // e.g., "Maki Roll 1"
                      : card.card_type; // e.g., "Tempura", "Sashimi", etc.

                  return (
                    <li
                      key={card.playercard_sessioncardid}
                      className={`border-2 rounded-lg cursor-pointer transition duration-150 ease-in-out ${
                        selectedCard === card.playercard_sessioncardid
                          ? "border-primary bg-primary scale-125 " // when selected
                          : "border-white bg-white" // when not selected (change to your preferred color)
                      }`}
                      onClick={() =>
                        handleCardSelect(card.playercard_sessioncardid)
                      }
                    >
                      <img
                        src={`/cards/${imageName}.webp`}
                        alt={card.card_type}
                        style={{ height: "120px", width: "80px" }}
                        className="rounded-lg"
                      />
                    </li>
                  );
                })}
              </ul>
              <button
                className="mt-6 bg-primary hover:bg-primaryHover text-white px-6 py-3 rounded disabled:bg-gray-700 px-8"
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
                <pre className="bg-[#1b1b1b] p-4 rounded overflow-auto mt-4">
                  <ul className="space-y-2  rounded-lg">
                    {scores?.players.map((player, index) => (
                      <li
                        key={index}
                        className="flex justify-start p-3 gap-1  items-center"
                      >
                        <span>{index + 1}.</span>
                        <span className="">{player.username}: </span>
                        <span className="font-bold text-primary text-xl">
                          {player.score} pts
                        </span>
                      </li>
                    ))}
                  </ul>
                </pre>
              </div>
              <button
                onClick={handleGameEndDialogClose}
                className="w-full bg-primary hover:bg-primaryHover text-white font-bold py-2 px-4 rounded"
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

const flattenCardChain = (card: Card): Card[] => {
  const chain: Card[] = [];
  let currentCard: Card | null = card;
  while (currentCard) {
    chain.push(currentCard);
    currentCard = currentCard.under_table_card || null;
  }
  return chain.reverse();
};

const CardDisplay = ({ card, index }: { card: Card; index: number }) => {
  const imageName =
    card.card_type === "Maki Roll"
      ? `${card.card_type} ${card.points}`
      : card.card_type;

  // The card's vertical position is incremented slightly based on its index.
  const offsetY = -index * 70; // Adjust this value to control how much space there is between cards

  return (
    <div
      className="relative card bg-white p-px border rounded-lg shadow w-[60px]"
      style={{ top: `${offsetY}px`, zIndex: index }}
    >
      <img
        src={`/cards/${imageName}.webp`}
        alt={card.card_type}
        className="relative left-0 w-[60px] h-[90px] z-10 rounded-md border border-gray-600 rounded-lg"
      />
    </div>
  );
};
