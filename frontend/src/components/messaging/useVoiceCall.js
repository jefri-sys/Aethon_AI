import { useState, useRef, useEffect } from 'react';
import Peer from 'simple-peer';

const useVoiceCall = (socket, currentUserId) => {
  const [callStatus, setCallStatus] = useState('idle'); 
  const [remoteUserId, setRemoteUserId] = useState(null);
  const [callerInfo, setCallerInfo] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  
  const peerRef = useRef(null);
  const streamRef = useRef(null);
  const audioRef = useRef(null); 

  const turnConfig = {
    iceServers: [
      {
        urls: import.meta.env.VITE_TURN_URL,
        username: import.meta.env.VITE_TURN_USERNAME,
        credential: import.meta.env.VITE_TURN_CREDENTIAL
      },
      {
        urls: 'stun:stun.l.google.com:19302'
      }
    ]
  };

  useEffect(() => {
    if (!socket) return;

    const handleIncoming = ({ callerId, callerInfo, conversationId }) => {
      if (callStatus !== 'idle') return; 
      setCallStatus('receiving');
      setRemoteUserId(callerId);
      setCallerInfo(callerInfo);
      setConversationId(conversationId);
    };

    const handleOffer = ({ callerId, offer }) => {
      if (peerRef.current) {
        peerRef.current.signal(offer);
      } else {
        peerRef.currentOffer = offer;
      }
    };

    const handleAnswer = ({ answer }) => {
      if (peerRef.current) {
        peerRef.current.signal(answer);
      }
    };

    const handleIceCandidate = ({ candidate }) => {
      if (peerRef.current) {
        peerRef.current.signal(candidate);
      }
    };

    const handleEnded = () => {
      cleanup();
    };

    socket.on('call:incoming', handleIncoming);
    socket.on('call:offer', handleOffer);
    socket.on('call:answer', handleAnswer);
    socket.on('call:ice-candidate', handleIceCandidate);
    socket.on('call:ended', handleEnded);

    return () => {
      socket.off('call:incoming', handleIncoming);
      socket.off('call:offer', handleOffer);
      socket.off('call:answer', handleAnswer);
      socket.off('call:ice-candidate', handleIceCandidate);
      socket.off('call:ended', handleEnded);
    };
  }, [socket, callStatus]);

  const initiateCall = async (recipientId, callerData, convId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setCallStatus('calling');
      setRemoteUserId(recipientId);
      setConversationId(convId);

      socket.emit('call:initiate', { recipientId, callerInfo: callerData, conversationId: convId });

      const peer = new Peer({
        initiator: true,
        stream,
        config: turnConfig
      });

      peer.on('signal', data => {
        if (data.type === 'offer') {
          socket.emit('call:offer', { recipientId, offer: data });
        } else if (data.type === 'answer') {
           
        } else {
          socket.emit('call:ice-candidate', { recipientId, candidate: data });
        }
      });

      peer.on('stream', remoteStream => {
        setCallStatus('connected');
        if (audioRef.current) {
          audioRef.current.srcObject = remoteStream;
        }
      });

      peerRef.current = peer;
    } catch (err) {
      console.error('Failed to initiate call:', err);
      cleanup();
    }
  };

  const acceptCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const peer = new Peer({
        initiator: false,
        stream,
        config: turnConfig
      });

      peer.on('signal', data => {
        if (data.type === 'answer') {
          socket.emit('call:answer', { callerId: remoteUserId, answer: data });
        } else {
          socket.emit('call:ice-candidate', { recipientId: remoteUserId, candidate: data });
        }
      });

      peer.on('stream', remoteStream => {
        setCallStatus('connected');
        if (audioRef.current) {
          audioRef.current.srcObject = remoteStream;
        }
      });

      peerRef.current = peer;

      if (peerRef.currentOffer) {
        peer.signal(peerRef.currentOffer);
        peerRef.currentOffer = null;
      }
      
    } catch (err) {
      console.error('Failed to accept call:', err);
      cleanup();
    }
  };

  const endCall = () => {
    if (socket && remoteUserId) {
      socket.emit('call:end', { recipientId: remoteUserId });
    }
    cleanup();
  };

  const cleanup = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCallStatus('idle');
    setRemoteUserId(null);
    setCallerInfo(null);
    setConversationId(null);
  };

  return {
    callStatus,
    remoteUserId,
    callerInfo,
    initiateCall,
    acceptCall,
    endCall,
    audioRef
  };
};

export default useVoiceCall;
