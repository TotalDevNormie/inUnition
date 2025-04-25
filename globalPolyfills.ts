export {};

if (typeof global.navigator === 'undefined') {
  (global as any).navigator = { userAgent: 'react-native' };
} else if (!(global.navigator as any).userAgent) {
  // If navigator exists but doesn't have a userAgent, add it.
  (global.navigator as any).userAgent = 'react-native';
}
