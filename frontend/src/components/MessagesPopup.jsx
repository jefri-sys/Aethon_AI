import React from 'react';
import { X } from 'lucide-react';
import Messages from '../pages/messages/Messages';

export default function MessagesPopup({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-[800px] max-h-[85vh] shadow-2xl overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-800">Messages</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5"/>
          </button>
        </div>
        <div className="flex-1 p-4 bg-white overflow-y-auto">
          <Messages isPopupMode={true} />
        </div>
      </div>
    </div>
  );
}
