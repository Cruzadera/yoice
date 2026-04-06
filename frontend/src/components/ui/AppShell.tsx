import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
};

const AppShell: React.FC<Props> = ({ eyebrow, title, subtitle, headerAction, children }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundHaloTop} />
      <View style={styles.backgroundHaloMiddle} />
      <View style={styles.backgroundHaloBottom} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          {headerAction ? <View style={styles.headerAction}>{headerAction}</View> : null}
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        <View style={styles.card}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0d1324'
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 28
  },
  backgroundHaloTop: {
    position: 'absolute',
    top: -70,
    right: -30,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#24385f'
  },
  backgroundHaloMiddle: {
    position: 'absolute',
    top: '28%',
    left: -80,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: '#16203a'
  },
  backgroundHaloBottom: {
    position: 'absolute',
    bottom: -70,
    right: -20,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: '#1a2744'
  },
  header: {
    paddingHorizontal: 8,
    marginBottom: 18
  },
  headerAction: {
    alignSelf: 'flex-end',
    marginBottom: 12
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#9eb0da',
    marginBottom: 8
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
    color: '#f7f9ff'
  },
  subtitle: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 23,
    color: '#b7c2df',
    fontWeight: '500'
  },
  card: {
    borderRadius: 30,
    backgroundColor: '#f6f8ff',
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 18
  }
});

export default AppShell;
