import { useState } from 'react';
import { getMySubscriptions, setCreatorSubscribed } from '../../../../api/subscriptionsApi.js';

export default function useCreatorSubscriptions(showToast) {
  const [isOpen, setIsOpen] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unsubscribingCreatorId, setUnsubscribingCreatorId] = useState(null);

  const openSubscriptions = async () => {
    setIsOpen(true);
    setIsLoading(true);
    try {
      const items = await getMySubscriptions();
      setSubscriptions(items.map(({ creatorId }) => ({
        id: creatorId?._id,
        name: creatorId?.displayName || 'Creator',
        avatar: creatorId?.avatar || '',
      })).filter((item) => item.id));
    } catch (error) {
      setSubscriptions([]);
      setIsOpen(false);
      showToast(error.message || 'Could not load your subscriptions.', 'red');
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async (creatorId) => {
    if (!creatorId || unsubscribingCreatorId) return;
    if (!window.confirm('Unsubscribe from this creator?')) return;

    setUnsubscribingCreatorId(creatorId);
    try {
      await setCreatorSubscribed(creatorId, false);
      setSubscriptions((current) => current.filter(
        (item) => String(item.id) !== String(creatorId),
      ));
      showToast('Unsubscribed from creator.', 'green');
    } catch (error) {
      showToast(error.message || 'Could not update your subscription.', 'red');
    } finally {
      setUnsubscribingCreatorId(null);
    }
  };

  return {
    isOpen,
    setIsOpen,
    subscriptions,
    isLoading,
    unsubscribingCreatorId,
    openSubscriptions,
    unsubscribe,
  };
}
