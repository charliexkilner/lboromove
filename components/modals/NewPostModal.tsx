import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useQueryClient } from '@tanstack/react-query';
import type { Post } from '../../types/post';

interface NewPostModalProps {
  onClose: () => void;
}

const categories = [
  { id: 'housemate-finder', label: 'Housemate Finder', icon: '🏠' },
  { id: 'for-sale', label: 'For Sale', icon: '💰' },
  { id: 'events', label: 'Events', icon: '🎉' },
  { id: 'questions', label: 'Questions', icon: '❓' },
  { id: 'house-hunting', label: 'House Hunting', icon: '🔍' },
  { id: 'student-life', label: 'Student Life', icon: '🎓' },
];

export default function NewPostModal({ onClose }: NewPostModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      if (photo) {
        formData.append('photo', photo);
      }

      const response = await fetch('/api/posts/create', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create post');
      }

      // Clear form and close modal
      setTitle('');
      setDescription('');
      setCategory('');
      setPhoto(null);
      setPhotoPreview(null);
      
      // Invalidate and refetch posts
      await queryClient.invalidateQueries({ queryKey: ['posts'] });
      
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      setError(error instanceof Error ? error.message : 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="relative w-full max-w-lg transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
          <div className="absolute right-0 top-0 pr-4 pt-4">
            <button
              type="button"
              className="rounded-md bg-white text-gray-400 hover:text-gray-500"
              onClick={onClose}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6">
            <div>
              <h3 className="text-xl font-semibold leading-6 text-gray-900 mb-2">
                Create New Post
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Share your thoughts, questions, or announcements with the community.
              </p>

              {error && (
                <div className="mb-4 rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500"
                    placeholder="Enter a descriptive title"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-gray-500 text-xs">(optional)</span>
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500"
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500"
                    placeholder="Provide details about your post"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="photo" className="block text-sm font-medium text-gray-700">
                    Photo <span className="text-gray-500 text-xs">(optional)</span>
                  </label>
                  <input
                    type="file"
                    id="photo"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                  {photoPreview && (
                    <div className="mt-2">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="h-32 w-auto object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
