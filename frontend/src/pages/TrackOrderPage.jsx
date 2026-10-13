import axios from "axios";
import React, { useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { serverUrl } from "../App";
import { useEffect } from "react";
import { useState } from "react";
import { IoIosArrowRoundBack } from "react-icons/io";
import DeliveryBoyTracking from "../components/DeliveryBoyTracking";
import { useDispatch, useSelector } from "react-redux";
import { updateRealtimeOrderStatus } from "../redux/userSlice";
function TrackOrderPage() {
  const { orderId } = useParams();
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { socket } = useSelector((state) => state.user);
  const [liveLocations, setLiveLocations] = useState({});
  const handleGetOrder = useCallback(async () => {
    if (!orderId) {
      setError("Invalid order.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await axios.get(
        `${serverUrl}/api/order/get-order-by-id/${orderId}`,
        { withCredentials: true },
      );
      setCurrentOrder(result.data ?? null);
    } catch (error) {
      console.log(error);
      setError(error?.response?.data?.message || "Failed to load order.");
      setCurrentOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!socket) return;
    const handleLocation = ({ deliveryBoyId, latitude, longitude }) => {
      if (!deliveryBoyId || latitude == null || longitude == null) return;
      setLiveLocations((prev) => ({
        ...prev,
        [deliveryBoyId]: { lat: latitude, lon: longitude },
      }));
    };
    const handleStatus = ({ orderId: updatedOrderId, shopId, status }) => {
      if (String(updatedOrderId) !== String(orderId)) return;
      // Keep Redux + local view in sync without a refetch
      dispatch(updateRealtimeOrderStatus({ orderId: updatedOrderId, shopId, status }));
      setCurrentOrder((prev) => {
        if (!prev || !Array.isArray(prev.shopOrders)) return prev;
        return {
          ...prev,
          shopOrders: prev.shopOrders.map((so) => {
            const id = typeof so?.shop === "object" ? so?.shop?._id : so?.shop;
            return String(id) === String(shopId) ? { ...so, status } : so;
          }),
        };
      });
    };
    socket.on("updateDeliveryLocation", handleLocation);
    socket.on("update-status", handleStatus);
    return () => {
      socket.off("updateDeliveryLocation", handleLocation);
      socket.off("update-status", handleStatus);
    };
  }, [socket, orderId, dispatch]);

  useEffect(() => {
    handleGetOrder();
  }, [handleGetOrder]);

  const shopOrders = Array.isArray(currentOrder?.shopOrders) ? currentOrder.shopOrders : [];

  return (
    <div className="max-w-4xl mx-auto p-4 flex flex-col gap-6">
      <div
        className="relative flex items-center gap-4 top-[20px] left-[20px] z-[10] mb-[10px]"
        onClick={() => navigate("/")}
      >
        <IoIosArrowRoundBack size={35} className="text-[#ff4d2d]" />
        <h1 className="text-2xl font-bold md:text-center">Track Order</h1>
      </div>
      {loading ? (
        <p className="text-center text-gray-500 py-10">Loading order...</p>
      ) : error ? (
        <p className="text-center text-red-500 py-10">*{error}</p>
      ) : shopOrders.length === 0 ? (
        <p className="text-center text-gray-500 py-10">Order not found.</p>
      ) : (
      shopOrders.map((shopOrder, index) => {
        const boyId = shopOrder?.assignedDeliveryBoy?._id;
        const boyCoords = shopOrder?.assignedDeliveryBoy?.location?.coordinates;
        const fallbackBoy = boyCoords?.length >= 2
          ? { lat: boyCoords[1], lon: boyCoords[0] }
          : null;
        return (
        <div
          className="bg-white p-4 rounded-2xl shadow-md border border-orange-100 space-y-4"
          key={shopOrder?._id ?? index}
        >
          <div>
            <p className="text-lg font-bold mb-2 text-[#ff4d2d]">
              {shopOrder?.shop?.name ?? "Shop"}
            </p>
            <p className="font-semibold">
              <span>Items:</span>{" "}
              {(shopOrder?.shopOrderItems ?? []).map((i) => i?.name).filter(Boolean).join(", ") || "—"}
            </p>
            <p>
              <span className="font-semibold">Subtotal:</span> ₹
              {shopOrder?.subtotal ?? 0}
            </p>
            <p className="mt-6">
              <span className="font-semibold">Delivery address:</span>{" "}
              {currentOrder?.deliveryAddress?.text ?? "—"}
            </p>
            <p className="text-sm font-medium text-blue-600 mt-1">
              Status: {shopOrder?.status ?? "—"}
            </p>
          </div>
          {shopOrder?.status !== "delivered" ? (
            <>
              {shopOrder?.assignedDeliveryBoy ? (
                <div className="text-sm text-gray-700">
                  <p className="font-semibold">
                    <span>Delivery Boy Name:</span>{" "}
                    {shopOrder.assignedDeliveryBoy?.fullName ?? "—"}
                  </p>
                  <p className="font-semibold">
                    <span>Delivery Boy contact No.:</span>{" "}
                    {shopOrder.assignedDeliveryBoy?.mobile ?? "—"}
                  </p>
                </div>
              ) : (
                <p className="font-semibold">
                  Delivery Boy is not assigned yet.
                </p>
              )}
            </>
          ) : (
            <p className="text-green-600 font-semibold text-lg">Delivered</p>
          )}

          {shopOrder?.assignedDeliveryBoy &&
            shopOrder?.status !== "delivered" && (
              <div className="h-[400px] w-full rounded-2xl overflow-hidden shadow-md">
                <DeliveryBoyTracking
                  data={{
                    deliveryBoyLocation: (boyId && liveLocations[boyId]) || fallbackBoy,
                    customerLocation: {
                      lat: currentOrder?.deliveryAddress?.latitude,
                      lon: currentOrder?.deliveryAddress?.longitude,
                    },
                  }}
                />
              </div>
            )}
        </div>
        );
      })
      )}
    </div>
  );
}

export default TrackOrderPage;
