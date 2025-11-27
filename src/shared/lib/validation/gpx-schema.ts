import { z } from "zod";

/**
 * GPX 좌표 스키마
 */
export const CoordinateSchema = z.object({
  lat: z.number().min(-90).max(90, "위도는 -90 ~ 90 범위여야 합니다"),
  lng: z.number().min(-180).max(180, "경도는 -180 ~ 180 범위여야 합니다"),
  ele: z.number().optional(),
});

/**
 * GPX 데이터 스키마
 */
export const GPXDataSchema = z.object({
  name: z.string().min(1, "코스 이름은 필수입니다"),
  distance: z.number().positive("거리는 양수여야 합니다"),
  startPoint: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  endPoint: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  duration: z.number().positive("소요시간은 양수여야 합니다"),
  elevationGain: z.number().nonnegative("고도는 음수일 수 없습니다"),
  coordinates: z.array(CoordinateSchema).min(2, "최소 2개의 좌표가 필요합니다"),
});

export type GPXData = z.infer<typeof GPXDataSchema>;
export type Coordinate = z.infer<typeof CoordinateSchema>;

/**
 * GPX 폼 데이터 스키마
 */
export const GPXFormSchema = z.object({
  title: z
    .string()
    .min(1, "제목을 입력해주세요")
    .max(100, "제목은 100자 이하여야 합니다"),
  description: z.string().min(1, "설명을 입력해주세요"),
  detail_description: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"], {
    message: "난이도를 선택해주세요",
  }),
  category_id: z.string().optional(),
  tags: z.array(z.string()).default([]),
  cover_image_url: z
    .string()
    .url("유효한 URL을 입력해주세요")
    .optional()
    .or(z.literal("")),
});

export type GPXFormData = z.infer<typeof GPXFormSchema>;
