// src/components/Card.tsx
import React from "react";

interface CardProps {
  cardName: string;
}

const Card: React.FC<CardProps> = ({ cardName }) => {
  return (
    <div className="bg-blue-200 rounded-lg shadow p-4 text-center font-medium text-gray-700">
      <p>{cardName}</p>
    </div>
  );
};

export default Card;
