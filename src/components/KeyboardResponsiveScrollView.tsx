import type { PropsWithChildren } from 'react';
import { Platform, ScrollView, type ScrollViewProps } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

type KeyboardResponsiveScrollViewProps = PropsWithChildren<
  ScrollViewProps & {
    bottomOffset?: number;
    extraKeyboardSpace?: number;
  }
>;

export default function KeyboardResponsiveScrollView({
  bottomOffset = 0,
  extraKeyboardSpace = 0,
  ...props
}: KeyboardResponsiveScrollViewProps) {
  if (Platform.OS === 'web') {
    return <ScrollView {...props} />;
  }

  return (
    <KeyboardAwareScrollView
      {...props}
      bottomOffset={bottomOffset}
      extraKeyboardSpace={extraKeyboardSpace}
    />
  );
}
