import axios from "axios";
import React, { useState } from "react";
import { IoIosArrowRoundBack } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { serverUrl } from "../App";
import { ClipLoader } from "react-spinners";
function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const handleSendOtp = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setErr("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setErr("");
    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/send-otp`,
        { email: email.trim() },
        { withCredentials: true },
      );
      console.log(result);
      setErr("");
      setStep(2);
    } catch (error) {
      setErr(error?.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };
  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setErr("Please enter the OTP sent to your email.");
      return;
    }
    setLoading(true);
    setErr("");
    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/verify-otp`,
        { email: email.trim(), otp: otp.trim() },
        { withCredentials: true },
      );
      console.log(result);
      setErr("");
      setStep(3);
    } catch (error) {
      setErr(error?.response?.data?.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };
  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setErr("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setErr("");
    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/reset-password`,
        { email: email.trim(), newPassword },
        { withCredentials: true },
      );
      setErr("");
      console.log(result);
      navigate("/signin");
    } catch (error) {
      setErr(error?.response?.data?.message || "Password reset failed.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex w-full items-center justify-center min-h-screen p-4 bg-[#fff9f6]">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-8">
        <div className="flex items-center  gap-4 mb-4">
          <IoIosArrowRoundBack
            size={30}
            className="text-[#ff4d2d] cursor-pointer"
            onClick={() => navigate("/signin")}
          />
          <h1 className="text-2xl font-bold text-center text-[#ff4d2d]">
            Forgot Password
          </h1>
        </div>
        {step === 1 && (
          <div>
            <div className="mb-6">
              <label
                htmlFor="email"
                className="block text-gray-700 font-medium mb-1"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                autoComplete="email"
                className="w-full border-[1px] border-gray-200 rounded-lg px-3 py-2 focus:outline-none  "
                placeholder="Enter your Email"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                required
              />
            </div>
            <button
              type="button"
              className={`w-full font-semibold py-2 rounded-lg transition duration-200 bg-[#ff4d2d] text-white hover:bg-[#e64323] cursor-pointer disabled:opacity-60`}
              onClick={handleSendOtp}
              disabled={loading}
            >
              {loading ? <ClipLoader size={20} color="white" /> : "Send Otp"}
            </button>
            {err && (
              <p className="text-red-500 text-center my-[10px]">*{err}</p>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="mb-6">
              <label
                htmlFor="otp"
                className="block text-gray-700 font-medium mb-1"
              >
                OTP
              </label>
              <input
                type="text"
                id="otp"
                inputMode="numeric"
                className="w-full border-[1px] border-gray-200 rounded-lg px-3 py-2 focus:outline-none  "
                placeholder="Enter OTP"
                onChange={(e) => setOtp(e.target.value)}
                value={otp}
                required
              />
            </div>
            <button
              type="button"
              className={`w-full font-semibold py-2 rounded-lg transition duration-200 bg-[#ff4d2d] text-white hover:bg-[#e64323] cursor-pointer disabled:opacity-60`}
              onClick={handleVerifyOtp}
              disabled={loading}
            >
              {loading ? <ClipLoader size={20} color="white" /> : "Verify"}
            </button>
            {err && (
              <p className="text-red-500 text-center my-[10px]">*{err}</p>
            )}
          </div>
        )}
        {step === 3 && (
          <div>
            <div className="mb-6">
              <label
                htmlFor="newPassword"
                className="block text-gray-700 font-medium mb-1"
              >
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                autoComplete="new-password"
                className="w-full border-[1px] border-gray-200 rounded-lg px-3 py-2 focus:outline-none  "
                placeholder="Min. 6 characters"
                onChange={(e) => setNewPassword(e.target.value)}
                value={newPassword}
              />
            </div>
            <div className="mb-6">
              <label
                htmlFor="ConfirmPassword"
                className="block text-gray-700 font-medium mb-1"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="ConfirmPassword"
                autoComplete="new-password"
                className="w-full border-[1px] border-gray-200 rounded-lg px-3 py-2 focus:outline-none  "
                placeholder="Confirm Password"
                onChange={(e) => setConfirmPassword(e.target.value)}
                value={confirmPassword}
                required
              />
            </div>
            <button
              type="button"
              className={`w-full font-semibold py-2 rounded-lg transition duration-200 bg-[#ff4d2d] text-white hover:bg-[#e64323] cursor-pointer disabled:opacity-60`}
              onClick={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ClipLoader size={20} color="white" />
              ) : (
                "Reset Password"
              )}
            </button>
            {err && (
              <p className="text-red-500 text-center my-[10px]">*{err}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
