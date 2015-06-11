/* jshint browser: true, globalstrict: true, devel: true */
/* global io: false */
"use strict";

// Inicjalizacja
var socket;
var currentRoom;

window.addEventListener("load", function (event) {
    var status = document.getElementById("status");
    var open = document.getElementById("open");
    var close = document.getElementById("close");
    var send = document.getElementById("send");
    var text = document.getElementById("text");
    var messages = document.getElementById("messages");
    var nick = document.getElementById("nick");
    var rooms = document.getElementById("rooms");
    var perror = document.getElementById("error");
    var createRoomName = document.getElementById("roomName");
    var createRoomButton = document.getElementById("createRoom");
    
    currentRoom = rooms.options[rooms.selectedIndex].text;
    
    status.textContent = "Brak połącznia";
    close.disabled = true;
    send.disabled = true;

    // Po kliknięciu guzika „Połącz” tworzymy nowe połączenie WS
    open.addEventListener("click", function (event) {
        open.disabled = true;
        if (!socket || !socket.connected) {
            socket = io({forceNew: true});
        }
        
        socket.on('connect', function () {
            close.disabled = false;
            send.disabled = false;
            nick.disabled = true;
            status.src = "img/bullet_green.png";
            console.log('Nawiązano połączenie przez Socket.io');
            perror.innerHTML = "";
            socket.emit("join", nick.value, currentRoom);
            socket.emit("loadHistory", currentRoom);
            socket.emit("loadRooms");
        });
        
        socket.on('disconnect', function () {
            open.disabled = false;
            nick.disabled = false;
            status.src = "img/bullet_red.png";
            messages.innerHTML = '';
            console.log('Połączenie przez Socket.io zostało zakończone');
        });
        
        socket.on("nologon", function(err) {
            close.disabled = true;
            send.disabled = true;
            open.disabled = false;
            perror.textContent = err;
            socket.io.disconnect();
        });
        
        socket.on("error", function (err) {
            perror.textContent = "Błąd połączenia z serwerem: '" + JSON.stringify(err) + "'";
        });
        socket.on("echo", function (data, roomName) {
           
            
            currentRoom = rooms.options[rooms.selectedIndex].text;
           if (roomName == currentRoom)
           {
                var p = document.createElement("p");
                var textN = document.createTextNode(data);
                p.appendChild(textN);
                messages.appendChild(p);
           }
            
//            var li = document.createElement("li");
//            var textN = document.createTextNode(data);
//            li.appendChild(textN);
//            message.appendChild(li);
        });
        
        socket.on("displayHistory", function(history) {
            messages.innerHTML = "";
            
            history.forEach(function(histNode) {
                var p = document.createElement("p");
                var textN = document.createTextNode(histNode);
                p.appendChild(textN);
                messages.appendChild(p);
            });
            
        });
        
        socket.on("displayRooms", function(rms) {
            rooms.innerHTML = "";
            rms.forEach(function(roomName) {
            var option = document.createElement("option");
            var optName = document.createTextNode(roomName);
            option.appendChild(optName);
            rooms.appendChild(option);
            
            });
        });
        
        socket.on("newRoom", function(roomName) { 
            
            var option = document.createElement("option");
            var optName = document.createTextNode(roomName);
            option.appendChild(optName);
            rooms.appendChild(option);
            
        });
        
    });
    
    // Zamknij połączenie po kliknięciu guzika „Rozłącz”
    close.addEventListener("click", function (event) {
        close.disabled = true;
        send.disabled = true;
        open.disabled = false;
       // message.textContent = "";
        socket.emit("disc", nick.value, currentRoom);
        socket.io.disconnect();
        console.dir(socket);
    });

    // Wyślij komunikat do serwera po naciśnięciu guzika „Wyślij”
    send.addEventListener("click", function (event) {
        socket.emit('message', text.value, nick.value, currentRoom);
        console.log('Wysłałem wiadomość: ' + text.value);
        text.value = "";
    });
    
    rooms.addEventListener("change", function(event) {
        currentRoom = rooms.options[rooms.selectedIndex].text;
        
        socket.emit("changeRoom",nick.value, currentRoom);
        socket.emit("loadHistory", currentRoom);
        
    });
    
    createRoomButton.addEventListener("click", function(event) {
        
        socket.emit("createRoom", nick.value, createRoomName.value);    
    });
    
});

window.addEventListener("beforeunload", function() {
    if(socket)
    {
        if(socket.connected)
        {
            var nick = document.getElementById("nick");
            socket.emit("disc", nick.value, currentRoom);
            socket.io.disconnect();
        }
    }
 
});