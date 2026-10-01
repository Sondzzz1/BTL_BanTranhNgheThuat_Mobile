import React, { useEffect, useState } from 'react';
import { Image, ImageSourcePropType, ImageStyle, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

interface ArtworkImageProps {
  source?: ImageSourcePropType;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  accessibilityLabel?: string;
}

export default function ArtworkImage({
  source,
  style,
  containerStyle,
  resizeMode = 'cover',
  accessibilityLabel = 'Ảnh nghệ thuật',
}: ArtworkImageProps) {
  const [failed, setFailed] = useState(!source);

  useEffect(() => {
    setFailed(!source);
  }, [source]);

  return (
    <View style={[styles.container, containerStyle]}>
      {!failed && source ? (
        <Image
          source={source}
          style={[styles.image, style]}
          resizeMode={resizeMode}
          accessibilityLabel={accessibilityLabel}
          onError={() => setFailed(true)}
        />
      ) : (
        <View style={[styles.placeholder, style]} accessibilityLabel="Ảnh đang được cập nhật">
          <Text style={styles.placeholderIcon}>▧</Text>
          <Text style={styles.placeholderText}>Ảnh đang được cập nhật</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#e8e1d6',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8e1d6',
    padding: 12,
  },
  placeholderIcon: {
    color: '#8b7358',
    fontSize: 30,
    lineHeight: 34,
  },
  placeholderText: {
    marginTop: 4,
    color: '#6f6252',
    fontSize: 12,
    textAlign: 'center',
  },
});
