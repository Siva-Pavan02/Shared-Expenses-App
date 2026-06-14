import { Router } from 'express';
import { AnomalyController } from '../controllers/anomalies.controller';
import { authenticateJWT } from '../../../middleware/auth.middleware';
import { authorizeGroupAdmin } from '../../../middleware/admin.middleware';

const router = Router({ mergeParams: true });
const anomalyController = new AnomalyController();

// Mounted under /imports/:importJobId
router.post('/analyze', authenticateJWT, authorizeGroupAdmin, anomalyController.analyzeImport);
router.get('/anomalies', authenticateJWT, anomalyController.getAnomalies);

export default router;
