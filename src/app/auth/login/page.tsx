"use client";

import { useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import axiosInstance from "@/utils/axiosInstance";
export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // Basic validation
    if (!formData.username || !formData.password) {
      setErrorMessage("Please fill out all fields.");
      return;
    }

    try {
      // Example endpoint: /api/login
      const response = await axiosInstance.post("/api/login", {
        username: formData.username,
        password: formData.password,
      });

      const data = response.data;

      // If login succeeded
      if (response.status === 200) {
        if (data.token) {
          // Save token in cookies for 7 days
          Cookies.set("token", data.token, { expires: 7 });
        }
        setSuccessMessage(data.message || "Login successful!");
        // Redirect to /menu
        router.push("/games");
      } else {
        setErrorMessage(data.error || "An error occurred. Please try again.");
      }
    } catch (error: any) {
      if (error.response) {
        setErrorMessage(error.response.data.error || "Server error occurred.");
      } else {
        // Network or other client-side error
        setErrorMessage("Failed to connect to the server. Please try again.");
      }
    }
  };

  return (
    <div className="h-screen relative">
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
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="-mt-[16px] mb-4">
          <Image
            src="/sushi-go-logo.webp"
            height={200}
            width={200}
            alt="logo"
          />
        </div>
        <form
          onSubmit={handleSubmit}
          className="w-80 bg-gray-800 p-6 rounded-lg shadow-lg text-center"
          style={{ backgroundColor: "#1e1e1e" }}
        >
          <h1 className="text-2xl font-bold mb-4">Login</h1>
          {/* Username */}
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleInputChange}
            className="w-full mb-4 p-3 bg-gray-700 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
          />

          {/* Password */}
          <div className="relative mb-4">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full p-3 bg-gray-700 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-3 text-sm text-gray-400"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white font-bold p-3 rounded hover:bg-primaryHover transition"
          >
            Login
          </button>
        </form>

        {/* Success or Error Messages */}
        {successMessage && (
          <p className="text-green-400 mt-4">{successMessage}</p>
        )}
        {errorMessage && <p className="text-red-400 mt-4">{errorMessage}</p>}
        <p className="mt-4">
          Dont have account?{" "}
          <Link href="/auth/sign-up" className="underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
