import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { useAuthModal } from '@/hooks/useAuthModal';

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const { isOpen, closeModal } = useAuthModal();

  return (
    <Transition appear show={isOpen} as={Fragment}>
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
                    onClick={closeModal}
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

                  <div className="grid grid-cols-4 gap-4 mb-8 px-4">
                    <div className="text-center">
                      <div className="text-3xl mb-2">❤️</div>
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
                        Chat
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
                    <div className="text-center">
                      <div className="text-3xl mb-2">🔍</div>
                      <div className="text-sm">
                        Filter
                        <br />
                        Houses
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <button
                      onClick={() => signIn('google')}
                      className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Image
                        src="/google.svg"
                        alt="Google"
                        width={20}
                        height={20}
                      />
                      Continue with Google
                    </button>

                    <button
                      onClick={() => signIn('apple')}
                      className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Image
                        src="/apple.svg"
                        alt="Apple"
                        width={20}
                        height={20}
                      />
                      Continue with Apple
                    </button>

                    <button
                      onClick={() => signIn('email')}
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
                      onClick={() => signIn()}
                      className="text-purple-600 hover:text-purple-700 font-semibold"
                    >
                      Sign in
                    </button>{' '}
                    to continue exploring.
                  </div>

                  <div className="mt-8 flex justify-between text-sm text-gray-500">
                    <div>
                      <span className="font-semibold text-gray-900">
                        22,465
                      </span>
                      <br />
                      houses
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">
                        1,000+
                      </span>
                      <br />
                      students
                    </div>
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
