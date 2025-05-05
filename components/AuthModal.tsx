import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Image from 'next/image';
import { signIn } from 'next-auth/react';

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog open={true} onClose={onClose} className="relative z-50">
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
                    onClick={onClose}
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
                        signIn('google');
                        onClose();
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
                      onClick={() => {
                        signIn('email');
                        onClose();
                      }}
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
                      onClick={() => {
                        signIn();
                        onClose();
                      }}
                      className="text-purple-600 hover:text-purple-700 font-semibold"
                    >
                      Sign in
                    </button>{' '}
                    to continue exploring.
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
