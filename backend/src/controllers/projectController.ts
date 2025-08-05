import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { validationErrorHandler } from "../middleware/errorMiddleware";
import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import {
  createProjectSchema,
  updateProjectSchema,
} from "../utils/validation/projectValidation";
import { CreateProjectInput, UpdateProjectInput, Project } from "../types";
import { v4 as uuidv4 } from "uuid";
import { DropboxService } from "../utils/dropbox";
import { AuthenticatedRequest } from "../middleware/auth";
import multer from "multer";

const client = new DynamoDBClient({ region: process.env.AWS_REGION_CODE });
const PROJECTS_TABLE = process.env.DYNAMODB_PROJECTS_TABLE || "Projects";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
  },
});

export const uploadMiddleware = upload.array('files', 50); // Allow up to 50 files

export const createProject = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { error, value } = createProjectSchema.validate(req.body);
  if (error) throw validationErrorHandler(error);

  const { name, description } = value as CreateProjectInput;
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    return res.status(400).json({ error: "No files provided" });
  }

  if (!req.user?.dropbox_access_token) {
    return res.status(400).json({ error: "Dropbox access token not found. Please connect your Dropbox account." });
  }

  try {
    const projectId = uuidv4();
    const userId = req.user.user_id;
    const username = req.user.username;

    // Upload folder to Dropbox
    const dropboxService = new DropboxService(req.user.dropbox_access_token);
    
    // Convert multer files to File objects for Dropbox upload
    const dropboxFiles = files.map(file => {
      const blob = new Blob([file.buffer], { type: file.mimetype });
      return new File([blob], file.originalname, { type: file.mimetype });
    });

    const dropboxSharedLink = await dropboxService.uploadFolder(dropboxFiles, name);
    
    // Generate share URL
    const shareUrl = `${process.env.FRONTEND_URL}/${username}/${name.toLowerCase().replace(/\s+/g, '-')}`;

    // Save project to DynamoDB
    const projectData: Project = {
      project_id: projectId,
      user_id: userId,
      name,
      description: description || null,
      share_url: shareUrl,
      dropbox_folder_path: `/${name}`,
      dropbox_shared_link: dropboxSharedLink,
      created_at: new Date().toISOString(),
    };

    await client.send(
      new PutItemCommand({
        TableName: PROJECTS_TABLE,
        Item: marshall(projectData),
      })
    );

    res.status(201).json({
      message: "Project created successfully",
      project: projectData,
    });
  } catch (error: any) {
    console.error("Create project error:", error);
    res.status(500).json({ error: error.message || "Failed to create project" });
  }
});

export const getProjects = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.user_id;

    const response = await client.send(
      new ScanCommand({
        TableName: PROJECTS_TABLE,
        FilterExpression: "user_id = :userId",
        ExpressionAttributeValues: marshall({
          ":userId": userId,
        }),
      })
    );

    const projects = response.Items?.map(item => unmarshall(item)) || [];

    res.status(200).json({
      projects,
      total: projects.length,
    });
  } catch (error: any) {
    console.error("Get projects error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch projects" });
  }
});

export const getProject = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.user_id;

    const response = await client.send(
      new GetItemCommand({
        TableName: PROJECTS_TABLE,
        Key: marshall({ project_id: projectId }),
      })
    );

    if (!response.Item) {
      return res.status(404).json({ error: "Project not found" });
    }

    const project = unmarshall(response.Item);

    // Check if user owns the project
    if (project.user_id !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.status(200).json({ project });
  } catch (error: any) {
    console.error("Get project error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch project" });
  }
});

export const updateProject = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { error, value } = updateProjectSchema.validate(req.body);
  if (error) throw validationErrorHandler(error);

  try {
    const { projectId } = req.params;
    const userId = req.user.user_id;
    const { name, description } = value as UpdateProjectInput;

    // First, check if project exists and user owns it
    const getResponse = await client.send(
      new GetItemCommand({
        TableName: PROJECTS_TABLE,
        Key: marshall({ project_id: projectId }),
      })
    );

    if (!getResponse.Item) {
      return res.status(404).json({ error: "Project not found" });
    }

    const existingProject = unmarshall(getResponse.Item);

    if (existingProject.user_id !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Build update expression
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    if (name !== undefined) {
      updateExpressions.push("#name = :name");
      expressionAttributeNames["#name"] = "name";
      expressionAttributeValues[":name"] = name;

      // Update share URL if name changed
      const username = req.user.username;
      const newShareUrl = `${process.env.FRONTEND_URL}/${username}/${name.toLowerCase().replace(/\s+/g, '-')}`;
      updateExpressions.push("share_url = :shareUrl");
      expressionAttributeValues[":shareUrl"] = newShareUrl;
    }

    if (description !== undefined) {
      updateExpressions.push("description = :description");
      expressionAttributeValues[":description"] = description;
    }

    updateExpressions.push("updated_at = :updatedAt");
    expressionAttributeValues[":updatedAt"] = new Date().toISOString();

    await client.send(
      new UpdateItemCommand({
        TableName: PROJECTS_TABLE,
        Key: marshall({ project_id: projectId }),
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
        ExpressionAttributeValues: marshall(expressionAttributeValues),
      })
    );

    res.status(200).json({ message: "Project updated successfully" });
  } catch (error: any) {
    console.error("Update project error:", error);
    res.status(500).json({ error: error.message || "Failed to update project" });
  }
});

export const deleteProject = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.user_id;

    // First, check if project exists and user owns it
    const getResponse = await client.send(
      new GetItemCommand({
        TableName: PROJECTS_TABLE,
        Key: marshall({ project_id: projectId }),
      })
    );

    if (!getResponse.Item) {
      return res.status(404).json({ error: "Project not found" });
    }

    const project = unmarshall(getResponse.Item);

    if (project.user_id !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Delete project from DynamoDB
    await client.send(
      new DeleteItemCommand({
        TableName: PROJECTS_TABLE,
        Key: marshall({ project_id: projectId }),
      })
    );

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error: any) {
    console.error("Delete project error:", error);
    res.status(500).json({ error: error.message || "Failed to delete project" });
  }
});

// Public endpoint to get project by share URL
export const getProjectByShareUrl = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { username, projectName } = req.params;

    const response = await client.send(
      new ScanCommand({
        TableName: PROJECTS_TABLE,
        FilterExpression: "contains(share_url, :shareUrlPart)",
        ExpressionAttributeValues: marshall({
          ":shareUrlPart": `/${username}/${projectName}`,
        }),
      })
    );

    if (!response.Items || response.Items.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    const project = unmarshall(response.Items[0]);

    // Return public project info (without sensitive data)
    const publicProject = {
      name: project.name,
      description: project.description,
      dropbox_shared_link: project.dropbox_shared_link,
      created_at: project.created_at,
    };

    res.status(200).json({ project: publicProject });
  } catch (error: any) {
    console.error("Get project by share URL error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch project" });
  }
});