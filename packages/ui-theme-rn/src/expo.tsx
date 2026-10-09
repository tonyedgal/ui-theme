import { Button, Column, Host, Picker, Row, Spacer, Text } from '@expo/ui';
import type { Theme } from './core/types';
import { useUITheme, themeTokens } from 'uitheme-rn';

export interface UIThemeSelectorProps {
  label?: string;
  disabled?: boolean;
  testID?: string;
  labels?: Record<Theme, string>;
  onValueChange?: (value: Theme) => void;
}

const defaultLabels = { system: 'System', light: 'Light', dark: 'Dark' };

const modes: readonly Theme[] = ['system', 'light', 'dark'];

/** SwiftUI on iOS, Compose on Android. No Expo import in the core entry. */
export function UIThemeSelector({
  label = 'Appearance',
  disabled = false,
  testID = 'uitheme-appearance',
  labels = defaultLabels,
  onValueChange,
}: UIThemeSelectorProps) {
  const { theme, resolvedTheme, colors, setTheme } = useUITheme();

  return (
    <Host
      colorScheme={resolvedTheme}
      seedColor={colors.accent}
      matchContents={{ vertical: true }}
      style={{ width: '100%' }}
    >
      <Row
        alignment="center"
        spacing={themeTokens.spacing.md}
        style={{ padding: themeTokens.spacing.md }}
      >
        <Text>{label}</Text>
        <Spacer flexible />
        <Picker<Theme>
          selectedValue={theme}
          onValueChange={onValueChange ?? setTheme}
          enabled={!disabled}
          testID={testID}
        >
          {modes.map((mode) => (
            <Picker.Item key={mode} label={labels[mode]} value={mode} />
          ))}
        </Picker>
      </Row>
    </Host>
  );
}

export function UIColorThemeSelector({
  label = 'Color palette',
  disabled = false,
  testID = 'uitheme-palette',
  onValueChange,
}: Omit<UIThemeSelectorProps, 'labels' | 'onValueChange'> & {
  onValueChange?: (value: string) => void;
}) {
  const {
    colorTheme,
    colorThemes,
    palettes,
    colors,
    resolvedTheme,
    setColorTheme,
  } = useUITheme();

  return (
    <Host
      colorScheme={resolvedTheme}
      seedColor={colors.accent}
      matchContents={{ vertical: true }}
      style={{ width: '100%' }}
    >
      <Row
        alignment="center"
        spacing={themeTokens.spacing.md}
        style={{ padding: themeTokens.spacing.md }}
      >
        <Text>{label}</Text>
        <Spacer flexible />
        <Picker
          selectedValue={colorTheme}
          onValueChange={onValueChange ?? setColorTheme}
          enabled={!disabled}
          testID={testID}
        >
          {colorThemes.map((name) => (
            <Picker.Item key={name} label={palettes[name].label} value={name} />
          ))}
        </Picker>
      </Row>
    </Host>
  );
}

export function UIThemeSwitcher({
  disabled = false,
  label,
  onPress,
}: {
  disabled?: boolean;
  label?: string;
  onPress?: () => void;
}) {
  const { resolvedTheme, colors, toggleTheme } = useUITheme();

  return (
    <Host
      colorScheme={resolvedTheme}
      seedColor={colors.accent}
      matchContents={{ vertical: true }}
      style={{ width: '100%' }}
    >
      <Column>
        <Button
          onPress={onPress ?? toggleTheme}
          disabled={disabled}
          label={
            label ??
            `Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} appearance`
          }
        />
      </Column>
    </Host>
  );
}
