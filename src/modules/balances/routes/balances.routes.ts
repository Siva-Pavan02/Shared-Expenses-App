import { Router } from 'express';
import { BalanceController } from '../controllers/balances.controller';
import { authenticateJWT } from '../../../middleware/auth.middleware';

const router = Router({ mergeParams: true });
const balanceController = new BalanceController();

/**
 * @swagger
 * tags:
 *   name: Balances
 *   description: Group balance and settlement calculations
 */

/**
 * @swagger
 * /groups/{groupId}/balances:
 *   get:
 *     summary: Get overall group balances
 *     tags: [Balances]
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
 *         description: Group balances retrieved
 */
router.get('/', authenticateJWT, balanceController.getGroupBalances);

/**
 * @swagger
 * /groups/{groupId}/simplified-balances:
 *   get:
 *     summary: Get simplified debt settlement graph
 *     tags: [Balances]
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
 *         description: Simplified balances retrieved
 */
router.get('/simplified', authenticateJWT, balanceController.getSimplifiedBalances);

/**
 * @swagger
 * /groups/{groupId}/balances/{userId}/breakdown:
 *   get:
 *     summary: Get specific user balance breakdown
 *     tags: [Balances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User balance breakdown retrieved
 */
router.get('/:userId/breakdown', authenticateJWT, balanceController.getUserBreakdown);

export default router;
