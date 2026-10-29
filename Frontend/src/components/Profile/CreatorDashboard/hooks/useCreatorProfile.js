import { useRef, useState } from 'react';
import {
  updateMyCreatorProfile,
  uploadCreatorProfileImage,
} from '../../../../api/mediaApi.js';

export default function useCreatorProfile(creator, user, showToast) {
  const [channelIdentity, setChannelIdentity] = useState(() => ({
    name: creator.displayName || '',
    tagline: creator.tagline || '',
    about: creator.about || '',
    username: user.username ? `@${user.username}` : '',
    avatar: creator.avatar || user.avatar || '',
    wallpaper: creator.banner || '',
  }));
  const [isEditingProfileText, setIsEditingProfileText] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const avatarInputRef = useRef(null);
  const wallpaperInputRef = useRef(null);

  const executeProfileImageUpload = async (event, targetProperty) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const imageType = targetProperty === 'avatar' ? 'avatar' : 'banner';
    setIsUploadingProfileImage(true);
    try {
      const updatedCreator = await uploadCreatorProfileImage(file, imageType);
      setChannelIdentity((current) => ({
        ...current,
        [targetProperty]: imageType === 'banner'
          ? updatedCreator.banner || ''
          : updatedCreator.avatar || '',
      }));
      showToast(imageType === 'avatar' ? 'Profile photo saved.' : 'Background image saved.', 'green');
    } catch (error) {
      showToast(error.message || 'Could not save the profile image.', 'red');
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
      showToast('Creator profile saved.', 'green');
    } catch (error) {
      showToast(error.message || 'Could not save creator profile.', 'red');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return {
    channelIdentity,
    setChannelIdentity,
    isEditingProfileText,
    setIsEditingProfileText,
    isSavingProfile,
    isUploadingProfileImage,
    avatarInputRef,
    wallpaperInputRef,
    executeProfileImageUpload,
    handleSaveCreatorProfile,
  };
}
