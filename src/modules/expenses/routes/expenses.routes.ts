import { Router } from 'express';
import { ExpenseController } from '../controllers/expenses.controller';
import { validateRequest } from '../../../middleware/validate.middleware';
import { authenticateJWT } from '../../../middleware/auth.middleware';
import { createExpenseSchema } from '../validators/expenses.validator';

const router = Router({ mergeParams: true });
const expenseController = new ExpenseController();

/**
 * @swagger
 * tags:
 *   name: Expenses
 *   description: Group expense management
 */

/**
 * @swagger
 * /groups/{groupId}/expenses:
 *   post:
 *     summary: Create an expense
 *     tags: [Expenses]
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
 *               - description
 *               - amount
 *               - currency
 *               - date
 *               - splitType
 *             properties:
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               splitType:
 *                 type: string
 *                 enum: [EQUAL, PERCENTAGE, SHARE, UNEQUAL]
 *               splitDetails:
 *                 type: object
 *                 additionalProperties:
 *                   type: number
 *     responses:
 *       201:
 *         description: Expense created
 *   get:
 *     summary: List expenses
 *     tags: [Expenses]
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
 *         description: Expenses retrieved
 */
router.post('/', authenticateJWT, validateRequest(createExpenseSchema), expenseController.createExpense);
router.get('/', authenticateJWT, expenseController.listGroupExpenses);

/**
 * @swagger
 * /groups/{groupId}/expenses/{expenseId}:
 *   get:
 *     summary: Get expense details
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: expenseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Expense details retrieved
 *   delete:
 *     summary: Delete expense
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: expenseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Expense deleted
 */
router.get('/:expenseId', authenticateJWT, expenseController.getExpense);
router.delete('/:expenseId', authenticateJWT, expenseController.deleteExpense);
// PATCH logic omitted for brevity as per instructions, but route placeholder exists
// router.patch('/:expenseId', authenticateJWT, validateRequest(updateExpenseSchema), expenseController.updateExpense);

export default router;
