"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
export default function GamesLayout({
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
    <div className="h-screen relative flex flex-col text-gray-100 justify-center items-center">
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
            <div className="absolute right-0 mt-2 bg-[#1b1b1b] border border-gray-700 rounded shadow-lg z-10">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  router.push("/profile");
                }}
                className="block w-full text-left px-4 py-2 text-white hover:bg-gray-600"
              >
                Profile
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
            className="bg-background border border-gray-700 text-white p-6 rounded shadow-lg max-w-md w-full relative"
          >
            <button
              onClick={() => setShowRules(false)}
              className="absolute top-2 right-2 text-white"
              aria-label="Close rules dialog"
            >
              X
            </button>
            <h2 className="text-xl font-bold mb-4">Game Rules</h2>
            <p>
              {/* Replace the text below with your actual game rules */}
              Here are the rules of the game: Lorem ipsum dolor sit amet,
              consectetur adipiscing elit.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
