export const homeKeys = {
  all: ['home'] as const,
  canvas: () => [...homeKeys.all, 'canvas'] as const,
};
