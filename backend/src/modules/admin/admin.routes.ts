import { Router } from 'express';
import { authenticateAdmin } from '../../middleware/adminAuth';
import { validate } from '../../middleware/validate';
import { rejectListingDto, createSchoolDto, updateSchoolDto } from './admin.dto';
import * as adminController from './admin.controller';

const router = Router();

router.use(authenticateAdmin);

router.get('/stats', adminController.handleGetStats);
router.get('/users', adminController.handleGetUsers);
router.get('/listings', adminController.handleGetListings);
router.get('/listings/pending', adminController.handleGetPendingListings);
router.put('/listings/:id/approve', adminController.handleApproveListing);
router.put('/listings/:id/reject', validate(rejectListingDto), adminController.handleRejectListing);

// Requests
router.get('/requests', adminController.handleGetRequests);

// Schools
router.get('/schools', adminController.handleGetSchools);
router.post('/schools', validate(createSchoolDto), adminController.handleCreateSchool);
router.put('/schools/:id', validate(updateSchoolDto), adminController.handleUpdateSchool);

export default router;
