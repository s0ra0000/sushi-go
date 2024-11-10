"use client";
import { useRouter } from "next/navigation";
import GameBoard from "@/components/GameBoard";

const players = [
  { id: "1", name: "Player 1" },
  { id: "2", name: "Player 2" },
  // Add more players as needed
];

export default function GameSessionPage({
  params,
}: {
  params: {
    sessionId: string;
  };
}) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 p-10">
      <h1 className="text-3xl font-bold mb-8">Session: {params.sessionId}</h1>
      <GameBoard players={players} />
    </div>
  );
}
