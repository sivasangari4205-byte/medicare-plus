import { useAuth } from './AuthContext';

export function useSocket() {
  const { socket } = useAuth();
  return { socket };
}
