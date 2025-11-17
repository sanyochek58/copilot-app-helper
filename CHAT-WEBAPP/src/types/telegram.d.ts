export {};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: any; // можно позже типизировать точнее
    };
  }
}
