import { api } from "./client";

export class Rating {
  rating_id?: string = undefined;
  project_id: string = "";
  image_name: string = "";
  user_id: string = ""
  value: number = 0;
  author?: { first_name: string, last_name: string }
}

export const ratingsApi = {
  // Create new rating (anonymous or authenticated)
  createRating: async (rating: {
    project_id: string;
    image_name: string;
    value: number;
    author?: { first_name: string, last_name: string }
  }) => {
    return await api.post<Rating>("/ratings", rating);
  },

  // Get all ratings for a project
  getRatings: async (projectId: string) => {
    return await api.get<{ ratings: Rating[] }>(
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
