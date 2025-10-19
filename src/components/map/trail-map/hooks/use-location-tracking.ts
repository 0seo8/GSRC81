import { useState, useCallback } from "react";
import { MapRef } from "react-map-gl/mapbox";
import { UserLocation, LocationButtonState } from "../types";

export const useLocationTracking = (mapRef: React.RefObject<MapRef>) => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationButtonState, setLocationButtonState] =
    useState<LocationButtonState>("location");

  const findMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("이 브라우저에서는 위치 서비스를 지원하지 않습니다.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = { lat: latitude, lng: longitude };

        setUserLocation(newLocation);
        setLocationButtonState("route");

        // 지도를 사용자 위치로 이동
        if (mapRef.current) {
          mapRef.current.getMap().easeTo({
            center: [longitude, latitude],
            zoom: 16,
            duration: 1000,
            essential: true,
          });
        }
      },
      (error) => {
        console.error("위치 찾기 실패:", error);

        let message = "위치를 찾을 수 없습니다.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message =
              "위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "위치 정보를 사용할 수 없습니다.";
            break;
          case error.TIMEOUT:
            message = "위치 찾기 시간이 초과되었습니다.";
            break;
        }
        alert(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [mapRef]);

  const resetLocation = useCallback(() => {
    setUserLocation(null);
    setLocationButtonState("location");
  }, []);

  return {
    userLocation,
    locationButtonState,
    findMyLocation,
    resetLocation,
    setLocationButtonState,
  };
};
