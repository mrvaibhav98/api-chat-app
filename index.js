const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const router = require("./router");
const cors = require("cors");

const PORT = process.env.PORT || 5000;

const { addUser, removeUser, getUser, getUserInRoom } = require("./users.js");
const { urlencoded } = require("express");

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
	cors: {
		origin:
			"https://62343122eb7fe742532cf144--mrvaibhav98-makes-great-sites.netlify.app",
	},
});

app.use(cors());
app.use(router);

io.on("connection", (socket) => {
	socket.on("join", ({ name, room }, callback) => {
		const { error, user } = addUser({ id: socket.id, name, room });
		if (error) {
			return callback(error);
		}

		socket.join(user.room);

		socket.emit("message", {
			user: "admin",
			text: `${user.name}, Welcome to the room ${user.room}`,
		});

		socket.broadcast
			.to(user.room)
			.emit("message", { user: "admin", text: `${user.name} has joined!` });

		io.to(user.room).emit("roomData", {
			room: urlencoded.room,
			users: getUserInRoom(user.room),
		});
		callback();
	});

	socket.on("sendMessage", (message, callback) => {
		const user = getUser(socket.id);

		io.to(user.room).emit("message", { user: user.name, text: message });
		io.to(user.room).emit("roomData", {
			room: urlencoded.room,
			users: getUserInRoom(user.room),
		});
		callback();
	});

	socket.on("disconnect", () => {
		const user = removeUser(socket.id);
		if (user) {
			io.to(user.room).emit("message", {
				user: "admin",
				text: `${user.name} has left the chat`,
			});
		}
	});
});

server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));
