import React, { useState } from 'react';
import { Plus, X, Receipt, CheckSquare, StickyNote } from 'lucide-react';
import api from '../services/api';

export default function QuickCapture({ isOpen: controlledIsOpen, onClose, isPopupMode }) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  const isOpen = isPopupMode ? controlledIsOpen : internalIsOpen;
  
  const handleClose = () => {
    if (isPopupMode && onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const [activeTab, setActiveTab] = useState('expense');
  
  // Expense Form
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [note, setNote] = useState('');
  
  // Task Form
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  
  // Note Form
  const [scratchpad, setScratchpad] = useState('');

  const showToast = () => {
    alert('Saved!');
    handleClose();
    // Reset forms
    setAmount(''); setCategory('Food'); setNote('');
    setTitle(''); setDueDate(''); setPriority('Medium');
    setScratchpad('');
  };

  const handleExpense = async (e) => {
    e.preventDefault();
    try {
      await api.post('/expenses', { amount: Number(amount), category, note });
      showToast();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving expense');
    }
  };

  const handleTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks', { title, dueDate, priority });
      showToast();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving task');
    }
  };

  const handleNote = (e) => {
    e.preventDefault();
    if (!scratchpad.trim()) return;
    const existing = JSON.parse(localStorage.getItem('synapse_notes') || '[]');
    existing.push({ text: scratchpad, date: new Date().toISOString() });
    localStorage.setItem('synapse_notes', JSON.stringify(existing));
    window.dispatchEvent(new Event('synapse_notes_updated'));
    showToast();
  };

  return (
    <>
      {!isPopupMode && (
        <button 
          onClick={() => setInternalIsOpen(true)}
          className={`fixed bottom-6 right-6 w-14 h-14 bg-white text-slate-600 border border-slate-200 rounded-full flex items-center justify-center shadow-lg hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 hover:scale-110 hover:shadow-xl hover:shadow-indigo-600/20 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 z-40 group ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
          aria-label="Quick Capture"
        >
          <Plus className="w-6 h-6 transition-transform duration-300 group-hover:rotate-90" />
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4 sm:p-0">
          <div className="bg-white rounded-2xl w-full max-w-[320px] shadow-2xl overflow-hidden flex flex-col mb-20 sm:mb-0">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-800">Quick Capture</h3>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5"/>
              </button>
            </div>
            
            <div className="flex border-b border-gray-100">
              <button onClick={() => setActiveTab('expense')} className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 transition-colors ${activeTab === 'expense' ? 'text-indigo-600 bg-indigo-50/50 border-b-2 border-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                <Receipt className="w-4 h-4"/> Expense
              </button>
              <button onClick={() => setActiveTab('task')} className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 transition-colors ${activeTab === 'task' ? 'text-indigo-600 bg-indigo-50/50 border-b-2 border-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                <CheckSquare className="w-4 h-4"/> Task
              </button>
              <button onClick={() => setActiveTab('note')} className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 transition-colors ${activeTab === 'note' ? 'text-indigo-600 bg-indigo-50/50 border-b-2 border-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                <StickyNote className="w-4 h-4"/> Note
              </button>
            </div>

            <div className="p-5">
              {activeTab === 'expense' && (
                <form onSubmit={handleExpense} className="flex flex-col gap-3">
                  <input type="number" required placeholder="Amount (₹)" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500">
                    <option value="Food">Food</option>
                    <option value="Transport">Transport</option>
                    <option value="Books">Books</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Hostel">Hostel</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                  <input type="text" placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                  <button type="submit" className="w-full bg-indigo-600 text-white font-bold text-sm py-2.5 rounded-lg mt-2 hover:bg-indigo-700">Log Expense</button>
                </form>
              )}

              {activeTab === 'task' && (
                <form onSubmit={handleTask} className="flex flex-col gap-3">
                  <input type="text" required placeholder="Task title" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                  <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                  <button type="submit" className="w-full bg-indigo-600 text-white font-bold text-sm py-2.5 rounded-lg mt-2 hover:bg-indigo-700">Add Task</button>
                </form>
              )}

              {activeTab === 'note' && (
                <form onSubmit={handleNote} className="flex flex-col gap-3">
                  <textarea required placeholder="Jot down a quick thought..." value={scratchpad} onChange={e => setScratchpad(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 min-h-[100px] resize-none" />
                  <button type="submit" className="w-full bg-indigo-600 text-white font-bold text-sm py-2.5 rounded-lg mt-2 hover:bg-indigo-700">Save Note</button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
