import { Router } from 'express';
import { AnomalyController } from '../controllers/anomalies.controller';
import { authenticateJWT } from '../../../middleware/auth.middleware';
import { authorizeGroupAdmin } from '../../../middleware/admin.middleware';

const router = Router();
const anomalyController = new AnomalyController();

// Mounted under /anomalies
router.patch('/:id/review', authenticateJWT, authorizeGroupAdmin, anomalyController.reviewAnomaly);
router.patch('/:id/resolve', authenticateJWT, authorizeGroupAdmin, anomalyController.reviewAnomaly);

export default router;
