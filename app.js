const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const formatMessage = require('./helper/formatDate')

const {
    getActiveUser,
    exitRoom,
    newUser,
    getIndividualRoomUsers
} = require('./helper/userHelper');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.set('view engine', 'ejs')

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/chat', (req, res) => {
    res.render('chat');
})

//this block runs when client connects
io.on('connection', socket => {
    socket.on('joinRoom', ({username, room}) => {
        const user = newUser(socket.id, username, room);

        socket.join(user.room);

        // greet
        socket.emit('message', formatMessage('WebCage', "Messages exchanged stay in this room!"));

        //broadcast everytime user connects
        socket.broadcast
        .to(user.room)
        .emit('message', formatMessage("WebCage", `${user.username} has joined the room`));

        //current active users and room name
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getIndividualRoomUsers(user.room)
        });  
    });

    //Listen for client messages
    socket.on('chatMessage', msg => {
        const user = getActiveUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });


    //runs when client disconnects
    socket.on('disconnect', () => {
        const user = exitRoom(socket.id);

        if(user) {
            io.to(user.room).emit('message', formatMessage("WebCage", `${user.username} has left the room`));
        


        //current active users and room name
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getIndividualRoomUsers(user.room)
        });
      }
    })
})

server.listen(3000);
