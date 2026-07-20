"use client";

import { useState, useCallback } from "react";

export function useSelectionManager() {
  const [selectedIds, setSelectedIds] = useState(new Set());

  const select = useCallback((id) => {
    setSelectedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const unselect = useCallback((id) => {
    setSelectedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const toggle = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((ids) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clear = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const getSelected = useCallback(() => {
    return Array.from(selectedIds);
  }, [selectedIds]);

  const isSelected = useCallback((id) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  return {
    selectedIds,
    select,
    unselect,
    toggle,
    selectAll,
    clear,
    getSelected,
    isSelected,
    count: selectedIds.size,
  };
}
