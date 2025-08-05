import express from 'express';
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  getProjectByShareUrl,
  uploadMiddleware,
} from '../controllers/projectController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Protected routes (require authentication)
router.use(authenticate);
router.post('/', uploadMiddleware, createProject);
router.get('/', getProjects);
router.get('/:projectId', getProject);
router.put('/:projectId', updateProject);
router.delete('/:projectId', deleteProject);

// Public route for share URLs
router.get('/share/:username/:projectName', getProjectByShareUrl);

export default router;