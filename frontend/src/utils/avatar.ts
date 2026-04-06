export const getGeneratedAvatarUrl = (
  name: string,
  background = '4f6cff',
  color = 'ffffff',
  size = 96
) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=${background.replace('#', '')}&color=${color.replace('#', '')}&rounded=true&size=${size}`;

export const getAvatarUri = ({
  name,
  avatarImage,
  avatarColor,
  color = 'ffffff',
  size = 96
}: {
  name: string;
  avatarImage?: string | null;
  avatarColor?: string | null;
  color?: string;
  size?: number;
}) => {
  if (avatarImage) {
    return avatarImage;
  }

  return getGeneratedAvatarUrl(name, avatarColor || '#4f6cff', color, size);
};
