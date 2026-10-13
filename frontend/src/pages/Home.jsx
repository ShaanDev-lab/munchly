import React from "react";
import { useSelector } from "react-redux";
import UserDashboard from "../components/UserDashboard";
import OwnerDashboard from "../components/OwnerDashboard";
import DeliveryBoy from "../components/DeliveryBoy";

function Home() {
  const { userData } = useSelector((state) => state.user);
  const role = userData?.role;
  return (
    <div className="w-[100vw] min-h-[100vh] pt-[100px] flex flex-col items-center bg-[#fff9f6]">
      {role === "user" && <UserDashboard />}
      {role === "owner" && <OwnerDashboard />}
      {role === "deliveryBoy" && <DeliveryBoy />}
      {!role && (
        <p className="text-gray-500 mt-10">Loading your dashboard...</p>
      )}
      {role && role !== "user" && role !== "owner" && role !== "deliveryBoy" && (
        <p className="text-red-500 mt-10">Unknown account role. Please contact support.</p>
      )}
    </div>
  );
}

export default Home;
