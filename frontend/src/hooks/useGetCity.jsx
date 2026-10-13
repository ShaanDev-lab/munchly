import axios from "axios";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setCurrentAddress,
  setCurrentCity,
  setCurrentState,
} from "../redux/userSlice";
import { setAddress, setLocation } from "../redux/mapSlice";

function useGetCity() {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  const userId = userData?._id;
  const apiKey = import.meta.env.VITE_GEOAPIKEY;

  useEffect(() => {
    if (!userId) return;
    if (!apiKey) {
      console.log("Missing VITE_GEOAPIKEY");
      return;
    }
    if (!("geolocation" in navigator)) {
      console.log("Geolocation not supported");
      return;
    }
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          if (cancelled) return;
          dispatch(setLocation({ lat: latitude, lon: longitude }));
          const result = await axios.get(
            `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&format=json&apiKey=${apiKey}`,
          );
          if (cancelled) return;
          const first = result?.data?.results?.[0];
          if (!first) {
            console.log("Reverse geocode returned no results");
            return;
          }
          dispatch(
            setCurrentCity(
              first.city ||
                first.town ||
                first.village ||
                first.county ||
                first.state ||
                null,
            ),
          );

          dispatch(setCurrentState(first.state || null));

          dispatch(
            setCurrentAddress(
              first.address_line2 ||
                first.address_line1 ||
                first.formatted ||
                null,
            ),
          );

          dispatch(
            setAddress(first.address_line2 || first.address_line1 || null),
          );
        } catch (error) {
          console.log(error);
        }
      },
      (error) => {
        console.log("getCurrentPosition error:", error?.message);
      },
      { timeout: 15000 },
    );
    return () => {
      cancelled = true;
    };
  }, [userId, apiKey, dispatch]);
}

export default useGetCity;
