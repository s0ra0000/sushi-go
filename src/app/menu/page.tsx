// src/app/menu/page.js
import Link from "next/link";

export default function MenuPage() {
  const sessions = [
    { id: "session1", name: "Game Session 1" },
    { id: "session2", name: "Game Session 2" },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center p-10 bg-gray-100">
      <h1 className="text-3xl font-bold mb-8">Sushi Go! - Menu</h1>
      <button className="mb-6 bg-blue-500 text-white p-2 rounded">
        Create New Session
      </button>
      <div className="w-full max-w-md">
        <ul className="space-y-4">
          {sessions.map((session) => (
            <li key={session.id} className="p-4 bg-white rounded shadow">
              <Link href={`/game/${session.id}`}>
                <p className="text-blue-500 font-semibold">{session.name}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
