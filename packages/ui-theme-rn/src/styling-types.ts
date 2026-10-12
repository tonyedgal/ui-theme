/** Each CSS palette supplies a class (NativeWind) or registered theme (Uniwind). */
export type ThemeStyleScopes = Readonly<
  Record<
    string,
    {
      readonly light: string;
      readonly dark: string;
    }
  >
>;
