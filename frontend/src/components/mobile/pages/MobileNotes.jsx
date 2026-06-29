import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Plus, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MobileNotes() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('synapse_quick_notes');
    if (saved) {
      setNotes(JSON.parse(saved));
    }
  }, []);

  const saveNotes = (updatedNotes) => {
    setNotes(updatedNotes);
    localStorage.setItem('synapse_quick_notes', JSON.stringify(updatedNotes));
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const note = {
      id: Date.now().toString(),
      text: newNote.trim(),
      date: new Date().toISOString()
    };
    saveNotes([note, ...notes]);
    setNewNote('');
  };

  const handleDelete = (id) => {
    saveNotes(notes.filter(n => n.id !== id));
  };

  return (
    <div className="mobile-shell pb-24" style={{ backgroundColor: 'var(--mobile-surface)', minHeight: '100vh' }}>
      <div 
        className="sticky top-0 z-10 flex items-center gap-3 p-5 pb-4 backdrop-blur-md"
        style={{ backgroundColor: 'rgba(255, 248, 245, 0.9)' }}
      >
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-10 h-10 rounded-2xl transition-transform active:scale-95"
          style={{ backgroundColor: 'var(--mobile-surface-raised)' }}
        >
          <ArrowLeft size={20} style={{ color: 'var(--mobile-text-primary)' }} />
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--mobile-text-primary)' }}>Notes</h1>
      </div>

      <div className="px-5">
        <div 
          className="mb-8 p-4 rounded-[24px]"
          style={{ backgroundColor: 'var(--mobile-surface-raised)', boxShadow: '0 4px 12px rgba(43,37,32,0.04)' }}
        >
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Jot down a quick thought..."
            className="w-full bg-transparent resize-none outline-none min-h-[100px]"
            style={{ color: 'var(--mobile-text-primary)' }}
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleAddNote}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full transition-transform active:scale-95"
              style={{ backgroundColor: 'var(--mobile-primary)', color: 'white', fontWeight: 600 }}
            >
              <Plus size={18} />
              <span>Save Note</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--mobile-text-primary)' }}>Previous Notes</h2>
          {notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 opacity-50">
              <FileText size={48} style={{ color: 'var(--mobile-text-secondary)', marginBottom: '16px' }} />
              <p style={{ color: 'var(--mobile-text-secondary)' }}>No quick notes yet.</p>
            </div>
          ) : (
            notes.map(note => (
              <div 
                key={note.id}
                className="p-4 rounded-[20px] flex gap-3 animate-in fade-in slide-in-from-bottom-2"
                style={{ backgroundColor: 'var(--mobile-surface-raised)', border: '1px solid var(--mobile-border)' }}
              >
                <div className="flex-1 whitespace-pre-wrap" style={{ color: 'var(--mobile-text-primary)', fontSize: '15px', lineHeight: 1.5 }}>
                  {note.text}
                  <div className="mt-2 text-xs" style={{ color: 'var(--mobile-text-secondary)' }}>
                    {new Date(note.date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="p-1.5 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95"
                  style={{ color: 'var(--mobile-text-secondary)', opacity: 0.6 }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
