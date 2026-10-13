import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IoIosArrowRoundBack } from "react-icons/io";
import { useNavigate } from "react-router-dom";

import UserOrderCard from "../components/UserOrderCard";
import OwnerOrderCard from "../components/OwnerOrderCard";
import { addMyOrder, updateRealtimeOrderStatus } from "../redux/userSlice";

function MyOrders() {
  const { userData, myOrders, socket } = useSelector((state) => state.user);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const userId = userData?._id;
  const role = userData?.role;

  useEffect(() => {
    if (!socket) return;

    const getId = (v) => (v && typeof v === "object" ? v._id : v);

    const handleNewOrder = (data) => {
      if (!data?._id) return;
      const shopOrders = Array.isArray(data?.shopOrders)
        ? data.shopOrders
        : data?.shopOrders
          ? [data?.shopOrders]
          : [];

      const matches = shopOrders.some((shopOrder) => {
        const ownerId =
          getId(shopOrder?.owner) ?? getId(shopOrder?.shop?.owner);

        return ownerId != null && String(ownerId) === String(userId);
      });

      if (matches) {
        dispatch(addMyOrder(data));
      }
    };

    const handleStatusUpdate = ({ orderId, shopId, status }) => {
      if (!orderId || !shopId || !status) return;
      dispatch(
        updateRealtimeOrderStatus({
          orderId,
          shopId,
          status,
        }),
      );
    };

    socket.on("newOrder", handleNewOrder);
    socket.on("update-status", handleStatusUpdate);

    return () => {
      socket.off("newOrder", handleNewOrder);
      socket.off("update-status", handleStatusUpdate);
    };
  }, [socket, userId, dispatch]);

  return (
    <div className="w-full min-h-screen bg-[#fff9f6] flex justify-center px-4">
      <div className="w-full max-w-[800px] p-4">
        <div className="flex items-center gap-[20px] mb-6">
          <button
            className="z-[10]"
            onClick={() => navigate("/")}
            aria-label="Go to home"
          >
            <IoIosArrowRoundBack size={35} className="text-[#ff4d2d]" />
          </button>

          <h1 className="text-2xl font-bold text-start">My Orders</h1>
        </div>

        {!myOrders?.length && (
          <p className="text-gray-500 text-center py-10">No orders yet.</p>
        )}

        <div className="space-y-6">
          {myOrders?.map((order, index) => {
            if (role === "owner") {
              return <OwnerOrderCard data={order} key={order._id ?? index} />;
            }

            return <UserOrderCard data={order} key={order._id ?? index} />;
          })}
        </div>
      </div>
    </div>
  );
}

export default MyOrders;
