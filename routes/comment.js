import express from 'express';
import {
    createComment,
    replyToComment,
    updateComment,
    deleteComment,
    getReplies,
    getCommentsOfVideo,
    getCommentById
} from '../controllers/comment.js';
import isAuth from '../middlewares/isAuth.js';
import {
    validateRequest,
    createCommentSchema,
    replyToCommentSchema,
    updateCommentSchema,
    videoIdParamSchema,
    commentIdParamSchema,
    paginationQuerySchema,
} from '../validation/commentValidation.js';

const router = express.Router();

router.get("/:commentId", validateRequest(commentIdParamSchema, 'params'), getCommentById);

router.get("/video/:videoId", 
    validateRequest(videoIdParamSchema, 'params'),
    validateRequest(paginationQuerySchema, 'query'),
    getCommentsOfVideo
);

router.post("/:videoId", 
    isAuth, 
    validateRequest(videoIdParamSchema, 'params'),
    validateRequest(createCommentSchema, 'body'),
    createComment
);

router.post("/reply/:commentId", 
    isAuth, 
    validateRequest(commentIdParamSchema, 'params'),
    validateRequest(replyToCommentSchema, 'body'),
    replyToComment
);

router.patch("/:commentId", 
    isAuth, 
    validateRequest(commentIdParamSchema, 'params'),
    validateRequest(updateCommentSchema, 'body'),
    updateComment
);

router.delete("/:commentId", 
    isAuth, 
    validateRequest(commentIdParamSchema, 'params'),
    deleteComment
);

router.get("/reply/:commentId", 
    validateRequest(commentIdParamSchema, 'params'),
    validateRequest(paginationQuerySchema, 'query'),
    getReplies
);

export default router;