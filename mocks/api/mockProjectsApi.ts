import { Project } from "@/types/project";
import { S3Location } from "@/types/user";

import { StorageProvider } from "@/types";
import { mockTenantProjects } from "../projects";
// Utility to simulate network delay
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const mockProjectsApi = {
  createProject: async (formData: {
    name: string;
    files?: File[];
    file_locations?: S3Location[];
    storage_provider: StorageProvider;
  }): Promise<Project> => {
    await delay(500); // simulate network delay
    const newProject: Project = {
      project_id: `proj_${Math.random().toString(36).substr(2, 5)}`,
      tenant_id: "tenant_001",
      user_id: "user_001",
      name: formData.name,
      share_url: `/share/${formData.name}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_public: false,
      can_download: true,
      approved_emails: [],
      approved_users: [],
      approved_tenant_users: [],
      status: "created",
      dropbox_folder_path: undefined,
      dropbox_shared_link: undefined,
      b2_folder_path: undefined,
      b2_shared_link: undefined,
      description: undefined,
    };
    mockTenantProjects.push(newProject);
    return newProject;
  },

  getProjects: async (): Promise<Project[]> => {
    await delay(300);
    return [...mockTenantProjects];
  },

  getTenantProjects: async (tenantId: string): Promise<Project[]> => {
    await delay(300);
    return mockTenantProjects.filter((p) => p.tenant_id === tenantId);
  },

  getProject: async (projectId: string): Promise<Project | undefined> => {
    await delay(200);
    return mockTenantProjects.find((p) => p.project_id === projectId);
  },

  updateProject: async (
    projectId: string,
    data: Partial<Project>
  ): Promise<Project | undefined> => {
    await delay(300);
    const project = mockTenantProjects.find((p) => p.project_id === projectId);
    if (!project) return undefined;
    Object.assign(project, data, { updated_at: new Date().toISOString() });
    return project;
  },

  deleteProject: async (projectId: string): Promise<void> => {
    await delay(200);
    const index = mockTenantProjects.findIndex((p) => p.project_id === projectId);
    if (index !== -1) mockTenantProjects.splice(index, 1);
  },

  getProjectByShareUrl: async (
    username: string,
    projectName: string,
    email?: string
  ): Promise<Project | undefined> => {
    await delay(200);
    return mockTenantProjects.find((p) => p.name === projectName);
  },

  getTenantProjectByShareUrl: async (
    tenantHandle: string,
    username: string,
    projectName: string,
    email?: string
  ): Promise<Project | undefined> => {
    await delay(200);
    return mockTenantProjects.find(
      (p) => p.tenant_id === tenantHandle && p.name === projectName
    );
  },

  addProjectFiles: async (
    projectId: string,
    formData: { files?: File[]; file_locations?: S3Location[] }
  ): Promise<Project | undefined> => {
    await delay(400);
    const project = mockTenantProjects.find((p) => p.project_id === projectId);
    if (!project) return undefined;
    // Just append mock files info
    if (formData.file_locations) {
      project.dropbox_folder_path = formData.file_locations[0]?.key;
    }
    return project;
  },

  removeProjectFile: async (
    projectId: string,
    fileName: string
  ): Promise<Project | undefined> => {
    await delay(300);
    const project = mockTenantProjects.find((p) => p.project_id === projectId);
    if (!project) return undefined;
    if (project.dropbox_folder_path === fileName) project.dropbox_folder_path = undefined;
    return project;
  },
};
