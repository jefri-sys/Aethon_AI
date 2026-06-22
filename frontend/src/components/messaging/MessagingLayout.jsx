import React, { useState } from 'react';

const MessagingLayout = ({ 
  conversations, 
  activeConversationId, 
  onSelectConversation, 
  friends, 
  requests, 
  searchQuery,
  setSearchQuery,
  searchResults,
  onAddFriend,
  onAcceptFriend,
  onRejectFriend,
  onUnfriend,
  onStartDM,
  currentUserId,
  centerContent,
  rightContent
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chats'); // chats, people
  const [peopleSubTab, setPeopleSubTab] = useState('friends'); // friends, requests

  const sortedConversations = [...(conversations || [])].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  
  const getUnreadCount = (conv) => {
    // Dummy unread count logic or prop
    return conv.unreadCount || 0;
  };

  const getConvName = (conv) => {
    if (conv.type === 'group') return conv.groupName;
    const other = conv.participants?.find(p => p._id !== currentUserId);
    return other?.name || 'Unknown';
  };

  const getConvAvatar = (conv) => {
    if (conv.type === 'group') return conv.groupAvatar || `https://ui-avatars.com/api/?name=${conv.groupName || 'G'}`;
    const other = conv.participants?.find(p => p._id !== currentUserId);
    return other?.avatar || `https://ui-avatars.com/api/?name=${other?.name || 'U'}`;
  };

  return (
    <div className="flex h-full bg-gray-50 w-full overflow-hidden relative">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Left Panel */}
      <div className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-white border-r transform transition-transform duration-300 md:relative md:translate-x-0 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Tabs */}
        <div className="flex px-4 pt-6 pb-2 space-x-4 border-b">
          <button 
            onClick={() => setActiveTab('chats')} 
            className={`font-semibold pb-2 border-b-2 transition-colors ${activeTab === 'chats' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Chats
          </button>
          <button 
            onClick={() => setActiveTab('people')} 
            className={`font-semibold pb-2 border-b-2 transition-colors ${activeTab === 'people' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            People
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <svg className="w-5 h-5 absolute left-3 top-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-1.5 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {activeTab === 'chats' && (
            <div className="space-y-1 p-2">
              {sortedConversations.map(conv => {
                const unread = getUnreadCount(conv);
                const isActive = conv._id === activeConversationId;
                return (
                  <div 
                    key={conv._id}
                    onClick={() => {
                      onSelectConversation(conv);
                      setIsSidebarOpen(false);
                    }}
                    className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-indigo-50' : 'hover:bg-gray-100'}`}
                  >
                    <img src={getConvAvatar(conv)} alt="Avatar" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h4 className={`text-sm truncate ${isActive ? 'font-semibold text-indigo-900' : 'font-medium text-gray-900'}`}>{getConvName(conv)}</h4>
                        <span className="text-[10px] text-gray-400">
                          {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {conv.lastMessage?.content || 'No messages yet'}
                      </p>
                    </div>
                    {unread > 0 && (
                      <div className="ml-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 min-w-[20px] text-center">
                        {unread}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'people' && (
            <div className="flex flex-col h-full">
              <div className="flex px-4 py-2 space-x-2 bg-gray-50 border-b text-xs font-medium">
                <button 
                  onClick={() => setPeopleSubTab('friends')}
                  className={`px-3 py-1.5 rounded-full transition-colors ${peopleSubTab === 'friends' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-200'}`}
                >
                  Friends
                </button>
                <button 
                  onClick={() => setPeopleSubTab('requests')}
                  className={`px-3 py-1.5 rounded-full transition-colors ${peopleSubTab === 'requests' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-200'}`}
                >
                  Requests
                </button>
              </div>
              <div className="p-4 flex-1 overflow-y-auto no-scrollbar">
                {searchQuery && activeTab === 'people' ? (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Search Results</h3>
                    {searchResults.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">No users found</p>
                    ) : searchResults.map(user => (
                      <div key={user._id} className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg border border-transparent hover:border-gray-200 transition-colors">
                        <div className="flex items-center min-w-0">
                          <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} alt="" className="w-9 h-9 rounded-full shrink-0 object-cover" />
                          <div className="ml-3 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
                            <p className="text-xs text-gray-500 truncate">@{user.username || user.name.toLowerCase().replace(' ', '')}</p>
                          </div>
                        </div>
                        <button onClick={() => onAddFriend(user._id)} className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100 font-semibold shrink-0 ml-2">Add</button>
                      </div>
                    ))}
                  </div>
                ) : peopleSubTab === 'friends' ? (
                  <div className="space-y-2">
                    {friends.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">You have no friends yet.</p>
                    ) : friends.map(friendship => {
                      const friend = friendship.requester?._id === currentUserId ? friendship.recipient : friendship.requester;
                      if (!friend) return null;
                      return (
                        <div key={friendship._id} className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg group">
                          <div className="flex items-center min-w-0">
                            <img src={friend.avatar || `https://ui-avatars.com/api/?name=${friend.name}`} alt="" className="w-9 h-9 rounded-full shrink-0 object-cover" />
                            <div className="ml-3 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{friend.name}</p>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                            <button onClick={() => { onStartDM(friend._id); setActiveTab('chats'); }} className="text-xs bg-white border border-gray-200 shadow-sm px-3 py-1.5 rounded-lg hover:bg-gray-50 font-semibold shrink-0">Message</button>
                            <button onClick={() => onUnfriend(friend._id)} className="p-1.5 text-red-500 bg-white border border-red-200 shadow-sm rounded-lg hover:bg-red-50 shrink-0" title="Unfriend">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11" transform="rotate(45 19 11)"/></svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {requests.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">No pending requests.</p>
                    ) : requests.map(req => {
                      if (!req.requester) return null;
                      return (
                      <div key={req._id} className="flex flex-col p-3 bg-white border border-gray-100 shadow-sm rounded-lg mb-2">
                        <div className="flex items-center min-w-0 mb-3">
                          <img src={req.requester.avatar || `https://ui-avatars.com/api/?name=${req.requester.name}`} alt="" className="w-9 h-9 rounded-full shrink-0 object-cover" />
                          <div className="ml-3 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{req.requester.name}</p>
                            <p className="text-xs text-gray-500">Sent you a request</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button onClick={() => onAcceptFriend(req._id)} className="flex-1 text-xs bg-indigo-600 text-white px-2 py-2 rounded-md hover:bg-indigo-700 font-medium transition-colors">Accept</button>
                          <button onClick={() => onRejectFriend(req._id)} className="flex-1 text-xs bg-red-50 text-red-600 px-2 py-2 rounded-md hover:bg-red-100 font-medium transition-colors">Decline</button>
                        </div>
                      </div>
                    )})}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center Panel */}
      <div className="flex-1 flex flex-col h-full bg-white relative min-w-0">
        <div className="md:hidden flex items-center p-4 border-b bg-white">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 mr-2 hover:bg-gray-100 rounded-full">
            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <span className="font-semibold text-gray-800">Messages</span>
        </div>
        {centerContent}
      </div>

      {/* Right Panel (Optional) */}
      {rightContent && (
        <div className="hidden lg:block w-[260px] bg-gray-50 border-l flex-shrink-0">
          {rightContent}
        </div>
      )}

    </div>
  );
};

export default MessagingLayout;
