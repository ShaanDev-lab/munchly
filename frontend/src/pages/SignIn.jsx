import React from "react";
import { useState } from "react";
import { FaRegEye } from "react-icons/fa";
import { FaRegEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverUrl } from "../App";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../firebase";
import { ClipLoader } from "react-spinners";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";
function SignIn() {
  const primaryColor = "#ff4d2d";
  // const hoverColor = "#e64323";
  const bgColor = "#fff9f6";
  const borderColor = "#ddd";
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const dispatch = useDispatch();
  const handleSignIn = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErr("Please enter email and password.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setErr("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setErr("");
    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/signin`,
        {
          email: trimmedEmail,
          password,
        },
        { withCredentials: true },
      );
      dispatch(setUserData(result.data));
      setErr("");
    } catch (error) {
      setErr(error?.response?.data?.message || "Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const handleGoogleAuth = async () => {
    setErr("");
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const { data } = await axios.post(
        `${serverUrl}/api/auth/google-auth`,
        {
          email: result.user.email,
          fullName: result.user.displayName,
        },
        { withCredentials: true },
      );
      dispatch(setUserData(data));
    } catch (error) {
      if (error?.code === "auth/popup-closed-by-user" || error?.code === "auth/cancelled-popup-request") {
        setErr("Google sign-in was cancelled.");
      } else {
        setErr(error?.response?.data?.message || "Google sign-in failed.");
      }
      console.log(error);
    } finally {
      setGoogleLoading(false);
    }
  };
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4"
      style={{ backgroundColor: bgColor }}
    >
      <div
        className={`bg-white rounded-xl shadow-lg w-full max-w-md p-8 border-[1px] `}
        style={{
          border: `1px solid ${borderColor}`,
        }}
      >
        <h1
          className={`text-3xl font-bold mb-2 `}
          style={{ color: primaryColor }}
        >
          Munchly
        </h1>
        <p className="text-gray-600 mb-8">
          {" "}
          Sign In to your account to get started with delicious food deliveries
        </p>

        {/* email */}

        <div className="mb-4">
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
            className="w-full border rounded-lg px-3 py-2 focus:outline-none "
            placeholder="Enter your Email"
            style={{ border: `1px solid ${borderColor}` }}
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            required
          />
        </div>
        {/* password*/}

        <div className="mb-4">
          <label
            htmlFor="password"
            className="block text-gray-700 font-medium mb-1"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              autoComplete="current-password"
              type={`${showPassword ? "text" : "password"}`}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none pr-10"
              placeholder="Enter your password"
              style={{ border: `1px solid ${borderColor}` }}
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              required
            />

            <button
              type="button"
              className="absolute right-3 cursor-pointer top-[14px] text-gray-500"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {!showPassword ? <FaRegEye /> : <FaRegEyeSlash />}
            </button>
          </div>
        </div>
        <div
          className="text-right mb-4 cursor-pointer text-[#ff4d2d] font-medium"
          onClick={() => navigate("/forgot-password")}
        >
          Forgot Password
        </div>

        <button
          type="button"
          className={`w-full font-semibold py-2 rounded-lg transition duration-200 bg-[#ff4d2d] text-white hover:bg-[#e64323] cursor-pointer disabled:opacity-60`}
          onClick={handleSignIn}
          disabled={loading || googleLoading}
        >
          {loading ? <ClipLoader size={20} color="white" /> : "Sign In"}
        </button>
        {err && <p className="text-red-500 text-center my-[10px]">*{err}</p>}

        <button
          type="button"
          className="w-full mt-4 flex items-center justify-center gap-2 border rounded-lg px-4 py-2 transition cursor-pointer duration-200 border-gray-400 hover:bg-gray-100 disabled:opacity-60"
          onClick={handleGoogleAuth}
          disabled={loading || googleLoading}
        >
          <FcGoogle size={20} />
          <span>{googleLoading ? "Connecting..." : "Sign In with Google"}</span>
        </button>
        <p
          className="text-center mt-6 cursor-pointer"
          onClick={() => navigate("/signup")}
        >
          Want to create a new account ?{" "}
          <span className="text-[#ff4d2d]">Sign Up</span>
        </p>
      </div>
    </div>
  );
}

export default SignIn;
