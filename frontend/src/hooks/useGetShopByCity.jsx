import axios from 'axios'
import { useEffect } from 'react'
import { serverUrl } from '../App'
import { useDispatch, useSelector } from 'react-redux'
import { setShopsInMyCity } from '../redux/userSlice'

function isValidCity(city) {
  if (typeof city !== 'string') return false
  const trimmed = city.trim()
  if (!trimmed) return false
  const lowered = trimmed.toLowerCase()
  return lowered !== 'null' && lowered !== 'undefined'
}

function useGetShopByCity() {
    const dispatch = useDispatch()
    const { currentCity, userData } = useSelector(state => state.user)
    const userId = userData?._id
    useEffect(() => {
        if (!userId || !isValidCity(currentCity)) return
        let cancelled = false
        const fetchShops = async () => {
            try {
                const result = await axios.get(`${serverUrl}/api/shop/get-by-city/${encodeURIComponent(currentCity.trim())}`, { withCredentials: true })
                if (!cancelled) dispatch(setShopsInMyCity(result.data))
            } catch (error) {
                console.log(error)
            }
        }
        fetchShops()
        return () => { cancelled = true }
    }, [currentCity, userId, dispatch])
}

export default useGetShopByCity
