import { createContext, useContext } from 'react';

export const SignOutContext = createContext(null);

export function useSignOut() {
  const requestSignOut = useContext(SignOutContext);
  if (!requestSignOut) {
    throw new Error('useSignOut must be used within a SignOutProvider.');
  }
  return requestSignOut;
}
