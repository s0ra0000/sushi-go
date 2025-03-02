"use client";
import localFont from "next/font/local";
import "./globals.css";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [showRules, setShowRules] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  const router = useRouter();
  // Refs for detecting outside clicks.
  const rulesDialogRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Close the rules dialog if click is outside.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        rulesDialogRef.current &&
        !rulesDialogRef.current.contains(event.target as Node)
      ) {
        setShowRules(false);
      }
    }
    if (showRules) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showRules]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen relative flex flex-col text-gray-100 justify-center items-center">
          <div className="absolute -z-10 inset-0 brightness-[30%]">
            <Image
              src="/sushi-go.png"
              layout="fill"
              objectFit="cover"
              quality={100}
              alt="bg"
              className="hue-rotate-[6.142rad]"
            />
          </div>
          {/* Header */}
          <header className="flex justify-between items-center p-4 px-16 bg-background w-full">
            {/* Left: Rules Button */}
            <button
              onClick={() => setShowRules(true)}
              className="text-2xl text-white"
              aria-label="Game rules"
            >
              ?
            </button>
            {/* Right: Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown((prev) => !prev)}
                className="text-2xl text-white"
                aria-label="Menu"
              >
                &#9776;
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 bg-[#1b1b1b] border border-gray-700 rounded shadow-lg z-10 ">
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      router.push("/profile");
                    }}
                    className="block w-full text-left px-4 mr-8 py-2 text-white hover:bg-gray-600"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      router.push("/profile/settings");
                    }}
                    className="block w-full text-left px-4 py-2 text-white hover:bg-gray-600"
                  >
                    Settings
                  </button>
                  <button
                    onClick={() => {
                      Cookies.remove("token");
                      setShowDropdown(false);
                      router.push("/auth/login");
                    }}
                    className="block w-full text-left px-4 py-2 text-white hover:bg-gray-600"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </header>

          {children}

          {/* Game Rules Dialog */}
          {showRules && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-20">
              <div
                ref={rulesDialogRef}
                className="bg-background border border-gray-700 text-white p-6 rounded shadow-lg max-w-xl w-full relative"
              >
                <button
                  onClick={() => setShowRules(false)}
                  className="absolute top-2 right-2 text-white"
                  aria-label="Close rules dialog"
                >
                  X
                </button>

                <h2 className="text-xl font-bold mb-4">Правила игры</h2>

                <div
                  className="max-h-[450px] min-w-[400px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2
          [&::-webkit-scrollbar-track]:rounded-full
          [&::-webkit-scrollbar-track]:bg-gray-100
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-gray-300
          dark:[&::-webkit-scrollbar-track]:bg-neutral-700
          dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500"
                >
                  <h3 className="text-lg font-semibold mt-2">Подготовка:</h3>
                  <ul className="list-disc list-inside">
                    <li>
                      Каждому игроку раздается стартовая рука с картами
                      (количество зависит от числа игроков).
                    </li>
                    <li>Игра длится 3 раунда.</li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-2">Ход:</h3>
                  <ul className="list-disc list-inside">
                    <li>
                      Все игроки одновременно выбирают по одной карте из руки и
                      кладут её на стол лицом вниз.
                    </li>
                    <li>
                      После выбора карты оставшиеся в руке карты передаются
                      следующему игроку по кругу.
                    </li>
                    <li>
                      Выбранные карты переворачиваются лицом вверх и остаются у
                      игрока на столе до конца раунда.
                    </li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-2">
                    Окончание раунда:
                  </h3>
                  <ul className="list-disc list-inside">
                    <li>
                      Когда у игроков заканчиваются карты, раунд завершается.
                    </li>
                    <li>
                      Подсчитываются очки за выложенные карты (каждая комбинация
                      даёт определённое количество очков).
                    </li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-2">Новый раунд:</h3>
                  <ul className="list-disc list-inside">
                    <li>
                      Все карты, кроме «Пудингов» (Pudding), убираются со стола.
                    </li>
                    <li>Раздаются новые карты, и процесс повторяется.</li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-2">
                    Завершение игры:
                  </h3>
                  <ul className="list-disc list-inside">
                    <li>
                      После третьего раунда игроки получают/теряют
                      дополнительные очки за «Пудинги».
                    </li>
                    <li>
                      Подсчитываются все очки, и побеждает игрок с наибольшим
                      результатом.
                    </li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-2">Подсчет очков:</h3>
                  <ul className="list-disc list-inside">
                    <li>Разные комбинации карт дают разные очки.</li>
                    <li>
                      <strong>Нигири:</strong> Яйцо (1 очко), Лосось (2 очка),
                      Кальмар (3 очка).
                    </li>
                    <li>
                      <strong>Васаби:</strong> Умножает очки от следующего
                      Нигири на 3.
                    </li>
                    <li>
                      <strong>Темпура:</strong> Пара карт даёт 5 очков.
                    </li>
                    <li>
                      <strong>Сашими:</strong> Тройка карт даёт 10 очков.
                    </li>
                    <li>
                      <strong>Пельмени:</strong> Чем больше, тем больше очков
                      (1:1, 2:3, 3:6, 4:10, 5+:15).
                    </li>
                    <li>
                      <strong>Маки-роллы:</strong> У кого больше всех - 6 очков,
                      второй - 3 очка.
                    </li>
                    <li>
                      <strong>Пудинг:</strong> В конце игры игрок с наибольшим
                      количеством получает +6 очков, с наименьшим - теряет 6.
                    </li>
                    <li>
                      <strong>Палочки:</strong> Позволяют взять 2 карты в
                      следующем ходе.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </body>
    </html>
  );
}
