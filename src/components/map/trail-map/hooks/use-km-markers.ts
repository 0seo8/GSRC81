import { useState, useCallback } from "react";
import { KmMarker } from "../types";

export const useKmMarkers = () => {
  const [kmMarkers, setKmMarkers] = useState<KmMarker[]>([]);
  const [visibleKmMarkers, setVisibleKmMarkers] = useState<Set<number>>(
    new Set(),
  );
  const [lastShownKm, setLastShownKm] = useState(0);

  const resetKmMarkers = useCallback(() => {
    setVisibleKmMarkers(new Set());
    setLastShownKm(0);
  }, []);

  const showKmMarker = useCallback((km: number) => {
    setLastShownKm(km);
    setVisibleKmMarkers((prev) => new Set([...prev, km]));

    // 3초 후 해당 km 마커 제거
    setTimeout(() => {
      setVisibleKmMarkers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(km);
        return newSet;
      });
    }, 3000);
  }, []);

  const hideAllKmMarkers = useCallback(() => {
    setVisibleKmMarkers(new Set());
  }, []);

  return {
    kmMarkers,
    visibleKmMarkers,
    lastShownKm,
    setKmMarkers,
    resetKmMarkers,
    showKmMarker,
    hideAllKmMarkers,
  };
};
