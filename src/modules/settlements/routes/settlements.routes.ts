import { Router } from 'express';
import { SettlementController } from '../controllers/settlements.controller';
import { validateRequest } from '../../../middleware/validate.middleware';
import { authenticateJWT } from '../../../middleware/auth.middleware';
import { createSettlementSchema } from '../validators/settlements.validator';

const router = Router({ mergeParams: true });
const settlementController = new SettlementController();

/**
 * @swagger
 * tags:
 *   name: Settlements
 *   description: Peer-to-peer debt settlements
 */

/**
 * @swagger
 * /groups/{groupId}/settlements:
 *   post:
 *     summary: Create a settlement
 *     tags: [Settlements]
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
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - toUserId
 *               - amount
 *               - currency
 *               - date
 *             properties:
 *               toUserId:
 *                 type: string
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Settlement created
 *   get:
 *     summary: List group settlements
 *     tags: [Settlements]
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
 *         description: Settlements retrieved
 */
router.post('/', authenticateJWT, validateRequest(createSettlementSchema), settlementController.createSettlement);
router.get('/', authenticateJWT, settlementController.listGroupSettlements);

/**
 * @swagger
 * /groups/{groupId}/settlements/{id}:
 *   get:
 *     summary: Get settlement details
 *     tags: [Settlements]
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
 *         description: Settlement details retrieved
 *   delete:
 *     summary: Delete settlement
 *     tags: [Settlements]
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
 *         description: Settlement deleted
 */
router.get('/:id', authenticateJWT, settlementController.getSettlement);
router.delete('/:id', authenticateJWT, settlementController.deleteSettlement);

export default router;
