import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import useVoiceCall from '../../hooks/useVoiceCall';
import { useAuth } from '../../hooks/useAuth';

const CallOverlayContent = ({ callStatus, callType, remoteUserId, callerInfo, acceptCall, endCall, mediaRef, micError, streamRef }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const localVideoRef = React.useRef(null);

  useEffect(() => {
    let interval;
    if (callStatus === 'connected') {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    } else {
      setTimer(0);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  useEffect(() => {
    if (callType === 'video' && callStatus === 'connected' && localVideoRef.current && streamRef?.current) {
      localVideoRef.current.srcObject = streamRef.current;
    }
  }, [callType, callStatus, streamRef]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (micError) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md">
        <div className="bg-white/90 rounded-2xl shadow-xl p-6 flex flex-col items-center">
          <svg className="w-12 h-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Microphone/Camera Access Denied</h2>
          <p className="text-gray-600 mb-6 text-center max-w-xs">Please allow media access in your browser settings to make calls.</p>
          <button onClick={endCall} className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors">
            Close
          </button>
        </div>
      </div>
    );
  }

  if (callStatus === 'idle') return null;

  const toggleMute = () => {
    if (streamRef?.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const isVideoConnected = callType === 'video' && callStatus === 'connected';

  if (isMinimized && callStatus === 'connected') {
    return (
      <div className="fixed bottom-6 right-6 w-[200px] backdrop-blur-md bg-white/10 shadow-xl rounded-2xl p-3 flex items-center justify-between z-[100] border border-white/20 transition-all duration-300">
        {callType === 'voice' && <audio ref={mediaRef} autoPlay className="hidden" />}
        <div className="flex items-center space-x-2 overflow-hidden">
          <div className="relative flex-shrink-0">
            <img 
              src={callerInfo?.avatar || `https://ui-avatars.com/api/?name=${callerInfo?.name || 'User'}`} 
              alt="Avatar" 
              className="w-8 h-8 rounded-full object-cover border border-white/30"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-white"></div>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-gray-800 text-sm truncate">{callerInfo?.name || 'Unknown'}</span>
            <span className="text-xs text-blue-600 font-mono">{formatTime(timer)}</span>
          </div>
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0">
          <button onClick={() => setIsMinimized(false)} className="p-1.5 bg-white/50 hover:bg-white/80 rounded-full text-gray-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
          </button>
          <button onClick={endCall} className="p-1.5 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md ${isVideoConnected ? 'bg-black/90' : ''}`}>
      
      <div className={`relative flex flex-col items-center overflow-hidden shadow-2xl ${
        isVideoConnected 
          ? 'w-full max-w-4xl h-[80vh] p-0 rounded-none md:rounded-3xl bg-black' 
          : 'bg-white rounded-3xl p-8 w-80'
      }`}>
        
        {callType === 'voice' && <audio ref={mediaRef} autoPlay className="hidden" />}

        {isVideoConnected && (
          <div className="relative w-full h-full bg-black">
            {/* Remote Video */}
            <video ref={mediaRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
            
            {/* Local Video */}
            <video ref={localVideoRef} autoPlay playsInline muted className="absolute bottom-28 right-6 w-32 h-44 md:w-48 md:h-64 object-cover rounded-xl border-2 border-white/20 shadow-2xl bg-gray-900" />
            
            {/* Dark overlay at bottom for controls visibility */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
          </div>
        )}

        {callStatus === 'connected' && (
          <button onClick={() => setIsMinimized(true)} className={`absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10 ${callType === 'video' ? 'text-white hover:text-gray-200 bg-black/40 p-2 rounded-full' : ''}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
        )}

        {callStatus === 'calling' && (
          <>
            <div className="relative mb-6 w-32 h-32 flex items-center justify-center">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
              <div className="absolute inset-2 bg-indigo-500/30 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
              <div className="absolute inset-4 bg-indigo-500/40 rounded-full animate-ping" style={{ animationDuration: '1.5s' }}></div>
              <img 
                src={callerInfo?.avatar || `https://ui-avatars.com/api/?name=${callerInfo?.name || 'User'}`} 
                alt="Avatar" 
                className="w-20 h-20 rounded-full relative z-10 object-cover border-2 border-indigo-600 shadow-lg"
              />
            </div>
            <h2 className="text-xl font-bold mb-1 text-gray-800">{callerInfo?.name || 'User'}</h2>
            <p className="text-gray-500 mb-8">Calling...</p>
            <button onClick={endCall} className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105">
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l-8 8m0-8l8 8" /></svg>
            </button>
          </>
        )}

        {callStatus === 'receiving' && (
          <>
            <div className="relative mb-6 w-32 h-32 flex items-center justify-center">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
              <div className="absolute inset-2 bg-indigo-500/30 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
              <div className="absolute inset-4 bg-indigo-500/40 rounded-full animate-ping" style={{ animationDuration: '1.5s' }}></div>
              <img 
                src={callerInfo?.avatar || `https://ui-avatars.com/api/?name=${callerInfo?.name || 'User'}`} 
                alt="Avatar" 
                className="w-20 h-20 rounded-full relative z-10 object-cover border-2 border-indigo-600 shadow-lg"
              />
            </div>
            <h2 className="text-xl font-bold mb-1 text-gray-800">{callerInfo?.name || 'Unknown'}</h2>
            <p className="text-gray-500 mb-8 animate-pulse">Incoming call...</p>
            <div className="flex space-x-6">
              <button onClick={endCall} className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <button onClick={acceptCall} className="w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </button>
            </div>
          </>
        )}

        {callStatus === 'connected' && (
          <>
            {callType === 'voice' && (
              <div className="mb-6 relative mt-4">
                <img 
                  src={callerInfo?.avatar || `https://ui-avatars.com/api/?name=${callerInfo?.name || 'User'}`} 
                  alt="Avatar" 
                  className="w-20 h-20 rounded-full object-cover border-2 border-indigo-600 shadow-lg"
                />
                <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
            )}
            
            {callType === 'voice' && <h2 className="text-xl font-bold mb-1 text-gray-800">{callerInfo?.name || 'User'}</h2>}
            
            <p className={`font-mono mb-8 text-lg ${callType === 'video' ? 'absolute top-6 left-6 text-white bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full z-10' : 'text-blue-500'}`}>{formatTime(timer)}</p>
            
            <div className={`flex space-x-6 ${callType === 'video' ? 'absolute bottom-8 left-1/2 -translate-x-1/2 z-10' : ''}`}>
              <button onClick={toggleMute} className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-colors ${isMuted ? 'bg-gray-400' : 'bg-gray-800 hover:bg-gray-700'}`}>
                {isMuted ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                )}
              </button>
              <button onClick={endCall} className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

const CallOverlay = () => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');
      const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        auth: { token },
        withCredentials: true
      });
      setSocket(newSocket);
      return () => newSocket.disconnect();
    }
  }, [user]);

  const callProps = useVoiceCall(socket, user?._id || user?.id);

  useEffect(() => {
    const handleCallEvent = (e) => {
      if (callProps && callProps.initiateCall) {
        callProps.initiateCall(
          e.detail.recipientId, 
          { name: e.detail.recipientName, avatar: e.detail.recipientAvatar }, 
          { name: user.name, avatar: user.avatar },
          e.detail.type,
          e.detail.conversationId
        );
      }
    };
    window.addEventListener('synapse:call', handleCallEvent);
    return () => window.removeEventListener('synapse:call', handleCallEvent);
  }, [callProps, user]);

  if (!user || !socket) return null;

  return <CallOverlayContent {...callProps} />;
};

export default CallOverlay;
