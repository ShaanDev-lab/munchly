import axios from 'axios'
import { useEffect } from 'react'
import { serverUrl } from '../App'
import { useDispatch, useSelector } from 'react-redux'
import { setMyShopData } from '../redux/ownerSlice'

function useGetMyshop() {
    const dispatch = useDispatch()
    const { userData } = useSelector(state => state.user)
    const userId = userData?._id
    const role = userData?.role
  useEffect(() => {
    if (!userId || role !== 'owner') return
    let cancelled = false
    const fetchShop = async () => {
      try {
        const result = await axios.get(`${serverUrl}/api/shop/get-my`, { withCredentials: true })
        if (!cancelled) dispatch(setMyShopData(result.data))
      } catch (error) {
        console.log(error)
      }
    }
    fetchShop()
    return () => { cancelled = true }
  }, [userId, role, dispatch])
}

export default useGetMyshop
