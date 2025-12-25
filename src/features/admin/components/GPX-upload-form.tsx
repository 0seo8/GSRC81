"use client";

import { useState, useEffect } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Upload, FileText, MapPin } from "lucide-react";
import ImageUploader from "@/shared/components/common/ImageUploader";
import { supabase } from "@/shared/lib/supabase";
import { toast } from "sonner";
import {
  GPX_LIMITS,
  IMAGE_LIMITS,
  getFileExtension,
} from "@/shared/constants/file-limits";
import { useGPXParser, type GPXData } from "@/shared/hooks/use-gpx-parser";

interface Category {
  id: string;
  key: string;
  name: string;
  sort_order: number;
}

interface GPXUploadFormProps {
  onSubmit: (formData: FormData, gpxData: GPXData | null) => Promise<void>;
  loading?: boolean;
}

export function GPXUploadForm({
  onSubmit,
  loading = false,
}: GPXUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const { gpxData, parsing, parseFile } = useGPXParser();
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    distance_km: "",
    avg_time_min: "",
    difficulty: "medium" as "easy" | "medium" | "hard",
    category_id: "",
  });
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);

  // 카테고리 목록 로드
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("course_categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // 파일 확장자 검증
    const fileExtension = getFileExtension(selectedFile.name);
    if (!GPX_LIMITS.ALLOWED_EXTENSIONS.includes(fileExtension as ".gpx")) {
      toast.error("GPX 파일만 업로드 가능합니다.");
      return;
    }

    setFile(selectedFile);

    // Hook을 사용한 GPX 파싱 (파일 크기 검증 포함)
    const parsed = await parseFile(selectedFile);

    // 파싱 성공 시 폼 데이터 자동 설정
    if (parsed) {
      setFormData((prev) => ({
        ...prev,
        title: prev.title || parsed.name,
        distance_km: parsed.distance.toString(),
        avg_time_min: parsed.duration.toString(),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !gpxData) {
      toast.error("GPX 파일을 선택해주세요.");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("코스명을 입력해주세요.");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("코스 설명을 입력해주세요.");
      return;
    }

    const submitData = new FormData();
    submitData.append("gpx_file", file);
    submitData.append("title", formData.title);
    submitData.append("description", formData.description);
    submitData.append("distance_km", formData.distance_km.toString());
    submitData.append("avg_time_min", formData.avg_time_min.toString());
    submitData.append("difficulty", formData.difficulty);
    submitData.append("category_id", formData.category_id);
    submitData.append("photos", JSON.stringify(uploadedPhotos));

    await onSubmit(submitData, gpxData);
  };

  const handlePhotoUpload = (url: string) => {
    // 최대 사진 개수 검증
    if (uploadedPhotos.length >= IMAGE_LIMITS.MAX_UPLOAD_COUNT) {
      toast.error(
        `최대 ${IMAGE_LIMITS.MAX_UPLOAD_COUNT}장까지만 업로드 가능합니다.`,
      );
      return;
    }
    setUploadedPhotos((prev) => [...prev, url]);
  };

  const handlePhotoRemove = (url: string) => {
    setUploadedPhotos((prev) => prev.filter((photo) => photo !== url));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* GPX 파일 업로드 */}
      <div>
        <Label htmlFor="gpx-file">GPX 파일 업로드 *</Label>
        <div className="mt-2">
          <label htmlFor="gpx-file" className="cursor-pointer block">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-gray-400 transition-colors">
              <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                {file ? (
                  file.name
                ) : (
                  <>
                    <span className="hidden sm:inline">
                      GPX 파일을 선택하거나 드래그하세요
                    </span>
                    <span className="sm:hidden">GPX 파일 선택</span>
                  </>
                )}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                .gpx 파일만 지원됩니다
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 sm:hidden"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("gpx-file")?.click();
                }}
              >
                파일 선택
              </Button>
            </div>
            <input
              id="gpx-file"
              type="file"
              accept=".gpx,application/gpx+xml"
              onChange={handleFileChange}
              className="hidden"
              capture="environment"
            />
          </label>
        </div>
      </div>

      {/* GPX 파싱 중 */}
      {parsing && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
            <p className="text-gray-700 text-sm">GPX 파일을 분석하는 중...</p>
          </div>
        </div>
      )}

      {/* GPX 파일 정보 표시 */}
      {gpxData && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <h3 className="font-medium text-gray-800 mb-2 flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            GPX 파일 분석 완료
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">총 거리:</span>
              <span className="font-medium text-gray-800 ml-1">
                {gpxData.distance}km
              </span>
            </div>
            <div>
              <span className="text-gray-600">예상 소요시간:</span>
              <span className="font-medium text-gray-800 ml-1">
                {gpxData.duration}분
              </span>
            </div>
            <div>
              <span className="text-gray-600">고도 상승:</span>
              <span className="font-medium text-gray-800 ml-1">
                {gpxData.elevationGain}m
              </span>
            </div>
            <div>
              <span className="text-gray-600">트랙 포인트:</span>
              <span className="font-medium text-gray-800 ml-1">
                {gpxData.coordinates.length}개
              </span>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-600 space-y-1">
            <div>
              <MapPin className="w-3 h-3 inline mr-1" />
              시작점: {gpxData.startPoint.lat.toFixed(6)},{" "}
              {gpxData.startPoint.lng.toFixed(6)}
            </div>
            <div>
              <MapPin className="w-3 h-3 inline mr-1" />
              종료점: {gpxData.endPoint.lat.toFixed(6)},{" "}
              {gpxData.endPoint.lng.toFixed(6)}
            </div>
          </div>
        </div>
      )}

      {/* 추가 정보 입력 */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="title">코스명 *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="예: 불광천 러닝코스"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">코스 설명 (요약) *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="코스에 대한 간단한 설명을 입력하세요"
            rows={2}
            required
          />
        </div>

        {/* GPX 파싱 후 거리/시간 수정 가능 */}
        {gpxData && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="distance">거리 (km) *</Label>
              <Input
                id="distance"
                type="number"
                step="0.01"
                value={formData.distance_km}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    distance_km: e.target.value,
                  })
                }
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label htmlFor="time">소요시간 (분) *</Label>
              <Input
                id="time"
                type="number"
                value={formData.avg_time_min}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    avg_time_min: e.target.value,
                  })
                }
                placeholder="0"
                required
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="difficulty">난이도 *</Label>
            <Select
              value={formData.difficulty}
              onValueChange={(value: "easy" | "medium" | "hard") =>
                setFormData({ ...formData, difficulty: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">쉬움</SelectItem>
                <SelectItem value="medium">보통</SelectItem>
                <SelectItem value="hard">어려움</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="category">카테고리</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) =>
                setFormData({ ...formData, category_id: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>
            코스 사진 (선택) - {uploadedPhotos.length}/
            {IMAGE_LIMITS.MAX_UPLOAD_COUNT}
          </Label>
          <div className="space-y-3">
            {uploadedPhotos.length < IMAGE_LIMITS.MAX_UPLOAD_COUNT && (
              <ImageUploader
                onUpload={handlePhotoUpload}
                currentUrl=""
                bucket="course-photos"
              />
            )}
            {uploadedPhotos.length >= IMAGE_LIMITS.MAX_UPLOAD_COUNT && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                최대 {IMAGE_LIMITS.MAX_UPLOAD_COUNT}장까지 업로드 가능합니다.
                사진을 삭제한 후 추가할 수 있습니다.
              </div>
            )}
            {uploadedPhotos.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {uploadedPhotos.map((url, index) => (
                  <div key={url} className="relative group">
                    <img
                      src={url}
                      alt={`업로드된 사진 ${index + 1}`}
                      className="w-full aspect-square object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => handlePhotoRemove(url)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Upload className="w-3 h-3 rotate-180" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500">
              최대 {IMAGE_LIMITS.MAX_UPLOAD_COUNT}장까지 업로드 가능합니다
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" disabled={!gpxData || loading}>
          {loading ? "등록 중..." : "코스 등록"}
        </Button>
      </div>
    </form>
  );
}
