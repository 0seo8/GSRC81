"use client";

import { createContext, useContext, useReducer, ReactNode } from "react";
import { type CourseWithComments } from "@/lib/courses-data";

interface MapState {
  currentCategory: string;
  allCourses: CourseWithComments[];
  isFullscreenOpen: boolean;
  selectedCourse: CourseWithComments | null;
  selectedCourses: CourseWithComments[];
  isLoading: boolean;
}

type MapAction =
  | { type: "SET_CATEGORY"; payload: string }
  | { type: "ADD_COURSES"; payload: CourseWithComments[] }
  | { type: "SET_FULLSCREEN"; payload: boolean }
  | { type: "SET_SELECTED_COURSE"; payload: CourseWithComments | null }
  | { type: "SET_SELECTED_COURSES"; payload: CourseWithComments[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "RESET_SELECTION" };

const initialState: MapState = {
  currentCategory: "jingwan",
  allCourses: [],
  isFullscreenOpen: false,
  selectedCourse: null,
  selectedCourses: [],
  isLoading: false,
};

function mapReducer(state: MapState, action: MapAction): MapState {
  switch (action.type) {
    case "SET_CATEGORY":
      return { ...state, currentCategory: action.payload };

    case "ADD_COURSES":
      const existingIds = new Set(state.allCourses.map((c) => c.id));
      const newCourses = action.payload.filter((c) => !existingIds.has(c.id));
      return {
        ...state,
        allCourses: [...state.allCourses, ...newCourses],
      };

    case "SET_FULLSCREEN":
      return { ...state, isFullscreenOpen: action.payload };

    case "SET_SELECTED_COURSE":
      return { ...state, selectedCourse: action.payload };

    case "SET_SELECTED_COURSES":
      return { ...state, selectedCourses: action.payload };

    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "RESET_SELECTION":
      return {
        ...state,
        selectedCourse: null,
        selectedCourses: [],
        isFullscreenOpen: false,
      };

    default:
      return state;
  }
}

interface MapContextValue extends MapState {
  dispatch: React.Dispatch<MapAction>;
  displayCourses: CourseWithComments[];
}

const MapContext = createContext<MapContextValue | undefined>(undefined);

interface MapProviderProps {
  children: ReactNode;
  initialCourses: CourseWithComments[];
}

export function MapProvider({ children, initialCourses }: MapProviderProps) {
  const [state, dispatch] = useReducer(mapReducer, {
    ...initialState,
    allCourses: initialCourses,
  });

  const displayCourses = state.allCourses.filter(
    (course) => (course.category_key || "jingwan") === state.currentCategory,
  );

  const value: MapContextValue = {
    ...state,
    dispatch,
    displayCourses,
  };

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}

export function useMapContext() {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error("useMapContext must be used within a MapProvider");
  }
  return context;
}
