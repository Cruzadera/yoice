const AVATAR_COLORS = ['#4f6cff', '#ff6b6b', '#20c997', '#ffb703', '#6f42c1', '#fd7e14'];

const pickColorFromSeed = (seed: string) => {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }

  const colorIndex = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[colorIndex];
};

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

  return getGeneratedAvatarUrl(name, avatarColor || pickColorFromSeed(name || 'U'), color, size);
};
