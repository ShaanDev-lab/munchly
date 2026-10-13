import axios from "axios";
import { useEffect } from "react";
import { serverUrl } from "../App";
import { useDispatch, useSelector } from "react-redux";
import { setItemsInMyCity } from "../redux/userSlice";

function isValidCity(city) {
  if (typeof city !== "string") return false;
  const trimmed = city.trim();
  if (!trimmed) return false;
  const lowered = trimmed.toLowerCase();
  return lowered !== "null" && lowered !== "undefined";
}

function useGetItemsByCity() {
  const dispatch = useDispatch();
  const { currentCity, userData } = useSelector((state) => state.user);
  const userId = userData?._id;
  useEffect(() => {
    if (!userId || !isValidCity(currentCity)) return;
    let cancelled = false;
    const fetchItems = async () => {
      try {
        const result = await axios.get(
          `${serverUrl}/api/item/get-by-city/${encodeURIComponent(currentCity.trim())}`,
          { withCredentials: true },
        );
        if (!cancelled) dispatch(setItemsInMyCity(result.data));
      } catch (error) {
        console.log(error);
      }
    };
    fetchItems();
    return () => {
      cancelled = true;
    };
  }, [currentCity, userId, dispatch]);
}

export default useGetItemsByCity;
