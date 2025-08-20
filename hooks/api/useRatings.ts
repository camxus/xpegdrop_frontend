"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ratingsApi } from "@/lib/api/ratingsApi";
import { api } from "@/lib/api/client";
import { useToast } from "../use-toast";
import { useState } from "react";


export function useRatings(projectId?: string) {
  const queryClient = useQueryClient();
  const [ratings, setRatings] = useState<any[]>([]);
  const { toast } = useToast();

  const getRatings = useMutation({
    mutationFn: async (projectId?: string) => {
      if (!projectId) return [];
      const res = await api.get(`/ratings/${projectId}`);
      return res.data;
    },
    onSuccess: (data) => {
      if (data) setRatings(data.ratings || []);
    },
  });

  // Mutation: Create rating
  const createRating = useMutation({
    mutationFn: (rating: { project_id: string; image_id: string; value: number }) =>
      ratingsApi.createRating(rating),
    onSuccess: (data) => {
      if (data) setRatings((prev) => [...prev, data]);

      queryClient.invalidateQueries({ queryKey: ["ratings", projectId] });
      toast({
        title: "Rating created",
        description: "Your rating was submitted successfully.",
      });
    },
    onError: (err: any) => {
      console.error("Create rating error:", err);
      toast({
        title: "Error",
        description: "Failed to create rating. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation: Update rating
  const updateRating = useMutation({
    mutationFn: ({ ratingId, value }: { ratingId: string; value: number }) =>
      ratingsApi.updateRating(ratingId, value),
    onSuccess: (data, variables) => {

      const { ratingId } = variables

      if (data)
        setRatings((prev) =>
          prev.map((r) => (r.rating_id === ratingId ? data : r))
        );

      queryClient.invalidateQueries({ queryKey: ["ratings", projectId] });
      toast({
        title: "Rating updated",
        description: "Your rating was updated successfully.",
      });
    },
    onError: (err: any) => {
      console.error("Update rating error:", err);
      toast({
        title: "Error",
        description: "Failed to update rating. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation: Delete rating
  const deleteRating = useMutation({
    mutationFn: (ratingId: string) => ratingsApi.deleteRating(ratingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ratings", projectId] });
    },
    onError: (err: any) => {
      console.error("Delete rating error:", err);
    },
  });

  return {
    ratings,
    getRatings,
    createRating,
    updateRating,
    deleteRating,
  };
}
