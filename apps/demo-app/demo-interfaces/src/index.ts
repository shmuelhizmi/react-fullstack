import { View } from "@react-fullstack/fullstack/shared";

export type Views = {
  Home: View<{ username: string; logout: () => void; info: { feeling: 'goood' | 'bad' }; moodSwing: () => void }>;
  Login: View<{ login: (username: string, password: string) => void }>;
  Prompt: View<{ message: string; onOk: () => void }>;
  Gif: View<{ url: string }>
  Button: View<{ onClick: () => void; text: string }>
  Input: View<{ onChange: (value: string) => void; value: string }>
};
