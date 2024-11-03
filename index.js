const express = require("express");
const http = require("http");
const path = require("path");
const socket = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socket(server);

// Object to store users' locations
const usersLocation = {};

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  // console.log("Socket.IO connected:", socket.id);

  // Send existing locations to the new user
  socket.emit("existing-locations", usersLocation);

  // Listen for location data from clients
  socket.on("send-location", (data) => {
    usersLocation[socket.id] = data; // Store the user's location
    io.emit("receive-location", { id: socket.id, ...data }); // Emit location with socket ID
  });

  // Emit a disconnection event when a user disconnects
  socket.on("disconnect", () => {
    delete usersLocation[socket.id]; // Remove the user's location
    io.emit("user-disconnected", socket.id); // Inform all clients of the disconnected user
  });
});

app.get("/", (req, res) => {
  res.render("index");
});

const PORT = 7000;
server.listen(PORT, () => {
  // console.log(`Server is running on port ${PORT}`);
});
