const express = require('express');
const app = express();
const session = require('express-session');
const bodyParser = require('body-parser');
const http = require('http').createServer(app);
const io = require('socket.io')(http);

require('dotenv').config();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use(session({
	secret: process.env.SESSION_SECRET || 'secret',
	name: 'sessionID',
	resave: true,
	saveUninitialized: true,
	cookie: {
		httpOnly: false,
		secure: false
	}
}));


let players = {}


app.get('/', (req, res) => {
	res.render('choose_world');
});

app.get("/favicon.ico", (req, res) => {
  res.end();
})

app.get('/:seed', (req, res) => {
  const seed = req.params.seed;
  if (!players[seed]) {
    players[seed] = {};
    console.log("new world: " + seed);
  }
	if (!players[seed][req.sessionID]){
    console.log("new player on world: " + seed + " with id: " + req.sessionID);
		players[seed][req.sessionID] = {
      x: 0, 
      y: 0,
      m: "new player", 
      c: "aaa", 
      seed:seed, 
      sessionID:req.sessionID
    };
	}
	res.render('home', Object.assign({x: 0, y: 0, c: 'aaa', seed:seed, sessionID:req.sessionID}, players[req.sessionID]));
});


io.on('connection', (socket) =>{
  console.log("connection");
  socket.on('update', (msg) => {
    let parts = JSON.parse(msg);
    if (!players[parts.seed])
      return
    if (!players[parts.seed][parts.sessionID]) {
      io.emit("alert", parts.sessionID+" connected")
    }
    players[parts.seed][parts.sessionID] = parts;
    socket.sessionID = parts.sessionID; // prolly super dumb to just use session id
    socket.seed = parts.seed;
  });
  socket.on("disconnect", (msg) => {
    console.log(socket.sessionID + " disconnected");
    if (!socket.seed && !socket.sessionID)
      return;
    delete players[socket.seed][socket.sessionID];
    io.emit("player disconnect", socket.sessionID);
  })
})

setInterval(()=>{
  io.emit('update', JSON.stringify(players));
}, 1000/30);


http.listen(process.env.PORT, () => {
  console.log("Server Started");
})
