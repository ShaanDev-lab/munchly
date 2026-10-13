import axios from "axios";
import React, { useState } from "react";
import { FaPen } from "react-icons/fa";
import { FaTrashAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { serverUrl } from "../App";
import { useDispatch } from "react-redux";
import { setMyShopData } from "../redux/ownerSlice";

function OwnerItemCard({ data }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const handleDelete = async () => {
    if (!data?._id || deleting) return;
    if (!window.confirm(`Delete "${data?.name ?? "this item"}"?`)) return;
    setDeleting(true);
    setError("");
    try {
      const result = await axios.get(
        `${serverUrl}/api/item/delete/${data._id}`,
        { withCredentials: true },
      );
      dispatch(setMyShopData(result.data));
    } catch (error) {
      console.log(error);
      setError(error?.response?.data?.message || "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };
  return (
    <div className="flex bg-white rounded-lg shadow-md overflow-hidden border border-[#ff4d2d] w-full max-w-2xl">
      <div className="w-36  flex-shrink-0 bg-gray-50">
        {data?.image && (
          <img
            src={data.image}
            alt={data?.name ?? "item"}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="flex flex-col justify-between p-3 flex-1">
        <div>
          <h2 className="text-base font-semibold text-[#ff4d2d]">
            {data?.name}
          </h2>
          <p>
            <span className="font-medium text-gray-700">Category:</span>{" "}
            {data?.category ?? "—"}
          </p>
          <p>
            <span className="font-medium text-gray-700">Food Type:</span>{" "}
            {data?.foodType ?? "—"}
          </p>
        </div>
        {error && <p className="text-red-500 text-xs">*{error}</p>}
        <div className="flex items-center justify-between">
          <div className="text-[#ff4d2d] font-bold">₹{data?.price ?? 0}</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Edit item"
              className="p-2 cursor-pointer rounded-full hover:bg-[#ff4d2d]/10  text-[#ff4d2d]"
              onClick={() => data?._id && navigate(`/edit-item/${data._id}`)}
            >
              <FaPen size={16} />
            </button>
            <button
              type="button"
              aria-label="Delete item"
              disabled={deleting}
              className="p-2 cursor-pointer rounded-full hover:bg-[#ff4d2d]/10  text-[#ff4d2d] disabled:opacity-50"
              onClick={handleDelete}
            >
              <FaTrashAlt size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OwnerItemCard;
