// utils/useDroneCamera.ts
import * as turf from "@turf/turf";

interface Point {
  ele?: number;
  elevation?: number;
  lat: number;
  lon: number;
}

/** 30개 포인트 가운데 표고·러프니스 분석 */
export function analyzeTerrain(points: Point[], index: number, window = 15) {
  const start = Math.max(0, index - window);
  const end = Math.min(points.length, index + window);
  const slice = points.slice(start, end);

  if (slice.length === 0) {
    return { avg: 0, var_: 0, range: 0, rough: 0 };
  }

  const elevs = slice.map((p) => p.ele || p.elevation || 0);
  const avg = elevs.reduce((a, b) => a + b, 0) / elevs.length;
  const var_ = elevs.reduce((a, e) => a + (e - avg) ** 2, 0) / elevs.length;
  const range = Math.max(...elevs) - Math.min(...elevs);

  return { avg, var_, range, rough: Math.sqrt(var_) };
}

/** 지형·속도에 따른 카메라 매개변수 보간 */
export function cameraParams(
  terrain: { avg: number; var_: number; range: number; rough: number },
  eleNow: number
) {
  let dz = 16.5;
  let pitch = 65;
  let dist = 80;
  let elevOff = 50;

  // 험지 보정
  if (terrain.range > 100 || terrain.avg > 300) {
    dz -= 0.5;
    pitch += 5;
    dist += 40;
    elevOff += 70;
  } else if (terrain.range < 30) {
    dz += 0.3;
    pitch -= 5;
  }

  // 러프니스(√var) 0~150 → 0~1
  const rScale = Math.min(terrain.rough / 150, 1);
  dz -= rScale * 0.2;
  dist += rScale * 30;
  elevOff += rScale * 20;

  return { zoom: dz, pitch, dist, camAlt: eleNow + elevOff };
}

/** bearing·거리(m) 만큼 이동한 좌표 */
export function offset(
  lat: number,
  lon: number,
  bearingDeg: number,
  distM: number
): [number, number] {
  const R = 6371e3;
  const θ = (bearingDeg * Math.PI) / 180;
  const φ1 = (lat * Math.PI) / 180;
  const λ1 = (lon * Math.PI) / 180;

  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(distM / R) +
      Math.cos(φ1) * Math.sin(distM / R) * Math.cos(θ)
  );
  const λ2 =
    λ1 +
    Math.atan2(
      Math.sin(θ) * Math.sin(distM / R) * Math.cos(φ1),
      Math.cos(distM / R) - Math.sin(φ1) * Math.sin(φ2)
    );

  return [(λ2 * 180) / Math.PI, (φ2 * 180) / Math.PI];
}
