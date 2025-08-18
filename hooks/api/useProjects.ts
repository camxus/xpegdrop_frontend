"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Project } from "@/types/project";
import { projectsApi } from "@/lib/api/projectsApi";
import { ApiError } from "next/dist/server/api-utils";

export function useProjects(userId?: string) {
  const queryClient = useQueryClient();

  // Get single project by share URL (public route)
  const getProject = async (projectId: string) =>
    useQuery<Project[], Error>({
      queryKey: ["projects", userId],
      queryFn: () => projectsApi.getProject(projectId),
      enabled: !!userId,
    });

  const getProjects = async () =>
    useQuery<Project[], Error>({
      queryKey: ["projects", userId],
      queryFn: () => projectsApi.getProjects(),
      enabled: !!userId,
    });

  // Get single project by share URL (public route)
  const getProjectByShareUrl = async (
    username: string,
    projectName: string,
    email?: string
  ) => {
    try {
      const data = await projectsApi.getProjectByShareUrl(
        username,
        projectName,
        email
      );

      return data; // the project data
    } catch (error: any) {
      const err = error;

      // Extract the API error message if available
      const message = err.message;
      const status = err.status;

      // Throw a structured error
      throw { status, message };
    }
  };

  // Mutation: Create new project
  const createProject = useMutation({
    mutationFn: (formData: { name: string; files: File[] }) =>
      projectsApi.createProject(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err: any) => {},
  });

  // Mutation: Update project
  const updateProject = useMutation({
    mutationFn: ({
      projectId,
      data,
    }: {
      projectId: string;
      data: Partial<Project>;
    }) => projectsApi.updateProject(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err: any) => {},
  });

  // Mutation: Delete project
  const deleteProject = useMutation({
    mutationFn: (projectId: string) => projectsApi.deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err: any) => {},
  });

  return {
    getProject,
    getProjects,
    getProjectByShareUrl,
    createProject,
    updateProject,
    deleteProject,
  };
}
