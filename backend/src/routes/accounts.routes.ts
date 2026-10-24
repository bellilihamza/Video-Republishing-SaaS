import { Router } from 'express';
import {
  getAccounts,
  disconnectAccount,
  getAccountStatus,
} from '../controllers/accounts.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All account routes require authentication
router.use(authenticate);

// GET /api/accounts - List connected accounts
router.get('/', getAccounts);

// GET /api/accounts/status - Platform connection status
router.get('/status', getAccountStatus);

// DELETE /api/accounts/:id - Disconnect account
router.delete('/:id', disconnectAccount);

export default router;
