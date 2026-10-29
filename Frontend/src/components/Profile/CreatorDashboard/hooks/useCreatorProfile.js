import { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../../../redux/slices/authSlice';
import {
  getMyCreatorProfile,
  applyAsCreator,
  updateMyCreatorProfile,
  uploadCreatorProfileImage,
} from '../../../../api/mediaApi';

// Helper to generate a unique creator username from display name
export function generateUniqueUsername(name) {
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `${cleanName || 'creator'}_${randomSuffix}`;
}

export function useCreatorProfile(user, showToast) {
  const dispatch = useDispatch();
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Identity Form State
  const [channelIdentity, setChannelIdentity] = useState({
    name: '',
    tagline: '',
    about: '',
    username: '',
    isVerified: true,
    avatar: '',
    wallpaper: '',
  });
  const [isEditingProfileText, setIsEditingProfileText] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);

  const avatarInputRef = useRef(null);
  const wallpaperInputRef = useRef(null);

  // Fetch / Monitor Creator Profile
  useEffect(() => {
    if (!user) return undefined;
    const controller = new AbortController();
    getMyCreatorProfile({ signal: controller.signal })
      .then((profile) => {
        if (controller.signal.aborted) return;
        setCreator(profile);
        setError('');

        if (profile) {
          setChannelIdentity({
            name: profile.displayName || '',
            tagline: profile.tagline || '',
            about: profile.about || '',
            username: profile.username || (user.username ? `@${user.username}` : ''),
            isVerified: true,
            avatar: profile.avatar || '',
            wallpaper: profile.banner || '',
          });
        }

        if (profile?.applicationStatus === 'approved' && user.role !== 'creator') {
          const updatedUser = { ...user, role: 'creator' };
          localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
          dispatch(loginSuccess(updatedUser));
        }
      })
      .catch((loadError) => {
        if (!controller.signal.aborted) {
          setError(loadError.message || 'Could not load creator status.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [dispatch, refreshKey, user]);

  // Complete Onboarding Application Handler
  const handleFullApplication = async (formData) => {
    const { name, username, tagline, about, avatarFile, wallpaperFile } = formData;

    if (name.trim().length < 2) {
      setError('Channel name must be at least 2 characters.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // 1. Submit application to create or update profile record
      const application = await applyAsCreator(name.trim());

      // 2. Upload avatar and wallpaper images if provided during onboarding
      if (avatarFile) {
        await uploadCreatorProfileImage(avatarFile, 'avatar');
      }
      if (wallpaperFile) {
        await uploadCreatorProfileImage(wallpaperFile, 'banner');
      }

      // 3. Save tagline, about details, and username to the creator profile
      const updatedProfile = await updateMyCreatorProfile({
        displayName: name.trim(),
        tagline: tagline.trim(),
        about: about.trim(),
        username: username.trim(),
      });

      setCreator({ ...application, ...updatedProfile });
      if (showToast) showToast('Creator channel submitted for review!', 'green');
    } catch (submitError) {
      setError(submitError.message || 'Could not submit your creator application.');
    } finally {
      setSubmitting(false);
    }
  };

  const executeProfileImageUpload = async (event, targetProperty) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const imageType = targetProperty === 'avatar' ? 'avatar' : 'banner';
    setIsUploadingProfileImage(true);
    if (showToast) showToast('Saving profile image...', 'purple');

    try {
      const updatedCreator = await uploadCreatorProfileImage(file, imageType);
      setChannelIdentity((current) => ({
        ...current,
        [targetProperty]: (imageType === 'banner' ? updatedCreator.banner : updatedCreator.avatar) || '',
      }));
      if (showToast) {
        showToast(imageType === 'avatar' ? 'Profile photo saved.' : 'Background image saved.', 'green');
      }
    } catch (err) {
      if (showToast) showToast(err.message || 'Could not save the profile image.', 'red');
    } finally {
      setIsUploadingProfileImage(false);
    }
  };

  const handleSaveCreatorProfile = async () => {
    setIsSavingProfile(true);
    try {
      const updatedCreator = await updateMyCreatorProfile({
        displayName: channelIdentity.name.trim(),
        tagline: channelIdentity.tagline.trim(),
        about: channelIdentity.about.trim(),
      });
      setChannelIdentity((current) => ({
        ...current,
        name: updatedCreator.displayName,
        tagline: updatedCreator.tagline || '',
        about: updatedCreator.about || '',
      }));
      setIsEditingProfileText(false);
      if (showToast) showToast('Creator profile saved.', 'green');
    } catch (err) {
      if (showToast) showToast(err.message || 'Could not save creator profile.', 'red');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return {
    creator, loading, submitting, error,
    channelIdentity, setChannelIdentity,
    isEditingProfileText, setIsEditingProfileText,
    isSavingProfile, isUploadingProfileImage,
    avatarInputRef, wallpaperInputRef,
    handleFullApplication,
    executeProfileImageUpload,
    handleSaveCreatorProfile,
    checkStatus: () => {
      setLoading(true);
      setRefreshKey((k) => k + 1);
    },
  };
}