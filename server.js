const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Middleware para logs
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Servir arquivos estáticos do build
app.use(express.static(path.join(__dirname, 'dist')));

// Estado global das filas (em produção, usar Redis ou banco de dados)
let globalQueues = {
  SUPORTE: { current: null, queue: [], lastCalled: [], nextNumber: 1, totalServed: 0 },
  HARDWARE: { current: null, queue: [], lastCalled: [], nextNumber: 1, totalServed: 0 },
  TELEFONIA: { current: null, queue: [], lastCalled: [], nextNumber: 1, totalServed: 0 },
  ATIVOS: { current: null, queue: [], lastCalled: [], nextNumber: 1, totalServed: 0 },
};

io.on('connection', (socket) => {
  console.log(`🔗 Cliente conectado: ${socket.id} - Total: ${io.engine.clientsCount}`);

  // Enviar estado atual para o cliente recém-conectado
  socket.emit('queue-update', { queues: globalQueues });

  // Escutar eventos dos clientes
  socket.on('ticket-generated', (data) => {
    console.log(`🎫 Senha gerada - Setor: ${data.sector}, Número: ${data.ticket.number}`);
    // Atualizar estado global
    globalQueues[data.sector].queue.push(data.ticket);
    globalQueues[data.sector].nextNumber = data.nextNumber;
    
    // Broadcast para todos os clientes
    io.emit('ticket-generated', data);
  });

  socket.on('ticket-called', (data) => {
    console.log(`📢 Senha chamada - Setor: ${data.sector}, Número: ${data.current?.number}`);
    // Atualizar estado global
    globalQueues[data.sector] = {
      ...globalQueues[data.sector],
      current: data.current,
      queue: data.queue,
      lastCalled: data.lastCalled,
      totalServed: data.totalServed
    };
    
    // Broadcast para todos os clientes
    io.emit('ticket-called', data);
  });

  socket.on('queue-reset', (data) => {
    console.log(`🔄 Reset - Setor: ${data.sector}`);
    if (data.sector === 'ALL') {
      globalQueues = {
        SUPORTE: { current: null, queue: [], lastCalled: [], nextNumber: 1, totalServed: 0 },
        HARDWARE: { current: null, queue: [], lastCalled: [], nextNumber: 1, totalServed: 0 },
        TELEFONIA: { current: null, queue: [], lastCalled: [], nextNumber: 1, totalServed: 0 },
        ATIVOS: { current: null, queue: [], lastCalled: [], nextNumber: 1, totalServed: 0 },
      };
    } else {
      globalQueues[data.sector] = {
        current: null,
        queue: [],
        lastCalled: [],
        nextNumber: 1,
        totalServed: 0
      };
    }
    
    // Broadcast para todos os clientes
    io.emit('queue-reset', data);
  });

  socket.on('analytics-update', (data) => {
    console.log(`📊 Analytics update - Type: ${data.type}, Setor: ${data.sector}`);
    // Broadcast para todos os clientes
    io.emit('analytics-update', data);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Cliente desconectado: ${socket.id} - Total: ${io.engine.clientsCount}`);
  });
});

// Rota catch-all para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});