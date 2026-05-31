import { create } from "zustand";

const getInitialTheme = () => {
  if (typeof window === "undefined") return "light";
  return localStorage.getItem("app_theme") || "light";
};

export const useUIStore = create((set) => ({
  theme: getInitialTheme(),
  isSidebarOpen: true,
  setTheme: (theme) => set({ theme }),
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === "dark" ? "light" : "dark",
    })),
  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
}));
