export interface Transport {
  emit: (event: string, message?: any) => void;
  on: (event: string, handler: (...args: any) => void) => void;
  off?: (event: string, handler: (...args: any) => void) => void;
}
