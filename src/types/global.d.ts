export {};

declare global {
  interface Window {
    handleSpotAction: (spotId: string, action: 'delete' | 'restore') => Promise<void>;
  }
}