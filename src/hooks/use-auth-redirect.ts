import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAuthRedirect(
  isAuthenticated: boolean,
  isLoading: boolean,
  targetPath: string = "/map"
) {
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(targetPath);
    }
  }, [isLoading, isAuthenticated, targetPath, router]);

  return {
    redirect: () => {
      if (isAuthenticated) {
        router.push(targetPath);
      }
    }
  };
}