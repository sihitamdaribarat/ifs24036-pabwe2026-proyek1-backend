import { Router } from 'express';
import {
  getPosts,
  createPost,
  getPostById,
  updatePost,
  deletePost,
  getComments,
  createComment,
  deleteComment,
  setReaction,
  deleteReaction,
  getPublicProfile,
} from './controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { postRateLimiter, commentRateLimiter } from '../../middlewares/rateLimit.js';
import {
  createPostSchema,
  updatePostSchema,
  createCommentSchema,
  reactionSchema,
} from './schema.js';

const router = Router();

// All community routes require authentication (🔒)
router.use(authenticate);

// Public profile of user
router.get('/u/:username', getPublicProfile);

// Posts
router.get('/posts', getPosts);
router.post('/posts', postRateLimiter, validate(createPostSchema), createPost);
router.get('/posts/:postId', getPostById);
router.patch('/posts/:postId', validate(updatePostSchema), updatePost);
router.delete('/posts/:postId', deletePost);

// Comments
router.get('/posts/:postId/comments', getComments);
router.post('/posts/:postId/comments', commentRateLimiter, validate(createCommentSchema), createComment);
router.delete('/comments/:commentId', deleteComment);

// Reactions
router.put('/posts/:postId/reaction', validate(reactionSchema), setReaction);
router.delete('/posts/:postId/reaction', deleteReaction);

export default router;
