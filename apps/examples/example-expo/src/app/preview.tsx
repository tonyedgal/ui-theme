import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAnimatedUITheme } from 'uitheme-rn/transitions';
import { UIThemeSwitcher } from 'uitheme-rn/expo';
import { tokens } from '@/theme';

export default function PreviewScreen() {
  const { colors, isTransitioning, toggleTheme } = useAnimatedUITheme();
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
          ...tokens.typography.title,
          color: colors.text,
        }}
      >
        A place for everything.
      </Animated.Text>
      <Animated.Text
        selectable
        style={{
          ...tokens.typography.body,
          color: colors.secondaryText,
        }}
      >
        Native navigation, readable type, and a palette that feels at home.
        Change appearance without losing your place.
      </Animated.Text>
      <Animated.View
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.separator,
          borderWidth: 1,
          padding: tokens.spacing.lg,
          gap: tokens.spacing.md,
          borderRadius: tokens.radius.lg,
          borderCurve: 'continuous',
        }}
      >
        <Animated.Text
          selectable
          style={{
            ...tokens.typography.headline,
            color: colors.text,
          }}
        >
          Weekend notes
        </Animated.Text>
        <Animated.Text
          selectable
          style={{
            ...tokens.typography.body,
            color: colors.secondaryText,
          }}
        >
          Take the long way home. Find a new coffee spot. Leave room for a
          little quiet.
        </Animated.Text>
        <Animated.Text
          selectable
          style={{
            ...tokens.typography.subhead,
            color: colors.accent,
          }}
        >
          Personal · 3 notes
        </Animated.Text>
      </Animated.View>
      <UIThemeSwitcher
        disabled={isTransitioning}
        onPress={() => {
          void toggleTheme();
        }}
      />
      <Animated.Text
        testID="transition-status"
        style={{
          ...tokens.typography.caption,
          color: colors.secondaryText,
        }}
      >
        Screen transition: {isTransitioning ? 'playing' : 'ready'}
      </Animated.Text>
    </Animated.ScrollView>
  );
}
