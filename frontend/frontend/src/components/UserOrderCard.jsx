import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { serverUrl } from "../App";

function UserOrderCard({ data }) {
  const navigate = useNavigate();
  const [selectedRating, setSelectedRating] = useState({}); //itemId:rating
  const [ratedItems, setRatedItems] = useState({});
  const [ratingError, setRatingError] = useState("");

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleRating = async (itemId, rating) => {
    if (!itemId || ratedItems[itemId]) return;
    setRatingError("");
    try {
      await axios.post(
        `${serverUrl}/api/item/rating`,
        { itemId, rating },
        { withCredentials: true },
      );
      setSelectedRating((prev) => ({
        ...prev,
        [itemId]: rating,
      }));
      setRatedItems((prev) => ({ ...prev, [itemId]: true }));
    } catch (error) {
      console.log(error);
      setRatingError(error?.response?.data?.message || "Rating failed.");
    }
  };

  const shopOrders = Array.isArray(data?.shopOrders) ? data.shopOrders : [];
  const headerStatuses = [...new Set(shopOrders.map((so) => so?.status).filter(Boolean))];
  const headerStatus = headerStatuses.length > 1 ? headerStatuses.join(" • ") : (headerStatuses[0] ?? "—");

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <div className="flex justify-between border-b pb-2">
        <div>
          <p className="font-semibold">order #{data?._id?.slice(-6) ?? "—"}</p>
          <p className="text-sm text-gray-500">
            Date: {formatDate(data?.createdAt)}
          </p>
        </div>
        <div className="text-right">
          {data?.paymentMethod === "cod" ? (
            <p className="text-sm text-gray-500">
              {data.paymentMethod?.toUpperCase()}
            </p>
          ) : (
            <p className="text-sm text-gray-500 font-semibold">
              Payment: {data?.payment ? "Paid" : "Unpaid"}
            </p>
          )}

          <p className="font-medium text-blue-600">
            {headerStatus}
          </p>
        </div>
      </div>

      {shopOrders.map((shopOrder, index) => (
        <div
          className="border rounded-lg p-3 bg-[#fffaf7] space-y-3"
          key={shopOrder?._id ?? index}
        >
          <p>{shopOrder?.shop?.name ?? "Shop"}</p>

          <div className="flex space-x-4 overflow-x-auto pb-2">
            {(shopOrder?.shopOrderItems ?? []).map((item, itemIndex) => {
              const itemId = item?.item?._id ?? item?._id;
              const image = item?.item?.image ?? item?.image;
              return (
              <div
                key={itemId ?? itemIndex}
                className="flex-shrink-0 w-40 border rounded-lg p-2 bg-white"
              >
                {image && (
                  <img
                    src={image}
                    alt={item?.name ?? "item"}
                    className="w-full h-24 object-cover rounded"
                  />
                )}
                <p className="text-sm font-semibold mt-1">{item?.name}</p>
                <p className="text-xs text-gray-500">
                  Qty: {item?.quantity ?? 0} x ₹{item?.price ?? 0}
                </p>

                {shopOrder?.status === "delivered" && itemId && (
                  <div className="flex space-x-1 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        disabled={ratedItems[itemId]}
                        className={`text-lg ${(selectedRating[itemId] ?? 0) >= star ? "text-yellow-400" : "text-gray-400"} disabled:opacity-60`}
                        onClick={() => handleRating(itemId, star)}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                )}
              </div>
              );
            })}
          </div>
          <div className="flex justify-between items-center border-t pt-2">
            <p className="font-semibold">Subtotal: ₹{shopOrder?.subtotal ?? 0}</p>
            <span className="text-sm font-medium text-blue-600">
              {shopOrder?.status}
            </span>
          </div>
        </div>
      ))}
      {ratingError && <p className="text-red-500 text-xs text-center">{ratingError}</p>}

      <div className="flex justify-between items-center border-t pt-2">
        <p className="font-semibold">Total: ₹{data?.totalAmount ?? 0}</p>
        <button
          className="bg-[#ff4d2d] hover:bg-[#e64526] text-white px-4 py-2 rounded-lg text-sm disabled:opacity-60"
          disabled={!data?._id}
          onClick={() => data?._id && navigate(`/track-order/${data._id}`)}
        >
          Track Order
        </button>
      </div>
    </div>
  );
}

export default UserOrderCard;
