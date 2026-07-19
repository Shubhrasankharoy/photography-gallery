"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserStudios } from "@/lib/studioService";

const StudioContext = createContext({});

export const useStudio = () => useContext(StudioContext);

export const StudioProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [studios, setStudios] = useState([]);
  const [currentStudio, setCurrentStudio] = useState(null);
  const [currentRole, setCurrentRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Derive permissions based on role
  const getPermissions = useCallback((role) => {
    if (!role) {
      return {
        canInvite: false,
        canUpdateStudio: false,
        canDeleteStudio: false,
        canManageMembers: false,
        canUpload: false,
      };
    }
    return {
      canInvite: ["owner", "admin"].includes(role),
      canUpdateStudio: ["owner", "admin"].includes(role),
      canDeleteStudio: ["owner"].includes(role),
      canManageMembers: ["owner", "admin"].includes(role),
      canUpload: ["owner", "admin", "photographer"].includes(role),
    };
  }, []);

  const refreshStudios = useCallback(async () => {
    if (!user) {
      setStudios([]);
      setCurrentStudio(null);
      setCurrentRole(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const userStudios = await getUserStudios(user.uid);
      setStudios(userStudios);

      if (userStudios.length > 0) {
        // Retrieve selected studio from localStorage
        const savedStudioId = localStorage.getItem(`activeStudioId_${user.uid}`);
        const found = userStudios.find((s) => s.studioId === savedStudioId);
        
        const active = found || userStudios[0];
        setCurrentStudio(active);
        setCurrentRole(active.userRole || "viewer");
        
        // Cache selection
        localStorage.setItem(`activeStudioId_${user.uid}`, active.studioId);
      } else {
        setCurrentStudio(null);
        setCurrentRole(null);
      }
    } catch (err) {
      console.error("Error refreshing studio context:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const switchStudio = useCallback((studioId) => {
    if (!user) return;
    const target = studios.find((s) => s.studioId === studioId);
    if (target) {
      setCurrentStudio(target);
      setCurrentRole(target.userRole || "viewer");
      localStorage.setItem(`activeStudioId_${user.uid}`, studioId);
    }
  }, [user, studios]);

  useEffect(() => {
    let active = true;
    async function run() {
      await Promise.resolve();
      if (active) {
        if (!authLoading) {
          refreshStudios();
        }
      }
    }
    run();
    return () => {
      active = false;
    };
  }, [user, authLoading, refreshStudios]);

  const value = {
    studios,
    currentStudio,
    currentRole,
    permissions: getPermissions(currentRole),
    isLoading: isLoading || authLoading,
    switchStudio,
    refreshStudios,
  };

  return (
    <StudioContext.Provider value={value}>
      {children}
    </StudioContext.Provider>
  );
};
