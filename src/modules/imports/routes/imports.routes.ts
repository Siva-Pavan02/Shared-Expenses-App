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

// We map this route directly on /imports and expect groupId in the FormData
router.post('/upload', authenticateJWT, authorizeGroupAdmin, upload.single('file'), importController.uploadCsv);

// We can also support listing all imports for a group via /groups/:groupId/imports
router.get('/', authenticateJWT, importController.listGroupImports);

// Details for a specific import job
router.get('/:id', authenticateJWT, importController.getImportJob);

// Report and Finalization
router.get('/:id/report', authenticateJWT, importController.getReport);
router.post('/:id/finalize', authenticateJWT, authorizeGroupAdmin, importController.finalizeImport);

// Nested anomalies router
router.use('/:importJobId', importAnomaliesRoutes);

export default router;
