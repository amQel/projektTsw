/* jshint node: true */
var app = require("express")();
var httpServer = require("http").Server(app);
var io = require("socket.io")(httpServer);

var static = require('serve-static');
var port = process.env.PORT || 3000;

var oneDay = 86400000;
var nicks = [];
var rooms = [];
var players = [];
var id=0;
var worldRandom = [];

var room = {
    name: "main",
    history: []
};

rooms.push(room);

Array.prototype.contains = function (obj) {
    var i = this.length;
    while (i--) {
        if (this[i] === obj) {
            return true;
        }
    }
    return false;
}

Array.prototype.clean = function (obj) {
    var i = this.length;
    while (i--) {
        if (this[i] === obj) {
            this.splice(i, 1);
        }
    }
}


app.use('/img', static(__dirname + '/public/img', {
    maxAge: oneDay
}));

app.use('/js/jquery.min.js', static(__dirname + '/bower_components/jquery/dist/jquery.min.js'));
app.use('/js/jquery.min.map', static(__dirname + '/bower_components/jquery/dist/jquery.min.map'));
app.use('/js/phaser.min.js', static(__dirname + '/public/js/phaser.min.js'));

app.use(static(__dirname + '/public'));



io.sockets.on("connection", function (socket) {
    
    if(players.length == 0 && worldRandom.length == 0){
        socket.emit('createMeWorld');
    }else {
        socket.emit('createNewUniverse', worldRandom);
    }
    
    socket.on("join", function (nick, roomName) {
        if (nicks.contains(nick)) {
            socket.emit("nologon", "Uzytkownik " + nick + " jest już zalogowany na tym serwerze ");

        } else {
            nicks.push(nick);
            var data = "Uzytkownik " + nick + " dolaczyl do chatu";
            rooms.forEach(function (room) {
                if (room.name === roomName) {
                    room.history.push(data);
                }
            });
            io.sockets.emit("echo", data, roomName);
        }
    });
    
    socket.on("createRoom", function (nick, roomName) {

        var i = rooms.length;
        var istnieje = false;
        for (j=0; j<i; j++)
        {
            if(rooms[j].name == roomName)
            {
                istnieje = true;
            }
        }
        
        if(!istnieje)
        {
            var newRoom = {
                name: roomName,
                history: []
            };
            newRoom.history.push(nick + " utworzył pokój " + roomName);
            
            rooms.push(newRoom);
            io.sockets.emit("newRoom", roomName);
           // socket.emit("switch", roomName);
        } else 
        {
            console.log("Pokój " + roomName + " już istnieje");
        }
    });
    
    socket.on("newPlayer", function(x, y){
        var player = {
                id:socket.id,
                x:x, 
                y:y,
                nick:''
            }
        
        socket.emit('setId', socket.id);
        socket.emit('updatePlayers', players);
        
        players.push(player);
        console.log(player.id +" "+  player.x+ " "  + player.y + " " + players.length);
        io.sockets.emit("additionalPlayer", player.id, player.x, player.y, player.nick);
        
    });
    
    socket.on("disconnect", function () {
    players.forEach(function (player, i) {
        if (player.id == socket.id) {
            io.sockets.emit("cleanPlayer", player.id);
            players.clean(player);
            console.log(socket.id + " dc " + players.length);
        }
    });
    
});
    
    socket.on('worldCreation', function(world){
        console.log(players.length);
        if(players.length == 1 && worldRandom.length == 0){
            world.forEach(function(platform, i){
                worldRandom.push(platform);
            });
        }
        socket.emit('createNewUniverse', worldRandom);
    });
    
    socket.on('newMap', function(world){
        console.log(world.length);
        if(worldRandom.length == 0){
            world.forEach(function(platform, i){
                worldRandom.push(platform);
            });
        }
        io.sockets.emit('loadNewMap', worldRandom);
    });
    
    socket.on('gameOver', function(winner, score){
        io.sockets.emit('showGameOverScreen', winner, score);
        worldRandom = [];
        socket.emit('createMeNewWorld');
    });
    socket.on("resetMe", function(id, x, y, killer){
        console.log(killer + " mf killed " + id);
        players.forEach(function (player, i) {
            if (player.id == id) {
                player.x = x;
                player.y = y;
            }
        });
//        console.log("HERE" + killer);
        io.sockets.emit("resetEnemy", id, x, y);
        io.sockets.emit("updateKiller", killer);
        io.sockets.connected[killer].emit('score', '100p for killing ' + id);
    });
    socket.on('setNick', function(id, nick){
        players.forEach(function(player, i){
            if (player.id == id) {
                player.nick = nick;
                io.sockets.emit('setEnemyNick', player.id , player.nick);
            }
        });
    
    });
    socket.on("updatePos", function(id, x, y){
        players.forEach(function (player, i) {
            if (player.id == id) {
                player.x = x;
                player.y = y;
                io.sockets.emit("updatePlayer", player.id, player.x, player.y);
//                 console.log("updating" + player.id + " = " + player.x + " " + player.y);
            }
        });
        
    });
    
    socket.on('hitted', function(id){
    console.log(id);
    });
    
    socket.on("updateVelX", function(id, value){
//        console.log("new vel for " + id + " = " + value);
        io.sockets.emit("changeVelX", id, value);
    });
    
     socket.on("updateVelY", function(id, value){
//        console.log("new vel for " + id + " = " + value);
        io.sockets.emit("changeVelY", id, value);
    });
    
    socket.on('fireDaBullet', function(x, y, id){
        io.sockets.emit('showDaBullet', x, y, id);
    });
    
    socket.on("changeRoom", function(nick, roomName) {
        
        var data = "Uzytkownik " + nick + " dolaczyl do chatu " + roomName;
        
        io.sockets.emit("echo", data, roomName);
         
        rooms.forEach(function (room) {
            console.log(room.name);
                if (room.name === roomName) {
                    room.history.push(data);
                    console.log(data);
                }
            });
         
        
    
    });


    socket.on("loadHistory", function (roomName) {
        rooms.forEach(function (room) {
            if (room.name === roomName) {
                socket.emit("displayHistory", room.history);
            }
        });
    });
    
    socket.on("loadRooms", function () {
        var rms = [];
        rooms.forEach(function (room) {
            rms.push(room.name);
        });
        socket.emit("displayRooms", rms);
    });

    socket.on("message", function (data, nick, roomName) {
        rooms.forEach(function (room) {
            if (room.name === roomName) {
                room.history.push(nick + ": " + data);
                console.log(room.history[0]);
            }
        });
        io.sockets.emit("echo", nick + ": " + data, roomName);
    });

    socket.on("error", function (err) {
        console.dir(err);
    });

    socket.on("test", function (data) {
        console.log(data);
    });

    socket.on("disc", function (nick, roomName) {
        nicks.clean(nick);
        var data = "Uzytkownik " + nick + " opuścił chat";
        io.sockets.emit("echo", data);
        rooms.forEach(function (room) {
            if (room.name === roomName) {
                room.history.push(data);
            }
        });
    });

});

httpServer.listen(port, function () {
    console.log('Serwer HTTP działa na porcie ' + port);
});