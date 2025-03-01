"use client";

import { useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import axiosInstance from "@/utils/axiosInstance";
export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
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

    // Basic client-side validation
    if (!formData.username || !formData.password || !formData.confirmPassword) {
      setErrorMessage("Please fill out all fields.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      // Example endpoint: /api/sign-up
      const response = await axiosInstance.post("/api/register", {
        username: formData.username,
        password: formData.password,
      });

      const data = response.data;

      // If registration succeeded
      if (response.status === 200) {
        // Save token in cookies for 7 days
        if (data.token) {
          Cookies.set("token", data.token, { expires: 7 });
        }
        setSuccessMessage(data.message || "Successfully registered!");
        // Redirect to /menu after a short delay or immediately
        router.push("/menu");
      } else {
        setErrorMessage(data.error || "An error occurred. Please try again.");
      }
    } catch (error: any) {
      // If the server responded with an error status
      if (error.response) {
        setErrorMessage(error.response.data.error || "Server error occurred.");
      } else {
        // Network or other client-side error
        setErrorMessage("Failed to connect to the server. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen relative">
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
          <h1 className="text-2xl font-bold mb-4">Sign up</h1>
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

          {/* Confirm Password */}
          <input
            type={showPassword ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className="w-full mb-4 p-3 bg-gray-700 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
          />

          <button
            type="submit"
            className="w-full bg-primary text-white font-bold p-3 rounded hover:bg-primaryHover transition"
          >
            Register
          </button>
        </form>

        {/* Success or Error Messages */}
        {successMessage && (
          <p className="text-green-400 mt-4">{successMessage}</p>
        )}
        {errorMessage && <p className="text-red-400 mt-4">{errorMessage}</p>}
        <p className="mt-4">
          Already have an account?{" "}
          <Link href="/auth/login" className="underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
