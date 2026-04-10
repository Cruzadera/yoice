const AVATAR_COLORS = ['#4f6cff', '#ff6b6b', '#20c997', '#ffb703', '#6f42c1', '#fd7e14'];

export const pickRandomAvatarColor = () =>
  AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
