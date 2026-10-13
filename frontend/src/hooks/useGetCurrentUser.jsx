import axios from "axios";
import { useEffect } from "react";
import { serverUrl } from "../App";
import { useDispatch } from "react-redux";
import { setAuthLoading, setUserData } from "../redux/userSlice";

function useGetCurrentUser() {
  const dispatch = useDispatch();
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const result = await axios.get(`${serverUrl}/api/user/current`, {
          withCredentials: true,
        });
        dispatch(setUserData(result.data));
      } catch (error) {
        const status = error?.response?.status;
        const message = error?.response?.data?.message;
        // Expected when logged out (no cookie) — not an error, just means no session
        if (
          (status === 400 || status === 401) &&
          (message === "token not found" ||
            message === "token not verify" ||
            message === "user is not found")
        ) {
          dispatch(setUserData(null));
        } else {
          console.log(error);
        }
      } finally {
        dispatch(setAuthLoading(false));
      }
    };
    fetchUser();
  }, [dispatch]);
}

export default useGetCurrentUser;
