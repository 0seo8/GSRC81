"use client";

import { useCallback, useState } from "react";
import mapboxgl from "mapbox-gl";
import {
  CURRENT_LOCATION_ZOOM,
  FLY_TO_DURATION,
  GEOLOCATION_OPTIONS,
} from "@/lib/map-constants";

interface UseGeolocationOptions {
  map: mapboxgl.Map | null;
  onError?: (error: GeolocationPositionError) => void;
  onSuccess?: (position: GeolocationPosition) => void;
}

/**
 * 사용자의 현재 위치를 가져와 지도를 이동시키는 훅
 *
 * @param options - 지도 인스턴스 및 콜백 함수
 * @returns getCurrentLocation 함수와 로딩/에러 상태
 */
export function useGeolocation({
  map,
  onError,
  onSuccess,
}: UseGeolocationOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<GeolocationPositionError | null>(null);

  const getCurrentLocation = useCallback(() => {
    if (!map || !navigator.geolocation) {
      const notSupportedError = {
        code: 0,
        message: "Geolocation is not supported",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError;

      setError(notSupportedError);
      onError?.(notSupportedError);
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        map.flyTo({
          center: [longitude, latitude],
          zoom: CURRENT_LOCATION_ZOOM,
          duration: FLY_TO_DURATION,
        });

        setIsLoading(false);
        onSuccess?.(position);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
        onError?.(err);
      },
      GEOLOCATION_OPTIONS,
    );
  }, [map, onError, onSuccess]);

  return {
    getCurrentLocation,
    isLoading,
    error,
  };
}
