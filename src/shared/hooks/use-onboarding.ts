"use client";

import { useState, useEffect } from "react";

const ONBOARDING_KEY = "gsrc81-onboarding-completed";

export function useOnboarding() {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<
    boolean | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const completed = localStorage.getItem(ONBOARDING_KEY);
      setIsOnboardingComplete(completed === "true");
    } catch (error) {
      console.error("Failed to read onboarding state:", error);
      setIsOnboardingComplete(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const completeOnboarding = () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, "true");
      setIsOnboardingComplete(true);
    } catch (error) {
      console.error("Failed to save onboarding state:", error);
    }
  };

  const resetOnboarding = () => {
    try {
      localStorage.removeItem(ONBOARDING_KEY);
      setIsOnboardingComplete(false);
    } catch (error) {
      console.error("Failed to reset onboarding state:", error);
    }
  };

  return {
    isOnboardingComplete,
    isLoading,
    completeOnboarding,
    resetOnboarding,
  };
}
