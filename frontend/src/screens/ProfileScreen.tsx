import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import AppShell from '../components/ui/AppShell';
import FieldInput from '../components/ui/FieldInput';
import PrimaryButton from '../components/ui/PrimaryButton';
import api from '../services/api';
import { getAvatarUri } from '../utils/avatar';

type Props = {
  token: string;
  initialName?: string | null;
  initialAvatarColor?: string | null;
  initialAvatarImage?: string | null;
  onBack: () => void;
  onSaved: (params: { userName?: string | null; avatarColor?: string | null; avatarImage?: string | null }) => void;
};

const AVATAR_COLORS = ['#4f6cff', '#ff6b6b', '#20c997', '#ffb703', '#6f42c1', '#fd7e14'];

const ProfileScreen: React.FC<Props> = ({
  token,
  initialName,
  initialAvatarColor,
  initialAvatarImage,
  onBack,
  onSaved
}) => {
  const [name, setName] = useState(initialName || '');
  const [avatarColor, setAvatarColor] = useState(initialAvatarColor || AVATAR_COLORS[0]);
  const [avatarImage, setAvatarImage] = useState<string | null>(initialAvatarImage || null);
  const [loading, setLoading] = useState(false);
  const [pickingImage, setPickingImage] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (initialName) {
        return;
      }

      try {
        const { data } = await api.getMe(token);
        setName(data.name || '');
        setAvatarColor(data.avatarColor || AVATAR_COLORS[0]);
        setAvatarImage(data.avatarImage || null);
      } catch (error) {
        console.error('Error cargando perfil', error);
      }
    };

    loadProfile();
  }, [initialName, token]);

  const handlePickImage = async () => {
    setPickingImage(true);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Permiso necesario', 'Necesitamos permiso para acceder a tu galería.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];

      if (!asset.base64) {
        Alert.alert('Imagen no disponible', 'No pudimos procesar la imagen seleccionada.');
        return;
      }

      const mimeType = asset.mimeType || 'image/jpeg';
      setAvatarImage(`data:${mimeType};base64,${asset.base64}`);
    } catch (error) {
      console.error('Error seleccionando avatar', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen.');
    } finally {
      setPickingImage(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Perfil', 'El nombre es obligatorio.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.saveUserProfile(token, {
        name: name.trim(),
        avatarColor,
        avatarImage
      });

      onSaved({
        userName: data.name,
        avatarColor: data.avatarColor,
        avatarImage: data.avatarImage
      });
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'No se pudo guardar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell eyebrow="Perfil" title="Tu perfil" subtitle="Cambia tu nombre, tu color y ahora también tu foto de avatar.">
      <View style={styles.previewCard}>
        <Image
          source={{
            uri: getAvatarUri({
              name: name || 'Usuario',
              avatarColor,
              avatarImage,
              size: 120
            })
          }}
          style={styles.previewAvatar}
        />
        <Text style={styles.previewName}>{name || 'Tu nombre'}</Text>
      </View>

      <FieldInput
        label="Nombre"
        placeholder="Cómo quieres aparecer"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        autoCorrect={false}
      />

      <Text style={styles.paletteLabel}>Foto de avatar</Text>
      <PrimaryButton
        title={pickingImage ? 'Abriendo galería...' : avatarImage ? 'Cambiar foto' : 'Subir foto'}
        onPress={handlePickImage}
        loading={pickingImage}
        variant="secondary"
      />
      {avatarImage ? (
        <Pressable onPress={() => setAvatarImage(null)} style={styles.removePhotoButton}>
          <Text style={styles.removePhotoText}>Quitar foto y volver al avatar por color</Text>
        </Pressable>
      ) : null}

      <Text style={styles.paletteLabel}>Color de respaldo</Text>
      <View style={styles.paletteRow}>
        {AVATAR_COLORS.map((color) => {
          const selected = avatarColor === color;

          return (
            <Pressable
              key={color}
              onPress={() => setAvatarColor(color)}
              style={[styles.colorOption, { backgroundColor: color }, selected && styles.colorOptionSelected]}
            />
          );
        })}
      </View>

      <PrimaryButton
        title={loading ? 'Guardando...' : 'Guardar cambios'}
        onPress={handleSave}
        loading={loading}
        disabled={!name.trim()}
      />
      <PrimaryButton title="Volver" onPress={onBack} variant="secondary" style={styles.backButton} />
    </AppShell>
  );
};

const styles = StyleSheet.create({
  previewCard: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    marginBottom: 16
  },
  previewAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 12
  },
  previewName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#13203a'
  },
  paletteLabel: {
    marginBottom: 10,
    fontSize: 13,
    fontWeight: '700',
    color: '#53607f',
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  paletteRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16
  },
  colorOption: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'transparent'
  },
  colorOptionSelected: {
    borderColor: '#13203a'
  },
  removePhotoButton: {
    marginTop: 10,
    marginBottom: 16
  },
  removePhotoText: {
    textAlign: 'center',
    color: '#4a5c86',
    fontSize: 14,
    fontWeight: '700'
  },
  backButton: {
    marginTop: 10
  }
});

export default ProfileScreen;
