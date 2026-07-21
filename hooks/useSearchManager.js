import { useContext } from "react";
import { SearchContext } from "@/context/SearchContext";

export function useSearchManager() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearchManager must be used within a SearchProvider wrapper.");
  }
  return context;
}

export default useSearchManager;
