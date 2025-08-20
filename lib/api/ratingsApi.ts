import { api } from "./client";

export class Rating {
  rating_id?: string = undefined;
  project_id: string = "";
  image_id: string = "";
  user_id: string = ""
  value: number = 0;
}

export const ratingsApi = {
  // Create new rating (anonymous or authenticated)
  createRating: async (rating: {
    project_id: string;
    image_id: string;
    value: number;
  }) => {
    return await api.post<Rating>("/ratings", rating);
  },

  // Get all ratings for a project
  getRatings: async (projectId: string) => {
    return await api.get<{ ratings: Rating[]; total: number }>(
      `/ratings/${projectId}`
    );
  },

  // Update a rating by ID
  updateRating: async (ratingId: string, value: number) => {
    return await api.put(`/ratings/${ratingId}`, { value });
  },

  // Delete a rating by ID
  deleteRating: async (ratingId: string) => {
    return await api.delete(`/ratings/${ratingId}`);
  },
};
