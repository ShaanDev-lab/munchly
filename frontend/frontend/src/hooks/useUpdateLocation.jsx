import axios from 'axios'
import { useEffect, useRef } from 'react'
import { serverUrl } from '../App'
import { useSelector } from 'react-redux'

const MIN_UPDATE_INTERVAL_MS = 30000
const MIN_DISTANCE_METERS = 50

function distanceInMeters(a, b) {
  if (!a || !b) return Infinity
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

function useUpdateLocation() {
    const { userData } = useSelector(state => state.user)
    const userId = userData?._id
    const lastSentRef = useRef({ coords: null, at: 0 })
    const watchIdRef = useRef(null)

    useEffect(() => {
        // Only track when logged in
        if (!userId) return
        if (!("geolocation" in navigator)) return

        // Reset throttle when user changes
        lastSentRef.current = { coords: null, at: 0 }

        const updateLocation = async (lat, lon) => {
            const now = Date.now()
            const last = lastSentRef.current
            const coords = { lat, lon }
            if (
                now - last.at < MIN_UPDATE_INTERVAL_MS &&
                distanceInMeters(last.coords, coords) < MIN_DISTANCE_METERS
            ) {
                return
            }
            try {
                await axios.post(`${serverUrl}/api/user/update-location`, { lat, lon }, { withCredentials: true })
                lastSentRef.current = { coords, at: now }
            } catch (error) {
                if (error?.response?.status === 401 || error?.response?.status === 400) {
                    if (watchIdRef.current != null) {
                        navigator.geolocation.clearWatch(watchIdRef.current)
                        watchIdRef.current = null
                    }
                    return
                }
                console.log(error)
            }
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                updateLocation(pos.coords.latitude, pos.coords.longitude)
            },
            (error) => {
                console.log("watchPosition error:", error?.message)
            },
            { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 },
        )

        return () => {
            if (watchIdRef.current != null) {
                navigator.geolocation.clearWatch(watchIdRef.current)
                watchIdRef.current = null
            }
        }
    }, [userId])
}

export default useUpdateLocation
