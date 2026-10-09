import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
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
              void theme.setTheme(value, { transition });
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
              void theme.setColorTheme(value, { transition });
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
