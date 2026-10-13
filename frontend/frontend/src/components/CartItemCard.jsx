import React from "react";
import { FaMinus } from "react-icons/fa";
import { FaPlus } from "react-icons/fa";
import { CiTrash } from "react-icons/ci";
import { useDispatch } from "react-redux";
import { removeCartItem, updateQuantity } from "../redux/userSlice";
function CartItemCard({ data }) {
  const dispatch = useDispatch();
  const qty = Number(data?.quantity) || 0;
  const price = Number(data?.price) || 0;
  const handleIncrease = (id, currentQty) => {
    if (!id) return;
    dispatch(updateQuantity({ id, quantity: (Number(currentQty) || 0) + 1 }));
  };
  const handleDecrease = (id, currentQty) => {
    if (!id) return;
    const next = (Number(currentQty) || 0) - 1;
    if (next <= 0) {
      // Decrementing the last unit removes the item (matches trash behavior)
      dispatch(removeCartItem(id));
    } else {
      dispatch(updateQuantity({ id, quantity: next }));
    }
  };
  return (
    <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow border">
      <div className="flex items-center gap-4">
        {data?.image && (
          <img
            src={data.image}
            alt={data?.name ?? "cart item"}
            className="w-20 h-20 object-cover rounded-lg border"
          />
        )}
        <div>
          <h1 className="font-medium text-gray-800">{data?.name}</h1>
          <p className="text-sm text-gray-500">
            ₹{price} x {qty}
          </p>
          <p className="font-bold text-gray-900">
            ₹{price * qty}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Decrease quantity"
          className="p-2 cursor-pointer bg-gray-100 rounded-full hover:bg-gray-200"
          onClick={() => handleDecrease(data?.id, qty)}
        >
          <FaMinus size={12} />
        </button>
        <span>{qty}</span>
        <button
          type="button"
          aria-label="Increase quantity"
          className="p-2 cursor-pointer bg-gray-100 rounded-full hover:bg-gray-200"
          onClick={() => handleIncrease(data?.id, qty)}
        >
          <FaPlus size={12} />
        </button>
        <button
          type="button"
          aria-label="Remove item"
          className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
          onClick={() => data?.id && dispatch(removeCartItem(data.id))}
        >
          <CiTrash size={18} />
        </button>
      </div>
    </div>
  );
}

export default CartItemCard;
