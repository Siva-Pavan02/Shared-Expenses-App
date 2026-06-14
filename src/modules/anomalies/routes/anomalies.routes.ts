import { Router } from 'express';
import { AnomalyController } from '../controllers/anomalies.controller';
import { authenticateJWT } from '../../../middleware/auth.middleware';
import { authorizeGroupAdmin } from '../../../middleware/admin.middleware';

const router = Router();
const anomalyController = new AnomalyController();

// Mounted under /anomalies
/**
 * @swagger
 * tags:
 *   name: Anomalies
 *   description: Import anomaly review and resolution
 */

/**
 * @swagger
 * /anomalies/{id}/review:
 *   patch:
 *     summary: Review and resolve an anomaly
 *     tags: [Anomalies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [APPROVE, REJECT]
 *               resolutionAction:
 *                 type: object
 *     responses:
 *       200:
 *         description: Anomaly reviewed
 */
router.patch('/:id/review', authenticateJWT, authorizeGroupAdmin, anomalyController.reviewAnomaly);
router.patch('/:id/resolve', authenticateJWT, authorizeGroupAdmin, anomalyController.reviewAnomaly);

export default router;
