import React from "react";
import Nav from "./Nav";
import { useSelector } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import { useEffect } from "react";
import { useState } from "react";
import DeliveryBoyTracking from "./DeliveryBoyTracking";
import { ClipLoader } from "react-spinners";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function DeliveryBoy() {
  const { userData, socket } = useSelector((state) => state.user);
  const userId = userData?._id;
  const role = userData?.role;
  const [currentOrder, setCurrentOrder] = useState(null);
  const [showOtpBox, setShowOtpBox] = useState(false);
  const [availableAssignments, setAvailableAssignments] = useState([]);
  const [otp, setOtp] = useState("");
  const [todayDeliveries, setTodayDeliveries] = useState([]);
  const [deliveryBoyLocation, setDeliveryBoyLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!socket || role !== "deliveryBoy" || !userId) return;
    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          setDeliveryBoyLocation({ lat: latitude, lon: longitude });
          socket.emit("updateLocation", {
            latitude,
            longitude,
            userId,
          });
        },
        (error) => {
          console.log(error);
        },
        {
          enableHighAccuracy: true,
        },
      );
    }

    return () => {
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
    };
  }, [socket, role, userId]);

  const ratePerDelivery = 50;
  const totalEarning = (todayDeliveries ?? []).reduce(
    (sum, d) => sum + (Number(d?.count) || 0) * ratePerDelivery,
    0,
  );

  const getAssignments = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/order/get-assignments`, {
        withCredentials: true,
      });

      setAvailableAssignments(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.log(error);
    }
  };

  const getCurrentOrder = async () => {
    try {
      const result = await axios.get(
        `${serverUrl}/api/order/get-current-order`,
        { withCredentials: true },
      );
      setCurrentOrder(result.data ?? null);
    } catch (error) {
      console.log(error);
    }
  };

  const acceptOrder = async (assignmentId) => {
    if (!assignmentId) return;
    try {
      const result = await axios.get(
        `${serverUrl}/api/order/accept-order/${assignmentId}`,
        { withCredentials: true },
      );
      console.log(result.data);
      // Remove accepted assignment immediately to avoid double-accept
      setAvailableAssignments((prev) =>
        (prev ?? []).filter((a) => a?.assignmentId !== assignmentId),
      );
      await getCurrentOrder();
    } catch (error) {
      console.log(error);
      setError(error?.response?.data?.message || "Failed to accept order.");
    }
  };

  useEffect(() => {
    if (!socket) return;
    const handleNewAssignment = (data) => {
      if (!data) return;
      setAvailableAssignments((prev) => {
        const list = prev ?? [];
        const id = data.assignmentId ?? data._id;
        if (id && list.some((a) => (a?.assignmentId ?? a?._id) === id)) {
          return list;
        }
        return [...list, data];
      });
    };
    socket.on("newAssignment", handleNewAssignment);
    return () => {
      socket.off("newAssignment", handleNewAssignment);
    };
  }, [socket]);

  const sendOtp = async () => {
    if (!currentOrder?._id || !currentOrder?.shopOrder?._id) {
      setError("Order not loaded yet. Please wait.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await axios.post(
        `${serverUrl}/api/order/send-delivery-otp`,
        {
          orderId: currentOrder._id,
          shopOrderId: currentOrder.shopOrder._id,
        },
        { withCredentials: true },
      );
      setShowOtpBox(true);
      console.log(result.data);
    } catch (error) {
      console.log(error);
      setError(error?.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };
  const verifyOtp = async () => {
    setMessage("");
    setError("");
    if (!currentOrder?._id || !currentOrder?.shopOrder?._id) {
      setError("Order not loaded yet. Please wait.");
      return;
    }
    if (!otp?.trim()) {
      setError("Please enter the OTP.");
      return;
    }
    try {
      const result = await axios.post(
        `${serverUrl}/api/order/verify-delivery-otp`,
        {
          orderId: currentOrder._id,
          shopOrderId: currentOrder.shopOrder._id,
          otp: otp.trim(),
        },
        { withCredentials: true },
      );
      console.log(result.data);
      setMessage(result.data?.message || "Delivered successfully.");
      // Reset state instead of full page reload
      setCurrentOrder(null);
      setShowOtpBox(false);
      setOtp("");
      setAvailableAssignments([]);
      await Promise.all([getAssignments()]);
    } catch (error) {
      console.log(error);
      setError(error?.response?.data?.message || "OTP verification failed.");
    }
  };

  const fallbackLocation = (() => {
    const coords = userData?.location?.coordinates;
    if (coords?.length >= 2) {
      return { lat: coords[1], lon: coords[0] };
    }
    return null;
  })();
  return (
    <div className="w-screen min-h-screen flex flex-col gap-5 items-center bg-[#fff9f6] overflow-y-auto">
      <Nav />
      <div className="w-full max-w-[800px] flex flex-col gap-5 items-center">
        <div className="bg-white rounded-2xl shadow-md p-5 flex flex-col justify-start items-center w-[90%] border border-orange-100 text-center gap-2">
          <h1 className="text-xl font-bold text-[#ff4d2d]">
            Welcome, {userData?.fullName ?? "Delivery Partner"}
          </h1>
          <p className="text-[#ff4d2d] ">
            <span className="font-semibold">Latitude:</span>{" "}
            {deliveryBoyLocation?.lat ?? fallbackLocation?.lat ?? "—"},{" "}
            <span className="font-semibold">Longitude:</span>{" "}
            {deliveryBoyLocation?.lon ?? fallbackLocation?.lon ?? "—"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-5 w-[90%] mb-6 border border-orange-100">
          <h1 className="text-lg font-bold mb-3 text-[#ff4d2d] ">
            Today Deliveries
          </h1>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={todayDeliveries ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} />
              <YAxis allowDecimals={false} />
              <Tooltip
                formatter={(value) => [value, "orders"]}
                labelFormatter={(label) => `${label}:00`}
              />
              <Bar dataKey="count" fill="#ff4d2d" />
            </BarChart>
          </ResponsiveContainer>

          <div className="max-w-sm mx-auto mt-6 p-6 bg-white rounded-2xl shadow-lg text-center">
            <h1 className="text-xl font-semibold text-gray-800 mb-2">
              Today&apos;s Earning
            </h1>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm text-center">*{error}</p>}

        {!currentOrder && (
          <div className="bg-white rounded-2xl p-5 shadow-md w-[90%] border border-orange-100">
            <h1 className="text-lg font-bold mb-4 flex items-center gap-2">
              Available Orders
            </h1>

            <div className="space-y-4">
              {availableAssignments?.length > 0 ? (
                availableAssignments.map((a) => (
                  <div
                    className="border rounded-lg p-4 flex justify-between items-center"
                    key={a?.assignmentId ?? a?._id}
                  >
                    <div>
                      <p className="text-sm font-semibold">{a?.shopName}</p>
                      <p className="text-sm text-gray-500">
                        <span className="font-semibold">Delivery Address:</span>{" "}
                        {a?.deliveryAddress?.text ?? "—"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {a?.items?.length ?? 0} items | ₹{a?.subtotal ?? 0}
                      </p>
                    </div>
                    <button
                      className="bg-orange-500 text-white px-4 py-1 rounded-lg text-sm hover:bg-orange-600"
                      onClick={() => acceptOrder(a?.assignmentId)}
                    >
                      Accept
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">No Available Orders</p>
              )}
            </div>
          </div>
        )}

        {currentOrder && (
          <div className="bg-white rounded-2xl p-5 shadow-md w-[90%] border border-orange-100">
            <h2 className="text-lg font-bold mb-3">📦Current Order</h2>
            <div className="border rounded-lg p-4 mb-3">
              <p className="font-semibold text-sm">
                {currentOrder?.shopOrder?.shop?.name ?? "Shop"}
              </p>
              <p className="text-sm text-gray-500">
                {currentOrder?.deliveryAddress?.text ?? "—"}
              </p>
              <p className="text-xs text-gray-400">
                {currentOrder?.shopOrder?.shopOrderItems?.length ?? 0} items | ₹
                {currentOrder?.shopOrder?.subtotal ?? 0}
              </p>
            </div>

            <DeliveryBoyTracking
              data={{
                deliveryBoyLocation: deliveryBoyLocation || fallbackLocation,
                customerLocation: {
                  lat: currentOrder?.deliveryAddress?.latitude,
                  lon: currentOrder?.deliveryAddress?.longitude,
                },
              }}
            />
            {!showOtpBox ? (
              <button
                className="mt-4 w-full bg-green-500 text-white font-semibold py-2 px-4 rounded-xl shadow-md hover:bg-green-600 active:scale-95 transition-all duration-200 disabled:opacity-60"
                onClick={sendOtp}
                disabled={loading || !currentOrder?._id}
              >
                {loading ? (
                  <ClipLoader size={20} color="white" />
                ) : (
                  "Mark As Delivered"
                )}
              </button>
            ) : (
              <div className="mt-4 p-4 border rounded-xl bg-gray-50">
                <p className="text-sm font-semibold mb-2">
                  Enter Otp send to{" "}
                  <span className="text-orange-500">
                    {currentOrder?.user?.fullName ?? "customer"}
                  </span>
                </p>
                <input
                  type="text"
                  className="w-full border px-3 py-2 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Enter OTP"
                  onChange={(e) => setOtp(e.target.value)}
                  value={otp}
                />
                {message && (
                  <p className="text-center text-green-600 text-lg mb-4">
                    {message}
                  </p>
                )}

                <button
                  className="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition-all"
                  onClick={verifyOtp}
                >
                  Submit OTP
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DeliveryBoy;
