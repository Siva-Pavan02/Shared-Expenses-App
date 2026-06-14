import { Router } from 'express';
import { GroupController } from '../controllers/groups.controller';
import { validateRequest } from '../../../middleware/validate.middleware';
import { authenticateJWT } from '../../../middleware/auth.middleware';
import { createGroupSchema, updateGroupSchema } from '../validators/groups.validator';
import membershipRoutes from '../../memberships/routes/memberships.routes';
import expensesRoutes from '../../expenses/routes/expenses.routes';
import settlementsRoutes from '../../settlements/routes/settlements.routes';
import importsRoutes from '../../imports/routes/imports.routes';
import balancesRoutes from '../../balances/routes/balances.routes';
import { BalanceController } from '../../balances/controllers/balances.controller';

const router = Router();
const groupController = new GroupController();
const balanceController = new BalanceController();

/**
 * @swagger
 * tags:
 *   name: Groups
 *   description: Group management
 */

/**
 * @swagger
 * /groups:
 *   post:
 *     summary: Create a new group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - baseCurrency
 *             properties:
 *               name:
 *                 type: string
 *               baseCurrency:
 *                 type: string
 *     responses:
 *       201:
 *         description: Group created
 *   get:
 *     summary: List user's groups
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Groups retrieved
 */
router.post('/', authenticateJWT, validateRequest(createGroupSchema), groupController.createGroup);
router.get('/', authenticateJWT, groupController.listUserGroups);

/**
 * @swagger
 * /groups/{id}:
 *   get:
 *     summary: Get group details
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group details retrieved
 *   patch:
 *     summary: Update group
 *     tags: [Groups]
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
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Group updated
 *   delete:
 *     summary: Delete group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group deleted
 */
router.get('/:id', authenticateJWT, groupController.getGroupDetails);
router.patch('/:id', authenticateJWT, validateRequest(updateGroupSchema), groupController.updateGroup);
router.delete('/:id', authenticateJWT, groupController.deleteGroup);

// Nested routes for memberships, expenses, settlements, and imports
router.use('/:groupId/members', membershipRoutes);
router.use('/:groupId/expenses', expensesRoutes);
router.use('/:groupId/settlements', settlementsRoutes);
router.use('/:groupId/imports', importsRoutes);
router.use('/:groupId/balances', balancesRoutes);

// Explicit route requested in assignment
router.get('/:groupId/simplified-balances', authenticateJWT, balanceController.getSimplifiedBalances);

export default router;
