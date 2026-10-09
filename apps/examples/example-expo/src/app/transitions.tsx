import { useRef, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  screenTransitionTypes,
  useAnimatedUITheme,
} from 'uitheme-rn/transitions';
import type {
  ScreenTransitionOptions,
  ScreenTransitionType,
} from 'uitheme-rn/transitions';
import { useReducedMotion } from 'uitheme-rn';
import { tokens } from '@/theme';

export default function TransitionsScreen() {
  const theme = useAnimatedUITheme();
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const origin = useRef<View>(null);

  const [transition, setTransition] =
    useState<ScreenTransitionType>('circularReveal');

  const [duration, setDuration] = useState(800);
  const [inverted, setInverted] = useState(false);

  const [direction, setDirection] =
    useState<ScreenTransitionOptions['direction']>('right');

  const [split, setSplit] =
    useState<ScreenTransitionOptions['split']>('left-right');

  const { colors } = theme;

  const options: ScreenTransitionOptions = {
    transition,
    duration,
    inverted,
    direction,
    split,
  };

  function choice(label: string, selected: boolean, action: () => void) {
    return (
      <Pressable
        key={label}
        accessibilityRole="button"
        accessibilityState={{ selected, disabled: theme.isTransitioning }}
        disabled={theme.isTransitioning}
        onPress={action}
        style={({ pressed }) => ({
          minHeight: 44,
          padding: 12,
          borderRadius: 12,
          backgroundColor: selected ? colors.accent : colors.surface,
          opacity: pressed ? 0.65 : 1,
          justifyContent: 'center',
        })}
      >
        <Text
          style={{
            ...tokens.typography.subhead,
            color: selected ? colors.onAccent : colors.text,
          }}
        >
          {label}
        </Text>
      </Pressable>
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        padding: 20,
        paddingBottom: insets.bottom + 32,
        gap: 20,
      }}
    >
      <Text style={{ ...tokens.typography.title, color: colors.text }}>
        {theme.palettes[theme.colorTheme].label} · {theme.resolvedTheme}
      </Text>
      <Text style={{ ...tokens.typography.body, color: colors.secondaryText }}>
        Reveal the next appearance or palette from the same screen.
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {screenTransitionTypes.map((type) =>
          choice(type, transition === type, () => setTransition(type))
        )}
      </View>
      <Text style={{ ...tokens.typography.headline, color: colors.text }}>
        Duration
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[400, 800, 1600].map((ms) =>
          choice(`${ms} ms`, duration === ms, () => setDuration(ms))
        )}
      </View>
      {(transition === 'wipe' || transition === 'slide') && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(['left', 'right', 'up', 'down'] as const).map((value) =>
            choice(value, direction === value, () => setDirection(value))
          )}
        </View>
      )}
      {transition === 'split' && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(['left-right', 'top-bottom'] as const).map((value) =>
            choice(value, split === value, () => setSplit(value))
          )}
        </View>
      )}
      {['circularReveal', 'split', 'heart', 'star'].includes(transition) && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text style={{ ...tokens.typography.body, color: colors.text }}>
            Invert reveal
          </Text>
          <Switch
            accessibilityLabel="Invert reveal"
            value={inverted}
            onValueChange={setInverted}
            disabled={theme.isTransitioning}
          />
        </View>
      )}
      <Pressable
        ref={origin}
        collapsable={false}
        disabled={theme.isTransitioning}
        accessibilityRole="button"
        accessibilityLabel="Play appearance transition"
        onPress={() => {
          void theme.toggleTheme({ ...options, origin });
        }}
        style={({ pressed }) => ({
          minHeight: 48,
          padding: 16,
          borderRadius: 12,
          backgroundColor: colors.surface,
          opacity: pressed ? 0.65 : 1,
        })}
      >
        <Text style={{ ...tokens.typography.headline, color: colors.accent }}>
          Play appearance transition
        </Text>
      </Pressable>
      <Text style={{ ...tokens.typography.headline, color: colors.text }}>
        Play color palette transition
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {theme.colorThemes.map((value) =>
          choice(
            theme.palettes[value].label,
            value === theme.colorTheme,
            () => {
              void theme.setColorTheme(value, options);
            }
          )
        )}
      </View>
      <Text
        testID="screen-transition-status"
        style={{ ...tokens.typography.caption, color: colors.secondaryText }}
      >
        {reducedMotion
          ? 'Reduce Motion: immediate changes'
          : theme.isTransitioning
            ? 'Transition playing'
            : 'Ready'}
      </Text>
    </ScrollView>
  );
}
