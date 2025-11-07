import AddWordModal from './AddWordModal';
import { useState } from 'react';

export default function FloatingActionButton({ onSuccess }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        data-add-word
        onClick={() => setShowModal(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-all hover:scale-110 flex items-center justify-center text-2xl z-40"
      >
        <span className="material-symbols-outlined">add</span>
      </button>
      {showModal && (
        <AddWordModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            onSuccess();
          }}
        />
      )}
    </>
  );
}
