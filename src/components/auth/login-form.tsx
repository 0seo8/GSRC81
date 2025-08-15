"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MapPin, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function LoginForm() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = await login(password);
    if (success) {
      router.push("/splash");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-0 py-6">
          <CardHeader className="text-center pb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.2,
                type: "spring",
                stiffness: 260,
                damping: 20,
              }}
              className="mx-auto w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4"
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

              {error && (
                <div className="text-sm text-gray-700 text-center">{error}</div>
              )}

              <Button
                type="submit"
                className="w-full bg-gray-700 hover:bg-gray-800"
                disabled={isLoading}
              >
                {isLoading ? "로그인 중..." : "접속하기"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                GSRC81 러닝 크루원만 접속 가능합니다
              </p>
              <button
                type="button"
                onClick={() => (window.location.href = "/admin/login")}
                className="mt-2 text-xs text-gray-600 hover:text-gray-700 underline"
              >
                관리자 로그인
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Development hint */}
        {process.env.NODE_ENV === "development" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md text-center"
          >
            <p className="text-sm text-gray-600">
              개발 모드:{" "}
              <code className="bg-gray-100 px-1 rounded">gsrc81</code> 또는{" "}
              <code className="bg-gray-100 px-1 rounded">admin123</code>
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
