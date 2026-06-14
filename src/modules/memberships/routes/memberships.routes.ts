import { Router } from 'express';
import { MembershipController } from '../controllers/memberships.controller';
import { validateRequest } from '../../../middleware/validate.middleware';
import { authenticateJWT } from '../../../middleware/auth.middleware';
import { addMemberSchema } from '../validators/memberships.validator';

const router = Router({ mergeParams: true }); // mergeParams to access groupId
const membershipController = new MembershipController();

/**
 * @swagger
 * tags:
 *   name: Memberships
 *   description: Group membership management
 */

/**
 * @swagger
 * /groups/{groupId}/members:
 *   post:
 *     summary: Add a member to a group
 *     tags: [Memberships]
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
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *               isAdmin:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Member added successfully
 *   get:
 *     summary: List members of a group
 *     tags: [Memberships]
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
 *         description: Members retrieved
 */
router.post('/', authenticateJWT, validateRequest(addMemberSchema), membershipController.addMember);
router.get('/', authenticateJWT, membershipController.getGroupMembers);

/**
 * @swagger
 * /groups/{groupId}/members/{memberId}/leave:
 *   patch:
 *     summary: Mark a member as left
 *     tags: [Memberships]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member marked as left
 */
router.patch('/:memberId/leave', authenticateJWT, membershipController.removeMember);

export default router;
