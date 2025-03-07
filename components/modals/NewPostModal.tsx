interface NewPostModalProps {
  onClose: () => void;
}

export default function NewPostModal({ onClose }: NewPostModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Create New Post</h2>
        {/* Add your form elements here */}
        <button
          onClick={onClose}
          className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}
