var server = "104.238.167.48:7878";
var game = 0;
var socket = new WebSocket("ws://"+server+"/games/" + game + "/ws");
var mycanvas = document.getElementById('mycanvas');
var ctx = mycanvas.getContext('2d');

function screenSize() {
  var w=window,d=document,e=d.documentElement,g=d.getElementsByTagName('body')[0],x=w.innerWidth||e.clientWidth||g.clientWidth,y=w.innerHeight||e.clientHeight||g.clientHeight;
  return {
    x: x,
    y: y,
  }
}

socket.onopen = function() {
  console.log("Connected");
};

(function (window, document, socket) {
  document.onkeydown = function(event) {

    keyCode = event.keyCode;

    switch(keyCode) {
    
    case 65: 
      socket.send(JSON.stringify({
        "type": "snake",
        "payload": "west",
      }));
      break;

    case 68:
      socket.send(JSON.stringify({
        "type": "snake",
        "payload": "east",
      }));
      break;

    case 87:
      socket.send(JSON.stringify({
        "type": "snake",
        "payload": "north",
      }));
      break;

    case 83:
      socket.send(JSON.stringify({
        "type": "snake",
        "payload": "south",
      }));
      break;
    default:
      console.log("Unknown key", keyCode);
    }
  };

})(window, document, socket);

var bodySnake = function(x, y, snakeSize) {
  ctx.fillStyle = 'green';
  ctx.fillRect(x*snakeSize, y*snakeSize, snakeSize, snakeSize);
  ctx.strokeStyle = 'darkgreen';
  ctx.strokeRect(x*snakeSize, y*snakeSize, snakeSize, snakeSize);
};


var apple = function(x, y, snakeSize) {
  ctx.fillStyle = 'yellow';
  ctx.fillRect(x*snakeSize, y*snakeSize, snakeSize, snakeSize);
  ctx.fillStyle = 'red';
  ctx.fillRect(x*snakeSize+1, y*snakeSize+1, snakeSize-2, snakeSize-2);
};

function drawSnake(snake, snakeSize) {
  for (var i = 0; i < snake.dots.length; i++) {
    var dot = snake.dots[i];
    bodySnake(dot[0], dot[1], snakeSize);
  }
};

socket.onclose = function(event) {
  if (event.wasClean) {
  } else {
    console.log('Connection closed clean');
    console.log('Connection killed');
  }
  console.log('Code: ' + event.code + ' reason: ' + event.reason);
};

var Objects = function() {
  this.objects = {};
  this.apples = [];
  this.width = 100;
  this.height = 100;
  this.snakeSize = 10;
};

Objects.prototype.setSize = function(width, height) {
  this.width = width;
  this.height = height;

  var screen = screenSize();
  console.log("Screen", screen);
  screen.x -= 70;
  screen.y -= 70;

  mycanvas.width = screen.x;
  mycanvas.height = screen.y;


  this.snakeSize = Math.min(screen.x/width, screen.y/height);
}

Objects.prototype.add = function(object) {
  if (object.type == "snake") {
    this.objects[object.id] = object;
  } else if (object.length === 1) {
    this.apples.push({
      dot: [object[0][0], object[0][1]],
    });
  }
};

Objects.prototype.del = function(object) {
  if (object.type == "snake") {
    delete this.objects[object.id];
  } else if (object.length === 1) {
    for (var i in this.apples) {
      if (this.apples[i].dot[0] == object[0][0] && 
        this.apples[i].dot[1] == object[0][1]) {
        console.log(this.apples, object, i);
        delete this.apples[i];
        break;
      }
    };
  }
};

Objects.prototype.set = function(object) {
  if (object.type == "snake") {
    this.objects[object.id] = object;
  }
};

Objects.prototype.draw = function() {
  ctx.fillStyle = 'lightgrey';
  ctx.fillRect(0, 0, this.width*this.snakeSize, this.height*this.snakeSize);
  ctx.strokeStyle = 'black';
  ctx.strokeRect(0, 0, this.width*this.snakeSize, this.height*this.snakeSize);

  for (key in this.objects) {
    drawSnake(this.objects[key], this.snakeSize);
  }
  for (i in this.apples) {
    apple(this.apples[i].dot[0], this.apples[i].dot[1], this.snakeSize);
  }
};

var objects = new Objects();

socket.onmessage = function(event) {
  var data = JSON.parse(event.data);

  switch (data.type) {
    case "game":
      with (data.payload) {
        switch (type) {
          case "create":
            objects.add(payload);
            break;
          case "update":
            objects.set(payload);
            break;
          case "delete":
            objects.del(payload);
            break;
          default:
            break;
        }
      }
      objects.draw();
      break;
    case "player":
      with (data.payload) {
        switch (type) {
          case "notice":
            console.log("Notice:", payload);
            break;
          case "size":
            console.log("Width:", payload.width);
            console.log("Height:", payload.height);
            objects.setSize(payload.width, payload.height);
            break;
          case "objects":
            for (var i = 0; i < payload.length; i++) {
              objects.add(payload[i]);
            }
            objects.draw();
            break;
          case "countdown":
            break;
          case "snake":
            break;
          case "error":
            console.log("Error:", payload);
            break;
          default:
            console.log("Unknown player command:", payload);
            break;
        }
      }
      break;
    case "broadcast":
      console.log("Broadcast:", data.payload);
      break;
    default:
      console.log("Unknown:", data.payload);
      break;
  }
};

socket.onerror = function(error) {
  console.log("Error: " + error.message);
};
