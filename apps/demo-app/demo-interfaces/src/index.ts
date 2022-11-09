import { View } from "@react-fullstack/fullstack/shared";

export const Views = {
  Home: {} as View<{ username: string; logout: () => void; info: { feeling: 'goood' | 'bad' }; moodSwing: () => void }>,
  Login: {} as View<{ login: (username: string, password: string) => void }>,
  Prompt: {} as View<{ message: string; onOk: () => void }>,
  Gif: {} as View<{ url: string }>
};
