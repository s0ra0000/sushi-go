// src/components/GameBoard.tsx
import React from "react";
import PlayerArea from "./PlayerArea";

interface Player {
  id: string;
  name: string;
}

interface GameBoardProps {
  players: Player[];
}

const GameBoard: React.FC<GameBoardProps> = ({ players }) => {
  return (
    <div className="flex flex-col items-center p-10 bg-green-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Sushi Go! Game Board</h1>
      <div className="flex space-x-10">
        {players.map((player) => (
          <PlayerArea key={player.id} playerName={player.name} />
        ))}
      </div>
    </div>
  );
};

export default GameBoard;
