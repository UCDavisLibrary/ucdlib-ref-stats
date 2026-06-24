import express from 'express';
import authRoutes from './routes/auth.js';
import assignment from './routes/assignment.js';
import picklist from './routes/picklist.js';
import form from './routes/form.js';
import field from './routes/field.js';
import formEntry from './routes/form-entry.js';

import authenticate from './utils/authenticate.js';

const router = express.Router();

// Require authentication for all requests after this point. 
// This will set req.auth with the token and userInfo
router.use(async (req, res, next) => {
  await authenticate(req, res, next);
});

router.use('/auth', authRoutes);
router.use('/assignment', assignment);
router.use('/field', field);
router.use('/form', form);
router.use('/picklist', picklist);
router.use('/form-entry', formEntry);

export default router;