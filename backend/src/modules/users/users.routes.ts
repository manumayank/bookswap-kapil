import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { registerUserDto, updateUserDto, addChildDto, updateChildDto } from './users.dto';
import * as usersController from './users.controller';

const router = Router();

router.post('/register', validate(registerUserDto), usersController.handleRegister);

// Protected routes
router.get('/me', authenticate, usersController.handleGetMe);
router.put('/me', authenticate, validate(updateUserDto), usersController.handleUpdateMe);
router.post('/me/children', authenticate, validate(addChildDto), usersController.handleAddChild);
router.put('/me/children/:id', authenticate, validate(updateChildDto), usersController.handleUpdateChild);
router.delete('/me/children/:id', authenticate, usersController.handleDeleteChild);

export default router;
