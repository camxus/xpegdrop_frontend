import { Project } from "@/types/project";
import { api } from "./client";

export const projectsApi = {
  // Create new project with files (multipart/form-data)
  createProject: async (formData: { name: string; files: File[] }) => {
    const data = new FormData();
    data.append("name", formData.name);
    formData.files.forEach((file) => {
      data.append("files", file); // multiple files under "files"
    });
    return await api.post<Project>("/projects", data, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000, // 2 minutes
    });
  },

  // Get all projects for the authenticated user
  getProjects: async () => {
    return await api.get("/projects");
  },

  // Get single project by ID
  getProject: async (projectId: string) => {
    return await api.get(`/projects/${projectId}`);
  },

  // Update project by ID
  updateProject: async (
    projectId: string,
    data: Partial<{ name: string; description: string }>
  ) => {
    return await api.put(`/projects/${projectId}`, data);
  },

  // Delete project by ID
  deleteProject: async (projectId: string) => {
    return await api.delete(`/projects/${projectId}`);
  },

  // Get a shared project by public share URL (username + projectName)
  getProjectByShareUrl: async (
    username: string,
    projectName: string,
    email?: string
  ) => {
    return await api.get(
      `/projects/share/${username}/${encodeURIComponent(projectName)}`,
      { params: { email: email } }
    );
  },
};
