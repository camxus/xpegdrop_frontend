"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Rating, ratingsApi } from "@/lib/api/ratingsApi";
import { api } from "@/lib/api/client";
import { useToast } from "../use-toast";
import { useCallback, useState } from "react";
import { useAuth } from "./useAuth";
import { getLocalStorage, setLocalStorage } from "@/lib/localStorage";
import { useDialog } from "../use-dialog";
import { useUser } from "./useUser";
import UnauthorizedRatingDialog, { UnauthorizedRatingDialogActions } from "@/components/unauthorized-rating-dialog";
import { Project } from "@/types/project";

export const LOCAL_RATINGS_STORAGE_KEY = "local_ratings";

export function useRatings() {
  const { user } = useAuth()
  const { localUser, setLocalUser } = useUser()
  const dialog = useDialog()
  const queryClient = useQueryClient();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [queuedRatings, setQueuedRatings] = useState<Rating[]>([]);
  const { toast } = useToast();

  const saveLocalRatings = (projectId: string, ratings: Rating[]) => {
    const localData = getLocalStorage(LOCAL_RATINGS_STORAGE_KEY) || {};
    localData[projectId] = ratings;
    setLocalStorage(LOCAL_RATINGS_STORAGE_KEY, localData);
  };

  // All ratings from the current user
  const userRatings: Rating[] = user?.user_id
    ? ratings.filter(r => r.user_id === user?.user_id)
    : [];

  // All ratings from other users
  const foreignRatings: Rating[] = user?.user_id
    ? ratings.filter(r => r.user_id !== user?.user_id)
    : [];

  const getRatings = useMutation({
    mutationFn: async (projectId?: string) => {
      if (!projectId) return [];
      const data = await ratingsApi.getRatings(projectId);
      return data;
    },
    onSuccess: (data, projectId) => {
      if (!data) return

      if (!projectId) return;

      const localData = getLocalStorage(LOCAL_RATINGS_STORAGE_KEY) || {};

      const ratingsArray: Rating[] = Array.isArray(data) ? data : data.ratings || [];

      return setRatings([...ratingsArray, ...(localData[projectId] || [])].filter(
        (rating, index, self) =>
          index === self.findIndex((r) => r.rating_id === rating.rating_id)
      ));
    },
  });

  // Mutation: Create rating
  const createRating = useMutation({
    mutationFn: (rating: { project_id: string; image_name: string; value: number }) =>
      ratingsApi.createRating(rating),
    onSuccess: (data) => {
      if (!data) return;

      const projectId = data.project_id

      const updated = [...ratings, data];
      setRatings(updated);

      if (!user?.user_id && projectId) saveLocalRatings(projectId, updated);

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
    mutationFn: ({ ratingId, value }: { ratingId: string; value: number }) => {
      setRatings((prev) =>
        prev.map((r) => (r.rating_id === ratingId ? { ...r, value } : r))
      );
      return ratingsApi.updateRating(ratingId, value)
    },
    onSuccess: (data) => {
      if (!data) return;

      const { ratingId, value } = data;
      const updated = ratings.map((r) => (r.rating_id === ratingId ? { ...r, value } : r));
      setRatings(updated);

      if (!user?.user_id && updated[0]?.project_id) saveLocalRatings(updated[0]?.project_id, updated);

      queryClient.invalidateQueries({ queryKey: ["ratings", updated[0]?.project_id] });
      toast({
        title: "Rating updated",
        description: "Your rating was updated successfully.",
      });
    },
    onError: (err: any, variables) => {
      const { ratingId } = variables

      const prevValue = ratings.find((r) => r.rating_id === ratingId)?.value || 0

      setRatings((prev) =>
        prev.map((r) => (r.rating_id === ratingId ? { ...r, value: prevValue } : r))
      );

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
      queryClient.invalidateQueries({ queryKey: ["ratings"] });
    },
    onError: (err: any) => {
      console.error("Delete rating error:", err);
    },
  });

  const handleRating =
    async (imageName: string, value: number, ratingId?: string, project?: Project) => {
      const rating = new Rating();
      rating.image_name = imageName;
      rating.value = value;
      rating.rating_id = ratingId;

      console.log(rating, project)
      if (!project) {
        setQueuedRatings((queued) => {
          const existingIndex = queued.findIndex(
            (r) => r.image_name === rating.image_name
          );

          if (existingIndex !== -1) {
            // Update existing rating
            const updated = [...queued];
            updated[existingIndex] = rating;
            return updated;
          }

          // Add new rating if not found
          return [...queued, rating];
        });
        return;
      }
      if (!ratingId)
        return await createRating.mutateAsync({
          project_id: project.project_id,
          image_name: rating.image_name,
          value: rating.value,
        });
      return await updateRating.mutateAsync({ ratingId, value });
    }

  const handleRatingChange = (imageName: string, value: number, ratingId?: string, project?: Project) => {
    const firstName = user?.first_name ?? localUser.first_name;
    const lastName = user?.last_name ?? localUser.last_name;

    if (!firstName || !lastName) {
      dialog.show({
        title: "You're currently not signed in",
        description: "Leave a note with your name so the owner knows who accessed this folder.",
        content: UnauthorizedRatingDialog,
        actions: UnauthorizedRatingDialogActions,
        contentProps: {
          onSubmit: (firstName: string, lastName: string) => {
            if (!firstName || !lastName) return

            setLocalUser({ first_name: firstName, last_name: lastName })
            handleRating(imageName, value, ratingId, project)

            return
          }
        }
      })
      return
    }

    handleRating(imageName, value, ratingId, project)
  }


  return {
    ratings,
    queuedRatings,
    setQueuedRatings,
    userRatings,
    foreignRatings,
    getRatings,
    createRating,
    updateRating,
    deleteRating,
    handleRatingChange
  };
}
