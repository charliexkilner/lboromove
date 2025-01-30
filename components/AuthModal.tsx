import React from 'react';
import Image from 'next/image';

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white text-gray-900 rounded-lg w-full max-w-md p-8 relative shadow-xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Logo and Title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4 text-gray-900">
            Create a free <br />
            LBOROMOVE account
          </h2>
          <div className="text-gray-600 mb-6 space-y-2">
            <div className="grid grid-cols-4 gap-4 max-w-sm mx-auto mb-6">
              <div className="text-center">
                <div className="text-3xl mb-1">❤️</div>
                <div className="text-sm">Save Favorites</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-1">💬</div>
                <div className="text-sm">Student Chat</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-1">🛠️</div>
                <div className="text-sm">Student Tools</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-1">🔍</div>
                <div className="text-sm">Filter Houses</div>
              </div>
            </div>
            <p className="mt-4">
              Already a member?{' '}
              <a
                href="#"
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Sign in
              </a>{' '}
              to continue exploring.
            </p>
          </div>
        </div>

        {/* Auth Buttons */}
        <div className="space-y-4">
          <button className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors">
            <Image
              src="/icons/google.svg"
              alt="Google"
              width={20}
              height={20}
            />
            Continue with Google
          </button>
          <button className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors">
            <Image
              src="/icons/apple.svg"
              alt="Apple"
              width={20}
              height={20}
              className="text-black"
            />
            Continue with Apple
          </button>
          <button className="w-full bg-[#1877F2] text-white py-3 px-4 rounded-lg flex items-center justify-center gap-3 hover:bg-[#1864D9] transition-colors">
            <Image
              src="/icons/facebook.svg"
              alt="Facebook"
              width={20}
              height={20}
              className="text-white"
            />
            Continue with Facebook
          </button>
          <button className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-3 hover:bg-purple-700 transition-colors">
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

        {/* Join Stats */}
        <div className="mt-8 flex items-center justify-center gap-12 text-sm text-gray-500">
          <div className="text-center">
            <p className="font-semibold text-gray-900 text-lg">22,465</p>
            <p>houses</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-900 text-lg">1,000+</p>
            <p>students</p>
          </div>
        </div>
      </div>
    </div>
  );
}
