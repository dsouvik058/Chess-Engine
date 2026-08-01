import React, { useState } from 'react';

interface UserAvatarProps {
  src?: string;
  name?: string;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name = 'User',
  className = 'w-10 h-10 rounded-xl object-cover',
}) => {
  const fallbackUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
  const [imgSrc, setImgSrc] = useState<string>(src || fallbackUrl);
  const [hasError, setHasError] = useState<boolean>(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackUrl);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={name}
      referrerPolicy="no-referrer"
      onError={handleError}
      className={className}
    />
  );
};
