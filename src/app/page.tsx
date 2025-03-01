"use client";
import { useEffect, useState } from "react";
import io from "socket.io-client";

const API_BASE_URL = "localhost:3001"; // Your AWS EC2 IP

const socket = io(API_BASE_URL); // Connect WebSocket to backend

export default function Home() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    socket.on("reply", (data) => {
      setMessage(data);
    });

    return () => {
      socket.off("reply");
    };
  }, []);

  const sendMessage = () => {
    socket.emit("message", "Hello from frontend!");
  };

  return (
    <div>
      <h1>WebSocket with Next.js + Express</h1>
      <button onClick={sendMessage}>Send Message</button>
      <p>Reply: {message}</p>
    </div>
  );
}
