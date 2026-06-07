import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getTheme, cardStyle } from '../../utils/theme';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
  ]
};

export default function VideoCallPage() {
  const { user, socket, darkMode } = useAuth();
  const t = getTheme(darkMode);

  const [screen, setScreen]               = useState('lobby');
  const [roomInput, setRoomInput]         = useState('');
  const [roomId, setRoomId]               = useState('');
  const [muted, setMuted]                 = useState(false);
  const [videoOff, setVideoOff]           = useState(false);
  const [elapsed, setElapsed]             = useState(0);
  const [statusMsg, setStatusMsg]         = useState('');
  const [remoteName, setRemoteName]       = useState('');
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [messages, setMessages]           = useState([]);
  const [chatMsg, setChatMsg]             = useState('');
  const [showChat, setShowChat]           = useState(false);
  const [camError, setCamError]           = useState('');

  const localVideoRef     = useRef(null);
  const remoteVideoRef    = useRef(null);
  const localStream       = useRef(null);
  const pc                = useRef(null);
  const remoteSocketId    = useRef(null);
  const timerRef          = useRef(null);
  const pendingCandidates = useRef([]);
  const currentRoomId     = useRef(''); // FIX: ref so closures always see latest value

  const setStatus = (msg) => { setStatusMsg(msg); console.log('[WebRTC]', msg); };

  // ── Build PeerConnection ───────────────────────────────────────────────────
  const buildPC = useCallback(() => {
    if (pc.current) { pc.current.close(); pc.current = null; }
    const conn = new RTCPeerConnection(ICE_SERVERS);
    pc.current = conn;

    if (localStream.current) {
      localStream.current.getTracks().forEach(track =>
        conn.addTrack(track, localStream.current)
      );
    }

    conn.onicecandidate = ({ candidate }) => {
      if (candidate && remoteSocketId.current && socket) {
        socket.emit('webrtc:ice-candidate', {
          roomId: currentRoomId.current,
          to: remoteSocketId.current,
          candidate,
        });
      }
    };

    conn.oniceconnectionstatechange = () => {
      const s = conn.iceConnectionState;
      setStatus(`ICE: ${s}`);
      if (s === 'connected' || s === 'completed') {
        setRemoteConnected(true);
        setStatus('Connected ✅');
      }
      if (s === 'disconnected' || s === 'failed' || s === 'closed') {
        setRemoteConnected(false);
        setStatus('Peer disconnected');
      }
    };

    // KEY: receive remote video — set srcObject directly on the ref
    conn.ontrack = (event) => {
      console.log('[WebRTC] ontrack fired', event.streams);
      const remoteStream = event.streams?.[0];
      if (remoteStream && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(e => console.warn('remote play()', e));
        setRemoteConnected(true);
        setStatus('Video connected ✅');
      }
    };

    return conn;
  }, [socket]);

  // ── Start camera ───────────────────────────────────────────────────────────
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      localStream.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
        localVideoRef.current.play().catch(() => {});
      }
      setCamError('');
      return stream;
    } catch (err) {
      const msg =
        err.name === 'NotAllowedError' ? 'Camera/mic permission denied. Please allow access in browser settings.' :
        err.name === 'NotFoundError'   ? 'No camera/microphone found on this device.' :
        `Camera error: ${err.message}`;
      setCamError(msg);
      return null;
    }
  };

  // ── Join room ──────────────────────────────────────────────────────────────
  const joinRoom = async () => {
    const room = roomInput.trim().toUpperCase();
    if (!room)   return alert('Please enter a Room ID');
    if (!socket) return alert('Not connected to server. Please refresh.');

    const stream = await startCamera();
    if (!stream) return;

    // FIX: store in ref immediately so socket handlers can read it
    currentRoomId.current = room;
    setRoomId(room);
    setScreen('call');
    setStatus('Joining room...');
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);

    socket.emit('webrtc:join', {
      roomId:   room,
      userId:   user?._id,
      userName: user?.name || 'User',
      role:     user?.role  || 'patient',
    });
  };

  // ── Socket events ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // I joined — backend sends back who is already in the room
    const onExistingPeers = async (peers) => {
      if (peers.length === 0) {
        setStatus('Waiting for the other participant...');
        return;
      }
      const peer = peers[0];
      remoteSocketId.current = peer.socketId;
      setRemoteName(peer.userName);
      setStatus(`Calling ${peer.userName}...`);

      const conn = buildPC();
      const offer = await conn.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await conn.setLocalDescription(offer);

      socket.emit('webrtc:offer', {
        roomId:         currentRoomId.current,   // FIX: use ref, not state
        targetSocketId: peer.socketId,
        offer:          conn.localDescription,
      });
    };

    // Someone joined after me — wait for their offer
    const onPeerJoined = ({ socketId, userName }) => {
      remoteSocketId.current = socketId;
      setRemoteName(userName);
      setStatus(`${userName} joined — waiting for connection...`);
    };

    // FIX: backend emits 'webrtc_offer' (underscore) — listen to that
    const onOffer = async ({ offer, from, fromName }) => {
      remoteSocketId.current = from;
      setRemoteName(fromName || 'Remote User');
      setStatus(`Incoming call from ${fromName || 'Remote User'}...`);

      const conn = buildPC();
      await conn.setRemoteDescription(new RTCSessionDescription(offer));

      // Flush queued ICE candidates
      for (const c of pendingCandidates.current) {
        await conn.addIceCandidate(new RTCIceCandidate(c)).catch(console.warn);
      }
      pendingCandidates.current = [];

      const answer = await conn.createAnswer();
      await conn.setLocalDescription(answer);

      socket.emit('webrtc:answer', {
        roomId:         currentRoomId.current,   // FIX: use ref
        targetSocketId: from,
        answer:         conn.localDescription,
      });
    };

    // FIX: backend emits 'webrtc_answer' (underscore)
    const onAnswer = async ({ answer }) => {
      setStatus('Answer received — establishing connection...');
      if (pc.current && pc.current.signalingState !== 'closed') {
        await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    // FIX: backend emits 'ice_candidate' (underscore)
    const onIceCandidate = async ({ candidate }) => {
      if (!pc.current || pc.current.signalingState === 'closed') return;
      if (!pc.current.remoteDescription) {
        pendingCandidates.current.push(candidate);
        return;
      }
      try { await pc.current.addIceCandidate(new RTCIceCandidate(candidate)); }
      catch (e) { console.warn('ICE candidate error', e); }
    };

    const onPeerLeft = ({ socketId }) => {
      if (socketId === remoteSocketId.current) {
        setRemoteConnected(false);
        setRemoteName('');
        setStatus('Other participant left the call');
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        if (pc.current) { pc.current.close(); pc.current = null; }
        remoteSocketId.current = null;
      }
    };

    const onCallMessage = ({ message, senderName, timestamp }) => {
      setMessages(prev => [...prev, { message, senderName, timestamp, own: false }]);
    };

    // FIX: use correct event names that backend actually emits
    socket.on('existing_peers',      onExistingPeers);
    socket.on('peer_joined',         onPeerJoined);
    socket.on('webrtc_offer',        onOffer);         // underscore
    socket.on('webrtc_answer',       onAnswer);        // underscore
    socket.on('ice_candidate',       onIceCandidate);  // underscore
    socket.on('peer_left',           onPeerLeft);
    socket.on('call_message',        onCallMessage);

    return () => {
      socket.off('existing_peers',  onExistingPeers);
      socket.off('peer_joined',     onPeerJoined);
      socket.off('webrtc_offer',    onOffer);
      socket.off('webrtc_answer',   onAnswer);
      socket.off('ice_candidate',   onIceCandidate);
      socket.off('peer_left',       onPeerLeft);
      socket.off('call_message',    onCallMessage);
    };
  }, [socket, buildPC, user]);

  // Re-attach local video whenever screen switches to 'call'
  useEffect(() => {
    if (screen === 'call' && localStream.current && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream.current;
      localVideoRef.current.muted = true;
      localVideoRef.current.play().catch(() => {});
    }
  }, [screen]);

  // ── Controls ───────────────────────────────────────────────────────────────
  const toggleMute = () => {
    localStream.current?.getAudioTracks().forEach(t => { t.enabled = muted; });
    setMuted(m => !m);
  };

  const toggleVideo = () => {
    localStream.current?.getVideoTracks().forEach(t => { t.enabled = videoOff; });
    setVideoOff(v => !v);
  };

  const endCall = () => {
    socket?.emit('webrtc:leave', { roomId: currentRoomId.current });
    localStream.current?.getTracks().forEach(t => t.stop());
    if (pc.current) { pc.current.close(); pc.current = null; }
    localStream.current = null;
    remoteSocketId.current = null;
    pendingCandidates.current = [];
    currentRoomId.current = '';
    clearInterval(timerRef.current);
    setScreen('lobby'); setRoomInput(''); setRoomId('');
    setMuted(false); setVideoOff(false); setElapsed(0);
    setRemoteConnected(false); setRemoteName('');
    setMessages([]); setStatus(''); setShowChat(false);
  };

  const sendChat = () => {
    if (!chatMsg.trim()) return;
    socket?.emit('call_message', { roomId: currentRoomId.current, message: chatMsg, senderName: user?.name });
    setMessages(prev => [...prev, { message: chatMsg, senderName: user?.name, own: true, timestamp: new Date() }]);
    setChatMsg('');
  };

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const generateRoom = () => setRoomInput('ROOM-' + Math.random().toString(36).slice(2, 7).toUpperCase());

  // ══════════════════════════════════════════════════════════════════════════
  // LOBBY
  // ══════════════════════════════════════════════════════════════════════════
  if (screen === 'lobby') {
    return (
      <div style={{ background: t.bg, minHeight: '100vh', padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 520 }}>
          <div style={{ ...cardStyle(t), padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>🎥</div>
            <h1 style={{ color: t.text, fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Video Consultation</h1>
            <p style={{ color: t.textSub, fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
              Enter the same <strong>Room ID</strong> on both Patient and Doctor devices to connect.<br />
              Your call is end-to-end encrypted via WebRTC.
            </p>

            {camError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, fontWeight: 600 }}>
                ⚠️ {camError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <input
                value={roomInput}
                onChange={e => setRoomInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && joinRoom()}
                placeholder="e.g. ROOM-APPT01"
                style={{ flex: 1, padding: '14px 18px', borderRadius: 12, border: `2px solid ${t.cardBorder}`, background: t.inputBg, color: t.text, fontSize: 16, outline: 'none', fontWeight: 700, letterSpacing: 1, textAlign: 'center' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
              <button onClick={joinRoom} style={{ flex: 2, padding: '13px', background: 'linear-gradient(135deg,#0891b2,#06b6d4)', color: 'white', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>
                🎥 Join Call
              </button>
              <button onClick={generateRoom} style={{ flex: 1, padding: '13px', background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', color: t.text, border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                🎲 Generate
              </button>
            </div>

            <div style={{ background: darkMode ? 'rgba(8,145,178,0.08)' : 'rgba(8,145,178,0.05)', border: '1px solid rgba(8,145,178,0.2)', borderRadius: 14, padding: 20, textAlign: 'left' }}>
              <div style={{ fontWeight: 700, color: '#0891b2', fontSize: 14, marginBottom: 12 }}>📋 How to connect Patient ↔ Doctor</div>
              {[
                ['1️⃣', 'Doctor',  'Go to Doctor Dashboard → Video Call → Generate a Room ID'],
                ['2️⃣', 'Doctor',  'Share the Room ID with your patient (via chat or phone)'],
                ['3️⃣', 'Patient', 'Go to Patient Dashboard → Video Call → Enter the same Room ID'],
                ['4️⃣', 'Both',    'Click "Join Call" — video connects automatically!'],
              ].map(([step, who, text]) => (
                <div key={step} style={{ display: 'flex', gap: 10, marginBottom: 10, fontSize: 13 }}>
                  <span>{step}</span>
                  <div><strong style={{ color: t.text }}>{who}:</strong> <span style={{ color: t.textSub }}>{text}</span></div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 24 }}>
              {[['🔒', 'Encrypted'], ['📹', 'HD Video'], ['🎙️', 'HD Audio'], ['💬', 'Live Chat']].map(([icon, label]) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem' }}>{icon}</div>
                  <div style={{ fontSize: 11, color: t.textSub, marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CALL SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ background: '#0a0f1a', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 22 }}>🏥</div>
          <div>
            <div style={{ color: 'white', fontWeight: 800, fontSize: 15 }}>MediCare+ Video Call</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Room: <strong style={{ color: '#06b6d4' }}>{roomId}</strong></div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '5px 12px', color: 'white', fontSize: 13, fontWeight: 700 }}>⏱ {fmt(elapsed)}</div>
          <div style={{ background: remoteConnected ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)', borderRadius: 8, padding: '5px 12px', color: remoteConnected ? '#10b981' : '#f59e0b', fontSize: 12, fontWeight: 700 }}>
            {remoteConnected ? '● Connected' : '● Waiting...'}
          </div>
          {statusMsg && <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{statusMsg}</div>}
        </div>
      </div>

      {/* Video area */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>

        {/* Remote — full screen background */}
        <div style={{ flex: 1, position: 'relative', background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {!remoteConnected && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <div style={{ fontSize: '4rem', marginBottom: 16 }}>{remoteName ? '👤' : '⏳'}</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                {remoteName ? `Connecting with ${remoteName}...` : 'Waiting for participant...'}
              </div>
              <div style={{ fontSize: 13, opacity: 0.6 }}>Share Room ID: <strong style={{ color: '#06b6d4' }}>{roomId}</strong></div>
            </div>
          )}
          {remoteName && remoteConnected && (
            <div style={{ position: 'absolute', bottom: 16, left: 16, background: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: '5px 12px', color: 'white', fontSize: 13, fontWeight: 600 }}>
              👤 {remoteName}
            </div>
          )}
        </div>

        {/* Local — picture-in-picture */}
        <div style={{ position: 'absolute', bottom: 90, right: 24, width: 200, height: 140, borderRadius: 14, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.25)', background: '#1e293b', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 10 }}>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: videoOff ? 'none' : 'block', transform: 'scaleX(-1)' }}
          />
          {videoOff && (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem' }}>
              📷<div style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>Camera Off</div>
            </div>
          )}
          <div style={{ position: 'absolute', bottom: 6, left: 8, color: 'white', fontSize: 11, fontWeight: 600, opacity: 0.8 }}>You</div>
        </div>

        {/* Chat sidebar */}
        {showChat && (
          <div style={{ width: 280, background: 'rgba(15,23,42,0.95)', borderLeft: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', padding: 14 }}>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>💬 Chat</div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12, maxHeight: 'calc(100vh - 240px)' }}>
              {messages.length === 0 && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center', marginTop: 20 }}>No messages yet</div>}
              {messages.map((m, i) => (
                <div key={i} style={{ alignSelf: m.own ? 'flex-end' : 'flex-start', maxWidth: '90%' }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 2, textAlign: m.own ? 'right' : 'left' }}>{m.senderName}</div>
                  <div style={{ background: m.own ? 'linear-gradient(135deg,#0891b2,#06b6d4)' : 'rgba(255,255,255,0.1)', color: 'white', borderRadius: m.own ? '12px 12px 2px 12px' : '12px 12px 12px 2px', padding: '8px 12px', fontSize: 13 }}>
                    {m.message}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={chatMsg} onChange={e => setChatMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()}
                placeholder="Type..." style={{ flex: 1, padding: '9px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: 'white', fontSize: 13, outline: 'none' }} />
              <button onClick={sendChat} style={{ padding: '9px 14px', borderRadius: 10, background: '#0891b2', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>→</button>
            </div>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, padding: '16px 24px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', flexWrap: 'wrap' }}>
        <button onClick={toggleMute} title={muted ? 'Unmute' : 'Mute'} style={{ width: 56, height: 56, borderRadius: '50%', border: 'none', background: muted ? '#ef4444' : 'rgba(255,255,255,0.15)', color: 'white', cursor: 'pointer', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {muted ? '🔇' : '🎙️'}
        </button>
        <button onClick={toggleVideo} title={videoOff ? 'Turn on camera' : 'Turn off camera'} style={{ width: 56, height: 56, borderRadius: '50%', border: 'none', background: videoOff ? '#ef4444' : 'rgba(255,255,255,0.15)', color: 'white', cursor: 'pointer', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {videoOff ? '📷' : '🎥'}
        </button>
        <button onClick={() => setShowChat(c => !c)} style={{ width: 56, height: 56, borderRadius: '50%', border: 'none', background: showChat ? '#0891b2' : 'rgba(255,255,255,0.15)', color: 'white', cursor: 'pointer', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          💬
          {messages.length > 0 && !showChat && <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, background: '#ef4444', borderRadius: '50%' }} />}
        </button>
        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 18px', color: 'white', fontSize: 13, textAlign: 'center' }}>
          <div style={{ opacity: 0.6, fontSize: 10, marginBottom: 2 }}>ROOM ID</div>
          <div style={{ fontWeight: 800, letterSpacing: 1, color: '#06b6d4', cursor: 'pointer' }} onClick={() => { navigator.clipboard?.writeText(roomId); alert('Room ID copied!'); }}>
            {roomId} 📋
          </div>
        </div>
        <button onClick={endCall} style={{ height: 56, padding: '0 28px', borderRadius: 28, border: 'none', background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: 'white', cursor: 'pointer', fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
          📵 End Call
        </button>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </div>
  );
}