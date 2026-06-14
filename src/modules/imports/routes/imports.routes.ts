import { Router } from 'express';
import multer from 'multer';
import { ImportController } from '../controllers/imports.controller';
import { authenticateJWT } from '../../../middleware/auth.middleware';
import { authorizeGroupAdmin } from '../../../middleware/admin.middleware';

const router = Router({ mergeParams: true });
const importController = new ImportController();

import importAnomaliesRoutes from '../../anomalies/routes/import-anomalies.routes';

// Setup multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

/**
 * @swagger
 * tags:
 *   name: Imports
 *   description: CSV expense import jobs
 */

/**
 * @swagger
 * /groups/{groupId}/imports/upload:
 *   post:
 *     summary: Upload a CSV file
 *     tags: [Imports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: File uploaded and parsing started
 */
router.post('/upload', authenticateJWT, authorizeGroupAdmin, upload.single('file'), importController.uploadCsv);

/**
 * @swagger
 * /groups/{groupId}/imports:
 *   get:
 *     summary: List group imports
 *     tags: [Imports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Import jobs retrieved
 */
router.get('/', authenticateJWT, importController.listGroupImports);

/**
 * @swagger
 * /groups/{groupId}/imports/{id}:
 *   get:
 *     summary: Get import details
 *     tags: [Imports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Import job retrieved
 */
router.get('/:id', authenticateJWT, importController.getImportJob);

// Report and Finalization
/**
 * @swagger
 * /groups/{groupId}/imports/{id}/report:
 *   get:
 *     summary: Get import report
 *     tags: [Imports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Import report retrieved
 */
router.get('/:id/report', authenticateJWT, importController.getReport);

/**
 * @swagger
 * /groups/{groupId}/imports/{id}/finalize:
 *   post:
 *     summary: Finalize an import job
 *     tags: [Imports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Import job finalized
 */
router.post('/:id/finalize', authenticateJWT, authorizeGroupAdmin, importController.finalizeImport);

// Nested anomalies router
router.use('/:importJobId', importAnomaliesRoutes);

export default router;
