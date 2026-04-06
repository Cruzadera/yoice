import React from 'react';
import { Image, Pressable, StyleSheet } from 'react-native';
import { getAvatarUri } from '../../utils/avatar';

type Props = {
  name?: string | null;
  avatarColor?: string | null;
  avatarImage?: string | null;
  onPress: () => void;
};

const ProfileIconButton: React.FC<Props> = ({ name, avatarColor, avatarImage, onPress }) => {
  return (
    <Pressable onPress={onPress} style={styles.button}>
      <Image
        source={{ uri: getAvatarUri({ name: name || 'Usuario', avatarColor, avatarImage, size: 88 }) }}
        style={styles.avatar}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ffffff33'
  },
  avatar: {
    width: '100%',
    height: '100%'
  }
});

export default ProfileIconButton;
