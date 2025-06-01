import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import toast from 'react-hot-toast';

interface AuthModalProps {
  onClose: () => void;
}

type AuthMode = 'initial' | 'emailSignIn' | 'emailSignUp';

export default function AuthModal({ onClose }: AuthModalProps) {
  const [authMode, setAuthMode] = useState<AuthMode>('initial');
  const [email, setEmail] = useState('test@user.com');
  const [password, setPassword] = useState('12345');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
      callbackUrl: '/',
    });

    setIsLoading(false);

    if (result?.error) {
      toast.error(result.error === "CredentialsSignin" ? "Invalid email or password." : result.error);
    } else if (result?.ok) {
      toast.success("Signed in successfully!");
      onClose();
    }
  };

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog open={true} onClose={() => { if (!isLoading) { setAuthMode('initial'); onClose(); } }} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="absolute top-4 right-4">
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={() => { if (!isLoading) { setAuthMode('initial'); onClose(); } }}
                    disabled={isLoading}
                  >
                    <span className="sr-only">Close</span>
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {authMode === 'initial' && (
                  <div className="mt-2 text-center">
                    <Dialog.Title
                      as="h3"
                      className="text-2xl font-bold leading-6 text-gray-900 mb-8"
                    >
                      Create a free
                      <br />
                      LBOROMOVE account
                    </Dialog.Title>

                    <div className="grid grid-cols-3 gap-4 mb-8 px-4">
                      <div className="text-center">
                        <div className="text-3xl mb-2">🏠</div>
                        <div className="text-sm">
                          Save
                          <br />
                          Favorites
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl mb-2">💬</div>
                        <div className="text-sm">
                          Student
                          <br />
                          Discussion
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl mb-2">🔧</div>
                        <div className="text-sm">
                          Student
                          <br />
                          Tools
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <button
                        onClick={() => {
                          toast.promise(
                            signIn('google', { redirect: false, callbackUrl: '/' }),
                            {
                              loading: 'Redirecting to Google...',
                              success: () => {
                                onClose();
                                return 'Signed in with Google!';
                              },
                              error: 'Failed to sign in with Google.',
                            }
                          );
                        }}
                        className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <img
                          src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIyLjU2IDEyLjI1QzIyLjU2IDExLjQ3IDIyLjQ5IDEwLjcyIDIyLjM1IDEwSDEyVjE0LjI1NUgxOC4wNEMxNy43OSAxNS43MjUgMTcuMDM1IDE2Ljk1IDE1LjkzNSAxNy43ODVMMTUuOTUgMTcuOTFMMTkuMjA1IDIwLjM0NUwxOS40NiAyMC4zOUMyMS41MSAxOC41MyAyMi41NiAxNS43MyAyMi41NiAxMi4yNVoiIGZpbGw9IiM0Mjg1RjQiLz4KPHBhdGggZD0iTTEyIDIzQzE1LjA1IDIzIDE3LjYyIDIyLjAxNSAxOS40NiAyMC4zOUwxNS45MzUgMTcuNzg1QzE0Ljk5IDE4LjQyNSAxMy42MiAxOC44NSAxMiAxOC44NUMxMi4wNCAxOC44NSAxMi4wOCAxOC44NSAxMi4xMiAxOC44NUw5LjIzNSAxOC44NUM2LjgzIDE4Ljg1IDQuNzg1IDE2LjkzNSA0LjExNSAxNC40NUw0LjAwNSAxNC40NUwwLjYzIDE2Ljk1TDAuNTcgMTdDMi40MyAyMC41NjUgNi45MiAyMyAxMiAyM1oiIGZpbGw9IiMzNEE4NTMiLz4KPHBhdGggZD0iTTQuMTE1IDE0LjQ1QzMuOTQ1IDEzLjc1IDMuODUgMTMuMDIgMy44NSAxMi4yNUMzLjg1IDExLjQ4IDMuOTQ1IDEwLjc1IDQuMSAxMC4wNUw0LjA5NSA5LjkxNUwwLjY3IDcuMzY1TDAuNTcgNy41QzAuMjA1IDguOTUgMCAxMC41NyAwIDEyLjI1QzAgMTMuOTMgMC4yMDUgMTUuNTUgMC41NyAxN0w0LjExNSAxNC40NVoiIGZpbGw9IiNGQkJDMDUiLz4KPHBhdGggZD0iTTEyIDUuNjVDMTMuNjYgNS42NSAxNS4wNiA2LjIxIDE2LjE2NSA3LjI2TDE2LjE3IDcuMjY1TDE5LjI3NSA0LjE3TDE5LjE2IDQuMDY1QzE3LjMzNSAyLjM2NSAxNC44NyAxLjI1IDEyIDEuMjVDNi45MiAxLjI1IDIuNDMgMy42ODUgMC41NyA3LjVMNC4xIDEwLjA1QzQuNzg1IDcuNTY1IDYuODMgNS42NSA5LjIzNSA1LjY1SDEyWiIgZmlsbD0iI0VBNDMzNSIvPgo8L3N2Zz4K"
                          alt="Google"
                          width={24}
                          height={24}
                        />
                        Continue with Google
                      </button>

                      <button
                        onClick={() => setAuthMode('emailSignUp')}
                        className="w-full flex items-center justify-center gap-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        Continue with email
                      </button>
                    </div>

                    <div className="mt-6 text-sm text-gray-500">
                      Already a member?{' '}
                      <button
                        onClick={() => setAuthMode('emailSignIn')}
                        className="text-purple-600 hover:text-purple-700 font-semibold"
                      >
                        Sign in
                      </button>{' '}
                      to continue exploring.
                    </div>
                  </div>
                )}

                {(authMode === 'emailSignIn' || authMode === 'emailSignUp') && (
                  <div className="mt-2">
                    <Dialog.Title
                      as="h3"
                      className="text-2xl font-bold leading-6 text-gray-900 mb-6 text-center"
                    >
                      {authMode === 'emailSignIn' ? 'Sign In' : 'Sign Up with Email'}
                    </Dialog.Title>
                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          Email address
                        </label>
                        <input
                          type="email"
                          name="email"
                          id="email"
                          autoComplete="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                          placeholder="test@user.com"
                        />
                      </div>
                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                          Password
                        </label>
                        <input
                          type="password"
                          name="password"
                          id="password"
                          autoComplete={authMode === 'emailSignIn' ? "current-password" : "new-password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                          placeholder="••••••••"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                      >
                        {isLoading ? 'Processing...' : (authMode === 'emailSignIn' ? 'Sign In' : 'Continue with Email')}
                      </button>
                    </form>
                    <div className="mt-4 text-sm text-center">
                      <button
                        onClick={() => setAuthMode('initial')}
                        className="font-medium text-purple-600 hover:text-purple-700"
                        disabled={isLoading}
                      >
                        Back to other sign-in options
                      </button>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
