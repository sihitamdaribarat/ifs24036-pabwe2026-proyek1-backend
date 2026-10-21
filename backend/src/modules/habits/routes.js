import { Router } from 'express';
import {
  getHabits,
  createHabit,
  getHabitById,
  updateHabit,
  archiveHabit,
  restoreHabit,
  getTodayDashboard,
} from './controller.js';
import {
  createLog,
  deleteLog,
  getLogs,
  getHabitStreakInfo,
} from '../logs/controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { createHabitSchema, updateHabitSchema } from './schema.js';
import { createLogSchema } from '../logs/schema.js';

const router = Router();

// Habits & Dashboard routes (all authenticated)
router.use(authenticate);

router.get('/dashboard/today', getTodayDashboard);

router.get('/habits', getHabits);
router.post('/habits', validate(createHabitSchema), createHabit);
router.get('/habits/:habitId', getHabitById);
router.patch('/habits/:habitId', validate(updateHabitSchema), updateHabit);
router.delete('/habits/:habitId', archiveHabit);
router.post('/habits/:habitId/restore', restoreHabit);

// Habit logs routes
router.post('/habits/:habitId/logs', validate(createLogSchema), createLog);
router.delete('/habits/:habitId/logs/:logDate', deleteLog);
router.get('/habits/:habitId/logs', getLogs);
router.get('/habits/:habitId/streak', getHabitStreakInfo);

export default router;
