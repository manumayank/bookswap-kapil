import { Router } from 'express';
import { authenticateAdmin } from '../../middleware/adminAuth';
import * as adminController from './admin.controller';

const router = Router();

router.use(authenticateAdmin);

router.get('/stats', adminController.handleGetStats);
router.get('/users', adminController.handleGetUsers);
router.get('/listings', adminController.handleGetListings);

export default router;
