'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { supabase, TABLES } from '@/lib/supabase';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, STORAGE_KEYS } from '@/lib/constants';

export function LoginForm() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Supabase에서 활성화된 access_links 조회
      const { data: accessLinks, error } = await supabase
        .from(TABLES.ACCESS_LINKS)
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      // 간단한 비밀번호 확인 (실제로는 해시 비교 필요)
      const isValidPassword = accessLinks?.some(link => 
        // 개발 단계에서는 평문 비교, 실제로는 bcrypt 사용해야 함
        password === 'gsrc81' || password === 'admin123'
      );

      if (isValidPassword) {
        // 인증 토큰 저장
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'authenticated');
        toast.success(SUCCESS_MESSAGES.LOGIN_SUCCESS);
        router.push('/map');
      } else {
        toast.error(ERROR_MESSAGES.AUTHENTICATION_FAILED);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(ERROR_MESSAGES.NETWORK_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
              className="mx-auto w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mb-4"
            >
              <MapPin className="w-8 h-8 text-white" />
            </motion.div>
            
            <CardTitle className="text-2xl font-bold text-gray-900">
              GSRC81 Maps
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              러닝 크루 전용 지도 서비스
              <br />
              비밀번호를 입력하여 접속하세요
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="크루 전용 비밀번호"
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-orange-500 hover:bg-orange-600"
                disabled={isLoading}
              >
                {isLoading ? '로그인 중...' : '접속하기'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                GSRC81 러닝 크루원만 접속 가능합니다
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Development hint */}
        {process.env.NODE_ENV === 'development' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-center"
          >
            <p className="text-sm text-blue-600">
              개발 모드: <code className="bg-blue-100 px-1 rounded">gsrc81</code> 또는 <code className="bg-blue-100 px-1 rounded">admin123</code>
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}