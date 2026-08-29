"use client";

import { useState, useEffect, useCallback } from "react";

export interface ProductionScene {
  _id?: string;
  sceneNumber: string;
  description?: string;
  characters?: string[];
  location?: string;
  requiredEquipment?: string[];
  productionNotes?: string;
}

export interface ProductionMember {
  _id?: string;
  name: string;
  role?: string;
}

export interface ProductionPlanData {
  scenes?: ProductionScene[];
  shootDays?: Array<{ _id?: string; title: string; date?: string }>;
  locations?: Array<{ _id?: string; name: string; address?: string }>;
  cast?: ProductionMember[];
  crew?: ProductionMember[];
  roster?: ProductionMember[]; // Virtual aggregated property or array fallback
}

export type ProductionSection = "scenes" | "locations" | "cast" | "crew" | "shootDays" | "roster";

export function useProductionPlan(projectId: string) {
  const [plan, setPlan] = useState<ProductionPlanData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlanData = useCallback(async (id: string, signal?: AbortSignal) => {
    const res = await fetch(`/api/projects/${id}/production`, { signal });
    if (!res.ok) throw new Error("Failed to load production plan");
    return (await res.json()) as ProductionPlanData;
  }, []);

  useEffect(() => {
    if (!projectId) return;

    let isMounted = true;
    const controller = new AbortController();

    const loadPlan = async () => {
      try {
        const data = await fetchPlanData(projectId, controller.signal);
        if (isMounted) {
          setPlan(data);
          setError(null);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        if (isMounted) {
          const message = err instanceof Error ? err.message : "An error occurred";
          setError(message);
          setLoading(false);
        }
      }
    };

    void loadPlan();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [projectId, fetchPlanData]);

  const refresh = useCallback(() => {
    if (!projectId) return;
    setLoading(true);
    fetchPlanData(projectId)
      .then((data) => {
        setPlan(data);
        setError(null);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "An error occurred";
        setError(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [projectId, fetchPlanData]);

  const addItem = async (
    section: ProductionSection,
    item: Record<string, unknown>
  ) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/production`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, item }),
      });
      if (!res.ok) throw new Error(`Failed to add ${section} item`);
      const updated: ProductionPlanData = await res.json();
      setPlan(updated);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      return false;
    }
  };

  return { plan, loading, error, addItem, refresh };
}