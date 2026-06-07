const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');

const rooms = {};  // roomId -> { participants: [{socketId, userName}], ... }

const init = (io) => {
  io.on('connection', (socket) => {

    // ── Join Room ──────────────────────────────────────────────────────────
    socket.on('webrtc:join', ({ roomId, userId, role, userName }) => {
      if (!rooms[roomId]) {
        rooms[roomId] = { participants: [], offers: {}, answers: {}, candidates: {} };
      }
      const room = rooms[roomId];

      socket.join(roomId);
      socket.roomId  = roomId;
      socket.userId  = userId;
      socket.userName = userName || 'User';

      // Avoid duplicate entries on reconnect
      if (!room.participants.find(p => p.socketId === socket.id)) {
        room.participants.push({ socketId: socket.id, userName: userName || 'User' });
      }

      console.log(`📹 ${userName || 'User'} joined room ${roomId} (${room.participants.length} total)`);

      // Send current participants (excluding self) so frontend knows who to call
      const existingPeers = room.participants.filter(p => p.socketId !== socket.id);
      socket.emit('existing_peers', existingPeers);

      // Notify others
      socket.to(roomId).emit('peer_joined', { socketId: socket.id, userName: userName || 'User' });
    });

    // ── Offer ──────────────────────────────────────────────────────────────
    socket.on('webrtc:offer', ({ roomId, offer, targetSocketId }) => {
      console.log('🔥 OFFER from', socket.id, '→', targetSocketId || `room ${roomId}`);
      if (!rooms[roomId]) return;

      // FIX: emit 'webrtc_offer' (underscore) — matches frontend listener
      const payload = { offer, from: socket.id, fromName: socket.userName || 'Remote User' };
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc_offer', payload);
      } else {
        socket.to(roomId).emit('webrtc_offer', payload);
      }
    });

    // ── Answer ─────────────────────────────────────────────────────────────
    socket.on('webrtc:answer', ({ roomId, answer, targetSocketId }) => {
      console.log('🔥 ANSWER from', socket.id, '→', targetSocketId || `room ${roomId}`);
      if (!rooms[roomId]) return;

      // FIX: emit 'webrtc_answer' (underscore) — matches frontend listener
      const payload = { answer, from: socket.id };
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc_answer', payload);
      } else {
        socket.to(roomId).emit('webrtc_answer', payload);
      }
    });

    // ── ICE Candidate ──────────────────────────────────────────────────────
    socket.on('webrtc:ice-candidate', ({ roomId, candidate, to, targetSocketId }) => {
      if (!rooms[roomId]) return;

      const dest = to || targetSocketId;
      // FIX: emit 'ice_candidate' (underscore) — matches frontend listener
      const payload = { candidate, from: socket.id };
      if (dest) {
        io.to(dest).emit('ice_candidate', payload);
      } else {
        socket.to(roomId).emit('ice_candidate', payload);
      }
    });

    // ── Toggle media (mute/video off) ──────────────────────────────────────
    socket.on('webrtc:toggle-media', ({ roomId, video, audio }) => {
      socket.to(roomId).emit('webrtc:peer-media-change', { socketId: socket.id, video, audio });
    });

    // ── Chat ───────────────────────────────────────────────────────────────
    socket.on('call_message', ({ roomId, message, senderName }) => {
      socket.to(roomId).emit('call_message', { message, senderName, timestamp: new Date() });
    });

    // ── Leave ──────────────────────────────────────────────────────────────
    socket.on('webrtc:leave', ({ roomId }) => handleLeave(socket, roomId, io));
    socket.on('disconnect',   ()           => { if (socket.roomId) handleLeave(socket, socket.roomId, io); });

    // ── Doctor call notification ───────────────────────────────────────────
    socket.on('patient:calling-doctor', ({ roomId, patientId, patientName }) => {
      console.log(`📞 ${patientName} is calling. Room: ${roomId}`);
      // Broadcast to all connected doctor sockets (they joined with join_room)
      io.emit('patient:calling-doctor', { roomId, patientId, patientName });
    });
  });
};

const handleLeave = (socket, roomId, io) => {
  if (rooms[roomId]) {
    rooms[roomId].participants = rooms[roomId].participants.filter(p => p.socketId !== socket.id);
    if (rooms[roomId].participants.length === 0) delete rooms[roomId];
  }
  socket.to(roomId).emit('peer_left', { socketId: socket.id });
  socket.leave(roomId);
  console.log(`👋 ${socket.userName || socket.id} left room ${roomId}`);
};

/**
 * @swagger
 * /api/webrtc/room:
 *   post:
 *     summary: Create a new video call room
 *     tags: [WebRTC]
 */
router.post('/room', (req, res) => {
  const roomId = uuidv4();
  rooms[roomId] = { participants: [], offers: {}, answers: {}, candidates: {}, createdAt: new Date() };
  res.json({ success: true, roomId });
});

/**
 * @swagger
 * /api/webrtc/room/{roomId}:
 *   get:
 *     summary: Get room info
 *     tags: [WebRTC]
 */
router.get('/room/:roomId', (req, res) => {
  const room = rooms[req.params.roomId];
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json({ roomId: req.params.roomId, participantCount: room.participants.length });
});

module.exports = { router, init };