// src/components/PlayerArea.tsx
import React from "react";
import Card from "./Card";

interface PlayerAreaProps {
  playerName: string;
}

const PlayerArea: React.FC<PlayerAreaProps> = ({ playerName }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-5 w-72">
      <h2 className="text-xl font-semibold mb-4">{playerName}</h2>
      <div className="flex space-x-2">
        <Card cardName="Sushi Roll" />
        <Card cardName="Tempura" />
        {/* Add more cards as needed */}
      </div>
    </div>
  );
};

export default PlayerArea;
