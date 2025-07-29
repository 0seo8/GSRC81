"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, MapPin } from 'lucide-react';

interface GPXData {
  name: string;
  distance: number;
  startPoint: { lat: number; lng: number };
  endPoint: { lat: number; lng: number };
  duration: number;
  elevationGain: number;
  coordinates: Array<{ lat: number; lng: number; ele?: number }>;
}

interface GPXUploadFormProps {
  onSubmit: (formData: FormData, gpxData: GPXData | null) => Promise<void>;
  loading?: boolean;
}

export function GPXUploadForm({ onSubmit, loading = false }: GPXUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [gpxData, setGpxData] = useState<GPXData | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    nearest_station: ''
  });
  const [parsing, setParsing] = useState(false);

  const parseGPX = async (file: File): Promise<GPXData | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const xmlText = e.target?.result as string;
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

          // GPX 파일에서 트랙 포인트 추출
          const trackPoints = Array.from(xmlDoc.querySelectorAll('trkpt'));
          
          if (trackPoints.length === 0) {
            alert('유효한 GPX 파일이 아닙니다.');
            resolve(null);
            return;
          }

          // 좌표 배열 생성
          const coordinates = trackPoints.map(point => ({
            lat: parseFloat(point.getAttribute('lat') || '0'),
            lng: parseFloat(point.getAttribute('lon') || '0'),
            ele: point.querySelector('ele') ? parseFloat(point.querySelector('ele')?.textContent || '0') : undefined
          }));

          // 거리 계산 (Haversine formula)
          const calculateDistance = (coord1: {lat: number, lng: number}, coord2: {lat: number, lng: number}) => {
            const R = 6371; // Earth's radius in km
            const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
            const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                     Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
                     Math.sin(dLng/2) * Math.sin(dLng/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
          };

          let totalDistance = 0;
          for (let i = 1; i < coordinates.length; i++) {
            totalDistance += calculateDistance(coordinates[i-1], coordinates[i]);
          }

          // 고도 상승 계산
          let elevationGain = 0;
          for (let i = 1; i < coordinates.length; i++) {
            const prevEle = coordinates[i-1].ele || 0;
            const currEle = coordinates[i].ele || 0;
            if (currEle > prevEle) {
              elevationGain += currEle - prevEle;
            }
          }

          // GPX 파일에서 이름 추출
          const nameElement = xmlDoc.querySelector('name');
          const gpxName = nameElement?.textContent || file.name.replace('.gpx', '');

          // 예상 소요시간 계산 (평균 5km/h 가정)
          const estimatedDuration = Math.round((totalDistance / 5) * 60); // 분 단위

          const gpxData: GPXData = {
            name: gpxName,
            distance: Math.round(totalDistance * 100) / 100, // 소수점 2자리
            startPoint: coordinates[0],
            endPoint: coordinates[coordinates.length - 1],
            duration: estimatedDuration,
            elevationGain: Math.round(elevationGain),
            coordinates
          };

          // 자동으로 제목 설정
          if (!formData.title) {
            setFormData(prev => ({ ...prev, title: gpxData.name }));
          }

          resolve(gpxData);
        } catch (error) {
          console.error('GPX 파싱 오류:', error);
          alert('GPX 파일 파싱 중 오류가 발생했습니다.');
          resolve(null);
        }
      };
      reader.readAsText(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.gpx')) {
      alert('GPX 파일만 업로드 가능합니다.');
      return;
    }

    setFile(selectedFile);
    setParsing(true);

    const parsed = await parseGPX(selectedFile);
    setGpxData(parsed);
    setParsing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !gpxData) {
      alert('GPX 파일을 선택해주세요.');
      return;
    }

    if (!formData.title.trim()) {
      alert('코스명을 입력해주세요.');
      return;
    }

    const submitData = new FormData();
    submitData.append('gpx_file', file);
    submitData.append('title', formData.title);
    submitData.append('description', formData.description);
    submitData.append('difficulty', formData.difficulty);
    submitData.append('nearest_station', formData.nearest_station);

    await onSubmit(submitData, gpxData);
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
                {file ? file.name : (
                  <>
                    <span className="hidden sm:inline">GPX 파일을 선택하거나 드래그하세요</span>
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
                  document.getElementById('gpx-file')?.click();
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
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <p className="text-blue-700 text-sm">GPX 파일을 분석하는 중...</p>
          </div>
        </div>
      )}

      {/* GPX 파일 정보 표시 */}
      {gpxData && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <h3 className="font-medium text-green-800 mb-2 flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            GPX 파일 분석 완료
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-green-600">총 거리:</span>
              <span className="font-medium text-green-800 ml-1">{gpxData.distance}km</span>
            </div>
            <div>
              <span className="text-green-600">예상 소요시간:</span>
              <span className="font-medium text-green-800 ml-1">{gpxData.duration}분</span>
            </div>
            <div>
              <span className="text-green-600">고도 상승:</span>
              <span className="font-medium text-green-800 ml-1">{gpxData.elevationGain}m</span>
            </div>
            <div>
              <span className="text-green-600">트랙 포인트:</span>
              <span className="font-medium text-green-800 ml-1">{gpxData.coordinates.length}개</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-green-600">
            <MapPin className="w-3 h-3 inline mr-1" />
            시작점: {gpxData.startPoint.lat.toFixed(6)}, {gpxData.startPoint.lng.toFixed(6)}
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
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            placeholder="예: 불광천 러닝코스"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">코스 설명</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="코스에 대한 간단한 설명을 입력하세요"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="difficulty">난이도 *</Label>
            <Select value={formData.difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setFormData({...formData, difficulty: value})}>
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
            <Label htmlFor="nearest_station">가까운 지하철역</Label>
            <Input
              id="nearest_station"
              value={formData.nearest_station}
              onChange={(e) => setFormData({...formData, nearest_station: e.target.value})}
              placeholder="예: 구파발역"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" disabled={!gpxData || loading}>
          {loading ? '등록 중...' : '코스 등록'}
        </Button>
      </div>
    </form>
  );
}