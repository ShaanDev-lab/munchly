import React, { useEffect } from "react";
import scooter from "../assets/scooter.png";
import home from "../assets/home.png";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
const deliveryBoyIcon = new L.Icon({
  iconUrl: scooter,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const customerIcon = new L.Icon({
  iconUrl: home,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

function RecenterOnMove({ lat, lon }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lon != null) {
      map.setView([lat, lon], Math.max(map.getZoom(), 14), { animate: true });
    }
  }, [lat, lon, map]);
  return null;
}

function DeliveryBoyTracking({ data }) {
  const deliveryBoyLat = data?.deliveryBoyLocation?.lat;
  const deliveryBoylon = data?.deliveryBoyLocation?.lon;
  const customerLat = data?.customerLocation?.lat;
  const customerlon = data?.customerLocation?.lon;

  if (
    deliveryBoyLat == null ||
    deliveryBoylon == null ||
    customerLat == null ||
    customerlon == null
  ) {
    return (
      <div className="w-full h-[400px] mt-3 rounded-xl overflow-hidden shadow-md flex items-center justify-center bg-gray-50">
        <p className="p-4 text-gray-500">Fetching live locations...</p>
      </div>
    );
  }

  const path = [
    [deliveryBoyLat, deliveryBoylon],
    [customerLat, customerlon],
  ];

  const center = [deliveryBoyLat, deliveryBoylon];

  return (
    <div className="w-full h-[400px] mt-3 rounded-xl overflow-hidden shadow-md">
      <MapContainer
        key={`${deliveryBoyLat},${deliveryBoylon}`}
        className={"w-full h-full"}
        center={center}
        zoom={16}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterOnMove lat={deliveryBoyLat} lon={deliveryBoylon} />
        <Marker
          position={[deliveryBoyLat, deliveryBoylon]}
          icon={deliveryBoyIcon}
        >
          <Popup>Delivery Boy</Popup>
        </Marker>
        <Marker position={[customerLat, customerlon]} icon={customerIcon}>
          <Popup>Customer</Popup>
        </Marker>

        <Polyline positions={path} color="blue" weight={4} />
      </MapContainer>
    </div>
  );
}

export default DeliveryBoyTracking;
