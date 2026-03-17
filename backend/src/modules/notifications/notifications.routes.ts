import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as notificationsController from './notifications.controller';

const router = Router();

router.use(authenticate);

router.get('/', notificationsController.handleGetNotifications);
router.put('/:id/read', notificationsController.handleMarkAsRead);
router.post('/read-all', notificationsController.handleMarkAllAsRead);

export default router;
