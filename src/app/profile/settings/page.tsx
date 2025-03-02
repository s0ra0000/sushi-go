"use client";

import { useState } from "react";
import axiosInstance from "../../../utils/axiosInstance";
import Cookies from "js-cookie";
import Link from "next/link";

export default function SettingsPage() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset messages
    setErrorMessage(null);
    setSuccessMessage(null);

    // Basic validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      setErrorMessage("All fields are required.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirm password do not match.");
      return;
    }

    setLoading(true);

    try {
      const username = Cookies.get("username"); // Assuming username is stored in cookies
      const response = await axiosInstance.post("/api/reset-password", {
        username,
        oldPassword,
        newPassword,
      });

      if (response.data.success) {
        setSuccessMessage("Password changed successfully!");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setErrorMessage(
          response.data.result_message || "Failed to change password."
        );
      }
    } catch (error) {
      console.log(error);
      setErrorMessage("Error changing password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-100 flex-col">
      <div className="w-full ">
        <Link href={"/games"}>
          <button className="text-blue-200">{`<- `}Back to games</button>
        </Link>
      </div>
      <div className="bg-background p-6 rounded-lg shadow-md w-full max-w-md mt-8">
        <h2 className="text-2xl font-bold mb-4 text-center mx-8">
          Change Password
        </h2>

        {errorMessage && (
          <div className="bg-red-500 text-white p-2 rounded mb-3 text-center">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-500 text-white p-2 rounded mb-3 text-center">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm">Old Password</label>
            <input
              type="password"
              className="w-full p-2 border border-gray-700 rounded bg-[#1b1b1b] text-white"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm">New Password</label>
            <input
              type="password"
              className="w-full p-2 border border-gray-700 rounded bg-[#1b1b1b] text-white"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm">Confirm New Password</label>
            <input
              type="password"
              className="w-full p-2 border border-gray-700 rounded bg-[#1b1b1b] text-white"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className={`w-full p-2 rounded text-white ${
              loading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-primary hover:bg-primaryHover"
            }`}
            disabled={loading}
          >
            {loading ? "Updating..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
