import { Image as ExpoImage, type ImageProps } from 'expo-image';
import { useState } from 'react';
import {
  Image as ReactNativeImage,
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

const FALLBACK_IMAGE = require('@/assets/images/logo-mas-cafe.png');

type ProductImageProps = {
  uri?: string | null;
  name: string;
  style?: StyleProp<ViewStyle>;
  contentFit?: ImageProps['contentFit'];
};

/**
 * Imagen de producto compartida por todas las pantallas.
 * Conserva una reserva local si la URL remota no existe o falla, y utiliza
 * caché de memoria/disco para evitar descargas repetidas en iOS, Android y web.
 */
export default function ProductImage({
  uri,
  name,
  contentFit = 'cover',
  ...imageProps
}: ProductImageProps) {
  const normalizedUri = uri?.trim() ?? '';
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const showFallback = !normalizedUri || failedUri === normalizedUri;
  const source = showFallback ? FALLBACK_IMAGE : { uri: normalizedUri };

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.frame, imageProps.style]}>
        <ReactNativeImage
          style={showFallback ? styles.fallbackImage : styles.image}
          source={source}
          defaultSource={FALLBACK_IMAGE}
          resizeMode={showFallback || contentFit === 'contain' ? 'contain' : 'cover'}
          referrerPolicy="no-referrer"
          accessibilityLabel={`Imagen de ${name}`}
          onError={() => setFailedUri(normalizedUri)}
        />
      </View>
    );
  }

  return (
    <View style={[styles.frame, imageProps.style]}>
      <ExpoImage
        style={showFallback ? styles.fallbackImage : styles.image}
        source={source}
        placeholder={FALLBACK_IMAGE}
        placeholderContentFit="contain"
        contentFit={showFallback ? 'contain' : contentFit}
        cachePolicy="memory-disk"
        transition={160}
        recyclingKey={normalizedUri || `fallback-${name}`}
        accessibilityLabel={`Imagen de ${name}`}
        onError={() => setFailedUri(normalizedUri)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallbackImage: {
    width: '42%',
    height: '42%',
  },
});
