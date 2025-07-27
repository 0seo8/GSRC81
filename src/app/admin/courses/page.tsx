"use client";

import { useState, useEffect } from 'react';
import { ProtectedAdminRoute } from '@/components/ProtectedAdminRoute';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  ArrowLeft 
} from 'lucide-react';
import Link from 'next/link';
import { GPXUploadForm } from '@/components/admin/GPXUploadForm';

interface Course {
  id: string;
  title: string;
  description: string;
  start_latitude: number;
  start_longitude: number;
  distance_km: number;
  avg_time_min: number;
  difficulty: 'easy' | 'medium' | 'hard';
  nearest_station: string;
  is_active: boolean;
  created_at: string;
}

interface CourseForm {
  title: string;
  description: string;
  start_latitude: string;
  start_longitude: string;
  distance_km: string;
  avg_time_min: string;
  difficulty: 'easy' | 'medium' | 'hard';
  nearest_station: string;
}

export default function CoursesManagePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGPXDialogOpen, setIsGPXDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<CourseForm>({
    title: '',
    description: '',
    start_latitude: '',
    start_longitude: '',
    distance_km: '',
    avg_time_min: '',
    difficulty: 'medium',
    nearest_station: ''
  });

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      start_latitude: '',
      start_longitude: '',
      distance_km: '',
      avg_time_min: '',
      difficulty: 'medium',
      nearest_station: ''
    });
    setEditingCourse(null);
  };

  const handleEdit = (course: Course) => {
    setFormData({
      title: course.title,
      description: course.description || '',
      start_latitude: course.start_latitude.toString(),
      start_longitude: course.start_longitude.toString(),
      distance_km: course.distance_km.toString(),
      avg_time_min: course.avg_time_min?.toString() || '',
      difficulty: course.difficulty,
      nearest_station: course.nearest_station || ''
    });
    setEditingCourse(course);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const courseData = {
        title: formData.title,
        description: formData.description,
        start_latitude: parseFloat(formData.start_latitude),
        start_longitude: parseFloat(formData.start_longitude),
        distance_km: parseFloat(formData.distance_km),
        avg_time_min: formData.avg_time_min ? parseInt(formData.avg_time_min) : null,
        difficulty: formData.difficulty,
        nearest_station: formData.nearest_station,
        is_active: true
      };

      if (editingCourse) {
        // 수정
        const { error } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', editingCourse.id);

        if (error) throw error;
        alert('코스가 수정되었습니다.');
      } else {
        // 새로 생성
        const { error } = await supabase
          .from('courses')
          .insert([courseData]);

        if (error) throw error;
        alert('새 코스가 등록되었습니다.');
      }

      setIsDialogOpen(false);
      resetForm();
      loadCourses();
    } catch (error) {
      console.error('Failed to save course:', error);
      alert('코스 저장 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (course: Course) => {
    if (!confirm(`"${course.title}" 코스를 삭제하시겠습니까?`)) return;

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', course.id);

      if (error) throw error;
      alert('코스가 삭제되었습니다.');
      loadCourses();
    } catch (error) {
      console.error('Failed to delete course:', error);
      alert('코스 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleGPXSubmit = async (formData: FormData, gpxData: any) => {
    try {
      setSubmitting(true);

      // GPX 데이터에서 코스 정보 추출
      const courseData = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        start_latitude: gpxData.startPoint.lat,
        start_longitude: gpxData.startPoint.lng,
        distance_km: gpxData.distance,
        avg_time_min: gpxData.duration,
        difficulty: formData.get('difficulty') as string,
        nearest_station: formData.get('nearest_station') as string,
        is_active: true
      };

      const { error } = await supabase
        .from('courses')
        .insert([courseData]);

      if (error) throw error;

      alert('GPX 파일로부터 코스가 성공적으로 등록되었습니다!');
      setIsGPXDialogOpen(false);
      loadCourses();
    } catch (error) {
      console.error('Failed to save course from GPX:', error);
      alert('코스 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const difficultyLabels = {
    easy: '쉬움',
    medium: '보통', 
    hard: '어려움'
  };

  const difficultyColors = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800'
  };

  return (
    <ProtectedAdminRoute>
      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-4">
                <Link href="/admin">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    대시보드
                  </Button>
                </Link>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">코스 관리</h1>
                  <p className="text-sm text-gray-500">러닝 코스를 등록하고 관리합니다</p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Dialog open={isGPXDialogOpen} onOpenChange={setIsGPXDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      GPX로 등록
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>GPX 파일로 코스 등록</DialogTitle>
                      <DialogDescription>
                        GPX 파일을 업로드하면 자동으로 코스 정보가 추출됩니다
                      </DialogDescription>
                    </DialogHeader>
                    <GPXUploadForm 
                      onSubmit={handleGPXSubmit}
                      loading={submitting}
                    />
                  </DialogContent>
                </Dialog>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={resetForm}>
                      <Edit className="w-4 h-4 mr-2" />
                      수동 등록
                    </Button>
                  </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingCourse ? '코스 수정' : '새 코스 등록'}
                    </DialogTitle>
                    <DialogDescription>
                      러닝 코스 정보를 입력해주세요
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
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
                        <Label htmlFor="nearest_station">가까운 지하철역</Label>
                        <Input
                          id="nearest_station"
                          value={formData.nearest_station}
                          onChange={(e) => setFormData({...formData, nearest_station: e.target.value})}
                          placeholder="예: 구파발역"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">코스 설명</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="코스에 대한 설명을 입력하세요"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start_latitude">시작점 위도 *</Label>
                        <Input
                          id="start_latitude"
                          type="number"
                          step="0.000001"
                          value={formData.start_latitude}
                          onChange={(e) => setFormData({...formData, start_latitude: e.target.value})}
                          placeholder="37.618123"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="start_longitude">시작점 경도 *</Label>
                        <Input
                          id="start_longitude"
                          type="number"
                          step="0.000001"
                          value={formData.start_longitude}
                          onChange={(e) => setFormData({...formData, start_longitude: e.target.value})}
                          placeholder="126.921456"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="distance_km">거리(km) *</Label>
                        <Input
                          id="distance_km"
                          type="number"
                          step="0.1"
                          value={formData.distance_km}
                          onChange={(e) => setFormData({...formData, distance_km: e.target.value})}
                          placeholder="5.2"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="avg_time_min">평균 소요시간(분)</Label>
                        <Input
                          id="avg_time_min"
                          type="number"
                          value={formData.avg_time_min}
                          onChange={(e) => setFormData({...formData, avg_time_min: e.target.value})}
                          placeholder="30"
                        />
                      </div>
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
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        취소
                      </Button>
                      <Button type="submit">
                        {editingCourse ? '수정' : '등록'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              </div>
            </div>
          </div>
        </header>

        {/* 메인 콘텐츠 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">코스를 불러오는 중...</p>
            </div>
          ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card key={course.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{course.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {course.nearest_station && `${course.nearest_station} 인근`}
                        </CardDescription>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[course.difficulty]}`}>
                        {difficultyLabels[course.difficulty]}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {course.description || '설명이 없습니다.'}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-gray-500">거리</span>
                        <p className="font-medium">{course.distance_km}km</p>
                      </div>
                      <div>
                        <span className="text-gray-500">소요시간</span>
                        <p className="font-medium">
                          {course.avg_time_min ? `${course.avg_time_min}분` : '-'}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-gray-400 mb-4">
                      등록일: {new Date(course.created_at).toLocaleDateString()}
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(course)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        수정
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(course)}
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 코스가 없습니다</h3>
              <p className="text-gray-600 mb-6">GPX 파일을 업로드하여 첫 번째 러닝 코스를 등록해보세요</p>
              <Button onClick={() => setIsGPXDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                GPX로 첫 코스 등록하기
              </Button>
            </div>
          )}
        </main>
      </div>
    </ProtectedAdminRoute>
  );
}