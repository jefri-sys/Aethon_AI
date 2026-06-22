import React from 'react';
import ProtectedPage from '../../components/ProtectedPage.jsx';
import { BookText, FileUp, Sparkles, LayoutGrid } from 'lucide-react';

function Notebook() {
  return (
    <ProtectedPage
      title="AI Notebook"
      description="Upload notes and documents, then turn them into summaries, flashcards, and revision prompts."
    >
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-indigo-200 blur-3xl opacity-50 rounded-full"></div>
          <BookText className="w-24 h-24 text-indigo-600 relative z-10" strokeWidth={1.5} />
          <Sparkles className="w-8 h-8 text-amber-400 absolute -top-2 -right-4 animate-pulse z-20" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Your Smart AI Notebook</h2>
        <p className="text-gray-500 max-w-lg text-center mb-10 leading-relaxed">
          Create AI-generated summaries, flashcards, and quizzes from your study materials. Coming soon!
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="p-3 bg-indigo-50 rounded-xl">
              <FileUp className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Upload Documents</h3>
              <p className="text-sm text-gray-500 mt-1">PDFs, PPTs, and Word docs</p>
            </div>
          </div>
          
          <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="p-3 bg-violet-50 rounded-xl">
              <LayoutGrid className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Flashcards Hub</h3>
              <p className="text-sm text-gray-500 mt-1">Review active recall decks</p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}

export default Notebook;
