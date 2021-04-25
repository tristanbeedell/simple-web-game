let socket = io();

let myID;
let player;
let persons = {};
let newPersons = {};

const W = 87;
const S = 83;
const A = 65;
const D = 68;
const SPACE = 32;

let camera;
let thing;

const gravity = 10;

let message;
let xinp = document.getElementById('xinp');
let yinp = document.getElementById('yinp');
let teleButton = document.getElementById('teleport-button');
let colour;
let mons = [];
let dig = {};
let stuff = {};
let scale = 10;
const fps = 60;
const tps = 30;

setInterval(()=>{
  socket.emit("update", JSON.stringify({
    x:player.pos.x,
    y:player.pos.y,
    m:message.value(),
    c:colour.value(),
    seed:seed,
    sessionID:sessionID
  }));
}, 1000/tps);

socket.on("update", (msg) => {
  newPersons = JSON.parse(msg)[seed];
  for (let id in newPersons) {
    if (!persons[id]) {
      persons[id] = newPersons[id];
    }
    persons[id].m = newPersons[id].m;
    persons[id].c = newPersons[id].c;
  }
});

socket.on("player disconnect", (msg) => {
  delete persons[msg]
  console.log(msg);
});

function setup() {
	pixelDensity(1);
	createCanvas(640, 480);
	message = createInput('hi');
	colour = createInput(startColour || 'aaa', 'color');
	noiseSeed(window.location.pathname.split('').map(x=>x.charCodeAt(0)).reduce((a,b)=>a+b));
	player = new Box(createVector(startX, startY), 50);
	camera = createVector(startX-width/2, startY-height/2);
	background(0);
	noStroke();
	frameRate(fps);
}

function teleport() {
  prerender = {};
  rendered = {};
  player.pos.x = Number(document.getElementById('xinp').value);
  player.pos.y = Number(document.getElementById('yinp').value);
  camera.x = player.pos.x - width/2;
  camera.y = player.pos.y - height/2;
}

function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

function draw() {
	background(100);
	camera.add(p5.Vector.div(p5.Vector.sub(camera, p5.Vector.sub(player.pos, createVector(width/2, height/2))), -frameRate()/3));
  count = 0;
  let y;
	for (y = floor(camera.y-scale); y < (camera.y+height); y+=scale) {
    if (prerender[floor(y/scale)]){
      for (terr of prerender[floor(y/scale)]){
        fill(color(terr.colour));
        rect(terr.x-camera.x, floor(y-camera.y), -4*width, scale);
      }
    }
  }
	fill(20);

	let info = `frame rate: ${round(frameRate())}
(${parseInt(player.pos.x)}, ${parseInt(player.pos.y)})`
	for (key in stuff) {
		info += `\n${key}: ${stuff[key]}`
	}
	text(info, 10, 20);

	player.draw();

	for (const id in persons) {
		persons[id].x += (newPersons[id].x - persons[id].x) / (fps/tps);
		persons[id].y += (newPersons[id].y - persons[id].y) / (fps/tps);
		const person = persons[id];
		if (id != sessionID) {
			let x = Number(person.x) - camera.x;
			let y = Number(person.y) - camera.y;
			fill(person.c || 200);
			rect(x, y, 10, 10);
			fill(10);
			text(person.m || '', x, y - 10);
		}
	}
}

// render image
let prerender = {};
let rendery = 0, 
minx = 0,
maxx = 0,
miny = 0;
setInterval(()=> {
  if (rendery > floor(camera.y)+2*height || 
      floor(camera.y)+height < miny ||
      miny > floor(camera.y)) {
    miny = floor(camera.y-height);
    rendery = miny;
  }
  if (rendery < miny) {
    rendery = miny;
  }
  maxx = floor((camera.x+width*2)/scale)*scale;
  minx = floor((camera.x-width)/scale)*scale;
  rendery+=scale;
  let area = `${floor(rendery/scale)}`;
  // if (prerender[area]) {
  //   if (prerender[area][0].x - camera.x < width) {
  //     return;
  //   }
  // }
  // console.log(area)
  prerender[area] = [];
  let prev = "";
  for (let x = maxx; x > minx; x-=scale) {
    let terr = clone(getTerrain(x, rendery));
    if (terr.colour !== prev) {
      prev = terr.colour;
      terr.x = x;
      prerender[area].push(terr);
    }
  }
  prerender[area].sort(function(a, b){return b.x-a.x});
}, 1);

// update physics and stuff
setInterval(()=>{
  input();

	player.m = message.value();
	player.colour = colour.value();
	player.size = player.mass * 0.2;
	for (mon of mons){
		mon.draw();
	}
	if (mouseIsPressed) {
		mouseTerrain = getTerrain(mouseX+camera.x, mouseY+camera.y)
		text(mouseTerrain.name, mouseX, mouseY-10);
		if (mouseTerrain.object){
			let area = `${round((mouseX+camera.x)/30)},${round((mouseY+camera.y)/30)}`
			dig[area] = (dig[area] || 0) + 0.01;
			stuff[mouseTerrain.name] = (stuff[mouseTerrain.name] || 0) + 1;
		}
	}
}, 10);

function input() {
	let grip = player.terrain.grip;
	if (keyIsDown(W)) {
		player.force(0, -player.strength * grip);
	}
	if (keyIsDown(S)) {
		player.force(0, player.strength * grip);
	}
	if (keyIsDown(A)) {
		player.force(-player.strength * grip, 0);
	}
	if (keyIsDown(D)) {
		player.force(player.strength * grip, 0);
	}
}

function keyPressed() {
	if (keyCode == ENTER) {
		message.elt.focus();
	}
}

class Box {
	constructor (pos, mass) {
		this.pos = pos || createVector(0, 0);
		this.mass = mass || 1;
		this.colour = color(200, 200, 200)
		this.size = 10;
		this.vel = createVector(0, 0);
		this.frc = createVector(0, 0);
		this.strength = 2000;
	}

	draw () {
		const weight = this.mass * gravity;
		
		let terr = getTerrain(this.pos.x, this.pos.y)
		const frictionmult = terr.friction;
		const friction = p5.Vector.mult(this.vel, -abs(weight * frictionmult));
		this.force(friction);

		const acc = this.frc.div(this.mass);
		this.vel.add(acc.div(30));
		this.move(this.vel);
		this.frc = createVector(0, 0);
		fill(this.colour);
		rect(this.pos.x-camera.x, this.pos.y-camera.y, this.size, this.size);
		fill(10)
		text(this.m || '', this.pos.x-camera.x, this.pos.y-camera.y - 10);
	}

	move(a, b) {
		this.pos = this.pos.add(a, b);
		return this.pos;
	}

	force(x, y) {
		this.frc.add(x, y);
		return this.frc;
	}

	get terrain () {
		return getTerrain(this.pos.x, this.pos.y);
	}
}
