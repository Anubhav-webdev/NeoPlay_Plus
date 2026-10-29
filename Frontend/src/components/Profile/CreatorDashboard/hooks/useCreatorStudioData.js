import { useEffect, useState } from 'react';
import { addCommentReply, getMyCreatorComments } from '../../../../api/commentsApi.js';
import {
  getContentCategories,
  getMyContent,
  getMyCreatorAnalytics,
} from '../../../../api/mediaApi.js';
import { mapContentToCatalog } from '../contentCatalogUtils.js';

export default function useCreatorStudioData(user, showToast) {
  const [contentCatalog, setContentCatalog] = useState([]);
  const [categories, setCategories] = useState([]);
  const [comments, setComments] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    getMyContent({ signal: controller.signal })
      .then((items) => {
        if (!controller.signal.aborted) {
          setContentCatalog(items.map((item) => mapContentToCatalog(item)));
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          showToast(error.message || 'Could not load your content.', 'red');
        }
      });

    return () => controller.abort();
  }, [showToast]);

  useEffect(() => {
    const controller = new AbortController();
    getContentCategories({ signal: controller.signal })
      .then((items) => {
        if (!controller.signal.aborted) setCategories(items || []);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          showToast(error.message || 'Could not load content categories.', 'red');
        }
      });

    return () => controller.abort();
  }, [showToast]);

  useEffect(() => {
    const controller = new AbortController();
    getMyCreatorAnalytics({ signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setAnalytics(result);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          showToast(error.message || 'Could not load creator analytics.', 'red');
        }
      });

    getMyCreatorComments({ signal: controller.signal })
      .then((items) => {
        if (controller.signal.aborted) return;
        const currentUserId = String(user.id || user._id || '');
        setComments(items.map((comment) => {
          const author = comment.userId || {};
          return {
            id: comment._id,
            type: String(comment.contentId?.type || '').toLowerCase(),
            author: author.name || author.username || 'User',
            handle: author.username ? `@${author.username}` : '',
            avatar: author.avatar || '',
            text: comment.text,
            assetTitle: comment.contentId?.title || 'Published content',
            replies: (comment.replies || []).map((reply) => ({
              ...reply,
              isCreatorReply:
                String(reply.userId?._id || reply.userId || '') === currentUserId,
            })),
          };
        }));
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          showToast(error.message || 'Could not load creator comments.', 'red');
        }
      });

    return () => controller.abort();
  }, [showToast, user]);

  const submitReplyToComment = async (commentId, text) => {
    const replyText = String(text || '').trim();
    if (!replyText) return false;

    try {
      const reply = await addCommentReply(commentId, replyText);
      setComments((current) => current.map((comment) => (
        comment.id === commentId
          ? { ...comment, replies: [...comment.replies, { ...reply, isCreatorReply: true }] }
          : comment
      )));
      showToast('Reply posted.', 'blue');
      return true;
    } catch (error) {
      showToast(error.message || 'Could not post reply.', 'red');
      return false;
    }
  };

  return {
    contentCatalog,
    setContentCatalog,
    categories,
    comments,
    analytics,
    submitReplyToComment,
  };
}
