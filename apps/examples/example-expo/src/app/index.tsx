import { Link } from 'expo-router';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAnimatedUITheme } from 'uitheme-rn/transitions';
import { UIColorThemeSelector, UIThemeSelector } from 'uitheme-rn/expo';
import { tokens } from '@/theme';

export default function AppearanceScreen() {
  const {
    colors,
    theme,
    resolvedTheme,
    colorTheme,
    palettes,
    setTheme,
    setColorTheme,
    isTransitioning,
  } = useAnimatedUITheme();

  const insets = useSafeAreaInsets();

  return (
    <Animated.ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{
        backgroundColor: colors.background,
      }}
      contentContainerStyle={{
        padding: tokens.spacing.md,
        paddingBottom: insets.bottom + tokens.spacing.xxl,
        gap: tokens.spacing.lg,
      }}
    >
      <Animated.Text
        selectable
        style={{
          ...tokens.typography.body,
          color: colors.secondaryText,
        }}
      >
        Choose how UI-Theme looks on your device.
      </Animated.Text>
      <Animated.View
        style={{
          backgroundColor: colors.surface,
          borderRadius: tokens.radius.md,
          borderCurve: 'continuous',
        }}
      >
        <UIThemeSelector
          disabled={isTransitioning}
          onValueChange={(value) => {
            void setTheme(value);
          }}
        />
        <Animated.View
          style={{
            height: 1,
            marginHorizontal: tokens.spacing.md,
            backgroundColor: colors.separator,
          }}
        />
        <UIColorThemeSelector
          disabled={isTransitioning}
          onValueChange={(value) => {
            void setColorTheme(value);
          }}
        />
      </Animated.View>
      <Animated.Text
        selectable
        style={{
          ...tokens.typography.subhead,
          color: colors.secondaryText,
        }}
      >
        System follows your device’s appearance. Your color palette stays the
        same.
      </Animated.Text>
      <Animated.View
        style={{
          gap: tokens.spacing.sm,
        }}
      >
        <Animated.Text
          selectable
          testID="theme-status"
          style={{
            ...tokens.typography.headline,
            color: colors.text,
          }}
        >
          {theme === 'system' ? 'System' : theme === 'dark' ? 'Dark' : 'Light'}{' '}
          · {resolvedTheme} · {palettes[colorTheme].label}
        </Animated.Text>
        <Animated.Text
          selectable
          style={{
            ...tokens.typography.body,
            color: colors.secondaryText,
          }}
        >
          Your choices are saved on this device.
        </Animated.Text>
      </Animated.View>
      <Link
        href="/transitions"
        accessibilityRole="link"
        style={{ ...tokens.typography.headline, color: colors.accent }}
      >
        Try screen transitions
      </Link>
      <Link href="/preview" asChild>
        <Animated.Text
          style={{
            ...tokens.typography.headline,
            color: colors.accent,
            paddingVertical: tokens.spacing.md,
          }}
          accessibilityRole="link"
          accessibilityLabel="Open theme preview"
        >
          Open preview
        </Animated.Text>
      </Link>
    </Animated.ScrollView>
  );
}
