const http = require('http');
const Koa = require('koa');
const cors = require('koa2-cors');
const WS = require('ws');

const app = new Koa();

app.use(
  cors({
    origin: '*',
    credentials: true,
    'Access-Control-Allow-Origin': true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  })
);

const port = process.env.PORT || 7070;
const server = http.createServer(app.callback());

const clients = [];
const chat = [];
const wsServer = new WS.Server({ server });

wsServer.on('connection', ws => {
  ws.on('message', msg => {
    const command = JSON.parse(msg);
	
    if (command.event === 'login') {
      const findNickname = clients.findIndex((client) => client.nick.toLowerCase() === command.message.toLowerCase());
	  
      if (findNickname === -1 && command.message != '' && command.message.length <= 16) {
        ws.nick = command.message;
        const clientsNicknameList = clients.map((client) => client.nick);
        ws.send(JSON.stringify({event: 'connect', message: clientsNicknameList}));
        clients.push(ws);

        for (let client of clients) {
          client.send(JSON.stringify({event: 'system', message: {action: 'login', nickname: ws.nick}}));
        }

      } if (findNickname != -1) {
        ws.send(JSON.stringify({event: 'inchat'}));
		ws.close(1000, 'Такой никнейм уже есть в чате');
      }
    }

    if (command.event === 'chat') {
      for (let client of clients) {
        client.send(JSON.stringify({event: 'chat', message: { nickname: ws.nick, text: command.message}}));
      }
    }
  });

  ws.on('close', () => {
    const findNickname = clients.findIndex((client) => client.nick === ws.nick);
    if (findNickname !== -1) {
      clients.splice(findNickname, 1);
      for (let client of clients) {
        client.send(JSON.stringify({event: 'system', message: { action: 'logout', nickname: ws.nick }}));
      }
    }
  });
});

server.listen(port, () => console.log('Server started in port: ' + port));