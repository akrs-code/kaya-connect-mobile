/** The application deliberately uses one bright appearance on every platform. */
export function useColorScheme() {
  return 'light' as const;
}
