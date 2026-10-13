import axios from "axios";
import React from "react";
import { MdPhone } from "react-icons/md";
import { serverUrl } from "../App";
import { useDispatch } from "react-redux";
import { updateOrderStatus } from "../redux/userSlice";
import { useState } from "react";

function OwnerOrderCard({ data }) {
  const [availableBoys, setAvailableBoys] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const dispatch = useDispatch();

  // Owner view may carry a single shopOrder object or an array — normalize
  const shopOrder = Array.isArray(data?.shopOrders)
    ? data.shopOrders[0]
    : data?.shopOrders;
  const shopId = shopOrder?.shop?._id ?? shopOrder?.shop;
  const status = shopOrder?.status ?? "—";

  const handleUpdateStatus = async (orderId, targetShopId, nextStatus) => {
    if (!orderId || !targetShopId || !nextStatus) return;
    setUpdating(true);
    setError("");
    try {
      const result = await axios.post(
        `${serverUrl}/api/order/update-status/${orderId}/${targetShopId}`,
        { status: nextStatus },
        { withCredentials: true },
      );
      dispatch(updateOrderStatus({ orderId, shopId: targetShopId, status: nextStatus }));
      setAvailableBoys(result.data?.availableBoys ?? []);
      console.log(result.data);
    } catch (error) {
      console.log(error);
      setError(error?.response?.data?.message || "Status update failed.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">
          {data?.user?.fullName ?? "Customer"}
        </h2>
        <p className="text-sm text-gray-500">{data?.user?.email ?? ""}</p>
        <p className="flex items-center gap-2 text-sm text-gray-600 mt-1">
          <MdPhone />
          <span>{data?.user?.mobile ?? "—"}</span>
        </p>
        {data?.paymentMethod === "online" ? (
          <p className="gap-2 text-sm text-gray-600">
            Payment: {data?.payment ? "Paid" : "Unpaid"}
          </p>
        ) : (
          <p className="gap-2 text-sm text-gray-600">
            Payment Method: {data?.paymentMethod ?? "COD"}
          </p>
        )}
      </div>

      <div className="flex items-start flex-col gap-2 text-gray-600 text-sm">
        <p>{data?.deliveryAddress?.text ?? "—"}</p>
        <p className="text-xs text-gray-500">
          Lat: {data?.deliveryAddress?.latitude ?? "—"} , Lon{" "}
          {data?.deliveryAddress?.longitude ?? "—"}
        </p>
      </div>

      <div className="flex space-x-4 overflow-x-auto pb-2">
        {(shopOrder?.shopOrderItems ?? []).map((item, index) => (
          <div
            key={item?.item?._id ?? item?._id ?? index}
            className="flex-shrink-0 w-40 border rounded-lg p-2 bg-white"
          >
            {(item?.item?.image ?? item?.image) && (
              <img
                src={item?.item?.image ?? item?.image}
                alt={item?.name ?? "item"}
                className="w-full h-24 object-cover rounded"
              />
            )}
            <p className="text-sm font-semibold mt-1">{item?.name}</p>
            <p className="text-xs text-gray-500">
              Qty: {item?.quantity ?? 0} x ₹{item?.price ?? 0}
            </p>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-100">
        <span className="text-sm">
          status:{" "}
          <span className="font-semibold capitalize text-[#ff4d2d]">
            {status}
          </span>
        </span>

        <select
          className="rounded-md border px-3 py-1 text-sm focus:outline-none focus:ring-2 border-[#ff4d2d] text-[#ff4d2d] disabled:opacity-60"
          value=""
          disabled={updating || !data?._id || !shopId}
          onChange={(e) =>
            handleUpdateStatus(data?._id, shopId, e.target.value)
          }
        >
          <option value="">Change</option>
          <option value="pending">Pending</option>
          <option value="preparing">Preparing</option>
          <option value="out of delivery">Out Of Delivery</option>
        </select>
      </div>
      {error && <p className="text-red-500 text-xs">*{error}</p>}

      {status === "out of delivery" && (
        <div className="mt-3 p-2 border rounded-lg text-sm bg-orange-50 gap-4">
          {shopOrder?.assignedDeliveryBoy ? (
            <p>Assigned Delivery Boy:</p>
          ) : (
            <p>Available Delivery Boys:</p>
          )}
          {availableBoys?.length > 0 ? (
            availableBoys.map((b) => (
              <div className="text-gray-800" key={b?._id ?? b?.mobile}>
                {b?.fullName}-{b?.mobile}
              </div>
            ))
          ) : shopOrder?.assignedDeliveryBoy ? (
            <div>
              {shopOrder.assignedDeliveryBoy?.fullName}-
              {shopOrder.assignedDeliveryBoy?.mobile}
            </div>
          ) : (
            <div>Waiting for delivery boy to accept</div>
          )}
        </div>
      )}

      <div className="text-right font-bold text-gray-800 text-sm">
        Total: ₹{shopOrder?.subtotal ?? 0}
      </div>
    </div>
  );
}

export default OwnerOrderCard;
