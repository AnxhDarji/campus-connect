import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SignOutContext } from '../context/SignOutContext';

export function SignOutProvider({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const logoutInProgress = useRef(false);
  const cancelButtonRef = useRef(null);
  const confirmButtonRef = useRef(null);
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);

  const requestSignOut = useCallback(() => {
    triggerRef.current = document.activeElement;
    setErrorMessage('');
    setIsClosing(false);
    setIsOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    if (isLoading) return;
    setIsClosing(true);
  }, [isLoading]);

  const finishClosing = useCallback(() => {
    if (!isClosing) return;
    setIsClosing(false);
    setIsOpen(false);
    setErrorMessage('');
    triggerRef.current?.focus();
  }, [isClosing]);

  const confirmSignOut = async () => {
    if (logoutInProgress.current) return;
    logoutInProgress.current = true;
    setIsLoading(true);
    setErrorMessage('');

    try {
      await logout();
      setIsOpen(false);
      setIsClosing(false);
      navigate('/login', { replace: true });
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || error.message || 'Sign out failed. Please try again.'
      );
    } finally {
      logoutInProgress.current = false;
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) cancelButtonRef.current?.focus();
  }, [isOpen]);

  const handleDialogKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDialog();
      return;
    }

    if (event.key !== 'Tab') return;
    const firstButton = cancelButtonRef.current;
    const lastButton = confirmButtonRef.current;
    if (!firstButton || !lastButton) return;

    if (event.shiftKey && document.activeElement === firstButton) {
      event.preventDefault();
      lastButton.focus();
    } else if (!event.shiftKey && document.activeElement === lastButton) {
      event.preventDefault();
      firstButton.focus();
    }
  };

  return (
    <SignOutContext.Provider value={requestSignOut}>
      {children}
      {isOpen && (
        <div
          className={`cc-signout-backdrop fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[3px] ${isClosing ? 'cc-signout-backdrop-exit' : ''}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDialog();
          }}
          onKeyDown={handleDialogKeyDown}
        >
          <section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="signout-title"
            aria-describedby="signout-description"
            className={`cc-signout-dialog w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-[var(--cc-surface)] sm:p-7 ${isClosing ? 'cc-signout-dialog-exit' : ''}`}
            onAnimationEnd={(event) => {
              if (event.target === event.currentTarget) finishClosing();
            }}
          >
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M10 17l5-5-5-5" />
                  <path d="M15 12H3" />
                  <path d="M12 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
                </svg>
              </span>
              <div className="min-w-0 pt-0.5">
                <h2 id="signout-title" className="text-lg font-bold tracking-tight text-gray-900 dark:text-[var(--cc-text)]">
                  Sign out of CampusConnect?
                </h2>
                <p id="signout-description" className="mt-2 text-sm leading-6 text-gray-600 dark:text-[var(--cc-muted)]">
                  You'll need to sign in again to access your account.
                </p>
              </div>
            </div>

            {errorMessage && (
              <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
                {errorMessage}
              </p>
            )}

            <div className="mt-7 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <button
                ref={cancelButtonRef}
                type="button"
                onClick={closeDialog}
                disabled={isLoading}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] px-5 text-sm font-semibold text-[var(--cc-text)] transition-colors hover:bg-[var(--cc-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                ref={confirmButtonRef}
                type="button"
                onClick={confirmSignOut}
                disabled={isLoading}
                aria-busy={isLoading || undefined}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] hover:bg-red-700 hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <svg aria-hidden="true" className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Signing out…
                  </>
                ) : 'Sign Out'}
              </button>
            </div>
          </section>
        </div>
      )}
    </SignOutContext.Provider>
  );
}
