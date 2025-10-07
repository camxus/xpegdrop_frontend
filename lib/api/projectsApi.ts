import { Project } from "@/types/project";
import { api } from "./client";
import { S3Location } from "@/types/user";

export const projectsApi = {
  // Create new project with files (multipart/form-data)
  createProject: async (formData: { name: string; files?: File[], file_locations?: S3Location[] }) => {
    const data = new FormData();
    data.append("name", formData.name);
    if (formData.file_locations) {
      const fileLocations = formData.file_locations.map((location) =>
        location
      );
      data.append("file_locations", JSON.stringify(fileLocations)); // multiple files under "file_locations"
    }
    if (formData.files) formData.files.forEach((file) => {
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
    data: Partial<Project>
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

  addProjectFiles: async (
    projectId: string,
    formData: { files?: File[]; file_locations?: S3Location[] }
  ) => {
    const data = new FormData();

    if (formData.file_locations) {
      data.append("file_locations", JSON.stringify(formData.file_locations));
    }

    if (formData.files) {
      formData.files.forEach((file) => {
        data.append("files", file);
      });
    }

    return await api.post(`/projects/${projectId}/files`, data, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000, // 2 minutes
    });
  },

  // Remove a single file from a project by file name
  removeProjectFile: async (projectId: string, file_name: string) => {
    return await api.delete(`/projects/${projectId}/files/${encodeURIComponent(file_name)}`);
  },
};
