
// Track connected clients
let { clients } = require('../game-state/clients');

const userController = (socket) => {

    clients.push(socket);
    socket.on('close', () => {
        clients = clients.filter(client => client !== socket);
    });

    socket.on('message', message => console.log(message));
}

module.exports = userController;