"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Project } from "@/types/project";
import { projectsApi } from "@/lib/api/projectsApi";
import { S3Location } from "@/types/user";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "./useAuth";

export function useProjects() {
  const { user } = useAuth()
  const queryClient = useQueryClient();

  // Get all projects
  const projects =
    useQuery<Project[], Error>({
      queryKey: ["projects", user?.user_id],
      queryFn: () => projectsApi.getProjects(),
      enabled: !!user?.user_id,
    });

  // Get single project by id
  const getProject = useMutation({
    mutationFn: (projectId: string) => projectsApi.getProject(projectId),
    onSuccess: (data: Project) => {
      queryClient.setQueryData(["projects", data.project_id], data); // cache the project
    },
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

      return data;
    } catch (error: any) {
      const message = error.message;
      const status = error.status;
      throw { status, message };
    }
  };

  // Mutation: Create new project
  const createProject = useMutation({
    mutationFn: (formData: {
      name: string;
      files?: File[];
      file_locations?: S3Location[];
    }) => projectsApi.createProject(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Project created",
        description: "Your new project has been created successfully.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to create project",
        description: err?.message || "Something went wrong.",
        variant: "destructive",
      });
    },
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
      toast({
        title: "Project updated",
        description: "Changes have been saved successfully.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to update project",
        description: err?.message || "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  // Mutation: Delete project
  const deleteProject = useMutation({
    mutationFn: (projectId: string) => projectsApi.deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });

      toast({
        title: "Project deleted",
        description: "The project has been successfully removed.",
        variant: "default", // or "success" if you have it
      });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.message || "Failed to delete project.",
        variant: "destructive",
      });
    },
  });

  const addProjectFiles = useMutation({
    mutationFn: (payload: {
      projectId: string;
      files?: File[];
      file_locations?: S3Location[];
    }) => projectsApi.addProjectFiles(payload.projectId, {
      files: payload.files,
      file_locations: payload.file_locations,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Files added",
        description: "Files have been successfully added.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to add files",
        description: err?.message || "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  // Mutation: Remove a file from a project
  const removeProjectFile = useMutation({
    mutationFn: (payload: { projectId: string; fileName: string }) =>
      projectsApi.removeProjectFile(payload.projectId, payload.fileName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "File removed",
        description: "The file has been successfully removed.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to remove file",
        description: err?.message || "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  return {
    projects,
    getProject,
    getProjectByShareUrl,
    createProject,
    updateProject,
    deleteProject,
    addProjectFiles,
    removeProjectFile
  };
}
