// src/components/Game.tsx
"use client";

import { useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";
import axiosInstance from "@/utils/axiosInstance";

let socket: Socket;

export default function Game() {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [playerId, setPlayerId] = useState<number | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  console.log(playerId);
  useEffect(() => {
    // Connect to the Socket.IO server (assumes it’s running on the same origin)
    socket = io();

    socket.on("connect", () => {
      console.log("Connected to Socket.IO server, id:", socket.id);
    });

    socket.on("gameUpdate", (data: any) => {
      console.log("Received game update:", data);
      setMessages((prev) => [...prev, JSON.stringify(data)]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinSession = async () => {
    try {
      const response = await axiosInstance.post("/api/v1/join-session", {
        session_id: sessionId,
      });
      console.log("Join session response:", response.data);
      if (response.data.success) {
        setPlayerId(response.data.player_id);
        // Join a room for the session so that you receive game updates.
        socket.emit("joinRoom", `session-${sessionId}`);
      }
    } catch (error) {
      console.error("Error joining session:", error);
    }
  };

  const startSession = async () => {
    try {
      const response = await axiosInstance.post("/api/v1/start-session", {
        session_id: sessionId,
      });
      console.log("Start session response:", response.data);
      socket.emit("gameUpdate", {
        message: "Game started",
        session_id: sessionId,
      });
    } catch (error) {
      console.error("Error starting session:", error);
    }
  };

  const placeCard = async (
    sessioncardId: number,
    underTableCardId?: number
  ) => {
    try {
      const response = await axiosInstance.post("/api/v1/place-card", {
        session_id: sessionId,
        sessioncard_id: sessioncardId,
        under_table_card_id: underTableCardId,
      });
      console.log("Place card response:", response.data);
      socket.emit("gameUpdate", {
        message: "Card placed",
        data: response.data,
        session_id: sessionId,
      });
    } catch (error) {
      console.error("Error placing card:", error);
    }
  };

  const passCards = async () => {
    try {
      const response = await axiosInstance.post("/api/v1/pass-cards", {
        session_id: sessionId,
      });
      console.log("Pass cards response:", response.data);
      socket.emit("gameUpdate", {
        message: "Cards passed",
        session_id: sessionId,
      });
    } catch (error) {
      console.error("Error passing cards:", error);
    }
  };

  const scoreRound = async () => {
    try {
      const response = await axiosInstance.post("/api/v1/score-round", {
        session_id: sessionId,
      });
      console.log("Score round response:", response.data);
      socket.emit("gameUpdate", {
        message: "Round scored",
        session_id: sessionId,
      });
    } catch (error) {
      console.error("Error scoring round:", error);
    }
  };

  const endGame = async () => {
    try {
      const response = await axiosInstance.post("/api/v1/end-game", {
        session_id: sessionId,
      });
      console.log("End game response:", response.data);
      socket.emit("gameUpdate", {
        message: "Game ended",
        session_id: sessionId,
      });
    } catch (error) {
      console.error("Error ending game:", error);
    }
  };

  return (
    <div>
      <h1>Sushi Go! Game</h1>
      <div>
        <label>Session ID: </label>
        <input
          type="number"
          value={sessionId ?? ""}
          onChange={(e) => setSessionId(Number(e.target.value))}
        />
        <button onClick={joinSession}>Join Session</button>
      </div>
      <div>
        <button onClick={startSession}>Start Game</button>
        <button onClick={() => placeCard(1)}>
          Place Card (Example Card ID 1)
        </button>
        <button onClick={passCards}>Pass Cards</button>
        <button onClick={scoreRound}>Score Round</button>
        <button onClick={endGame}>End Game</button>
      </div>
      <div>
        <h2>Game Updates:</h2>
        {messages.map((msg, idx) => (
          <div key={idx}>
            <pre>{msg}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}
