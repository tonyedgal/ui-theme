import { useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Host, Slider } from '@expo/ui';
import {
  accessibilityLabel,
  accessibilityValue,
} from '@expo/ui/swift-ui/modifiers';
import { semantics } from '@expo/ui/jetpack-compose/modifiers';
import { UIThemeProvider, useUITheme } from 'uitheme-rn';
import { NativeWindTheme } from 'uitheme-rn/nativewind';
import {
  useAnimatedUITheme,
  screenTransitionTypes,
  type ScreenTransitionType,
} from 'uitheme-rn/transitions';

const transitionLabels: Record<ScreenTransitionType, string> = {
  fade: 'Fade',
  circularReveal: 'Circle',
  wipe: 'Wipe',
  slide: 'Slide',
  split: 'Split',
  heart: 'Heart',
  star: 'Star',
  pixelize: 'Pixelize',
  dissolve: 'Dissolve',
};

function NativeSample() {
  const { colors } = useUITheme();

  return (
    <View
      style={{ padding: 16, backgroundColor: colors.accent, borderRadius: 12 }}
    >
      <Text style={{ color: colors.onAccent }}>
        Native style: {String(colors.accent)}
      </Text>
    </View>
  );
}

function TypeScriptSample() {
  return (
    <UIThemeProvider>
      <NativeWindTheme>
        <View className="bg-card p-4 rounded-xl gap-2">
          <Text className="text-foreground">
            Independent TypeScript palette
          </Text>
          <View className="bg-primary p-4 rounded-xl">
            <Text className="text-primary-foreground">
              TypeScript → utility classes
            </Text>
          </View>
          <NativeSample />
        </View>
      </NativeWindTheme>
    </UIThemeProvider>
  );
}

export default function Demo() {
  const theme = useAnimatedUITheme();

  const [transition, setTransition] =
    useState<ScreenTransitionType>('circularReveal');

  const [duration, setDuration] = useState(350);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 20, gap: 16 }}
    >
      <Text className="text-foreground text-2xl font-semibold">
        CSS palette: {theme.colorTheme} · {theme.resolvedTheme}
      </Text>
      <Text className="text-muted-foreground">
        CSS defines these colors. Both samples should match.
      </Text>
      <View className="bg-primary p-4 rounded-xl">
        <Text className="text-primary-foreground">
          Utility classes: {String(theme.colors.accent)}
        </Text>
      </View>
      <NativeSample />
      <View className="gap-3">
        <Text
          accessibilityRole="header"
          className="text-foreground text-lg font-semibold"
        >
          Transition style
        </Text>
        <Text className="text-muted-foreground">
          {transitionLabels[transition]} applies to appearance and palette
          changes.
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {screenTransitionTypes.map((value) => (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityLabel={`${transitionLabels[value]} transition`}
              accessibilityState={{
                selected: transition === value,
                disabled: theme.isTransitioning,
              }}
              disabled={theme.isTransitioning}
              onPress={() => setTransition(value)}
              className={
                transition === value
                  ? 'bg-primary rounded-xl px-4 py-3 min-h-11 justify-center'
                  : 'bg-card rounded-xl px-4 py-3 min-h-11 justify-center'
              }
            >
              <Text
                className={
                  transition === value
                    ? 'text-primary-foreground'
                    : 'text-foreground'
                }
              >
                {transitionLabels[value]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View className="bg-card rounded-xl p-4 gap-3">
        <View className="flex-row items-center justify-between gap-3">
          <Text
            accessibilityRole="header"
            className="text-foreground font-semibold"
          >
            Transition duration
          </Text>
          <Text
            className="text-foreground"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {duration} ms
          </Text>
        </View>
        <Host
          colorScheme={theme.resolvedTheme}
          seedColor={theme.colors.accent}
          matchContents={{ vertical: true }}
          style={{ width: '100%', minHeight: 44 }}
        >
          <Slider
            value={duration}
            onValueChange={setDuration}
            min={100}
            max={2000}
            step={50}
            disabled={theme.isTransitioning}
            testID="transition-duration"
            modifiers={
              Platform.OS === 'ios'
                ? [
                    accessibilityLabel('Transition duration'),
                    accessibilityValue(`${duration} milliseconds`),
                  ]
                : Platform.OS === 'android'
                  ? [semantics({ contentDescription: 'Transition duration' })]
                  : []
            }
          />
        </Host>
        <View className="flex-row justify-between">
          <Text className="text-muted-foreground">100 ms</Text>
          <Text className="text-muted-foreground">2,000 ms</Text>
        </View>
      </View>
      <View className="flex-row flex-wrap gap-2">
        {(['light', 'dark', 'system'] as const).map((value) => (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityState={{
              selected: theme.theme === value,
              disabled: theme.isTransitioning,
            }}
            disabled={theme.isTransitioning}
            onPress={() => {
              void theme.setTheme(value, { transition, duration });
            }}
            className="bg-card rounded-xl p-4"
          >
            <Text className="text-foreground">{value}</Text>
          </Pressable>
        ))}
      </View>
      <View className="flex-row flex-wrap gap-2">
        {theme.colorThemes.map((value) => (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityState={{
              selected: theme.colorTheme === value,
              disabled: theme.isTransitioning,
            }}
            disabled={theme.isTransitioning}
            onPress={() => {
              void theme.setColorTheme(value, { transition, duration });
            }}
            className="bg-card rounded-xl p-4"
          >
            <Text className="text-foreground">{value}</Text>
          </Pressable>
        ))}
      </View>
      <Text className="text-muted-foreground">
        {theme.isTransitioning ? 'Playing' : 'Ready'}
      </Text>
      <TypeScriptSample />
    </ScrollView>
  );
}
