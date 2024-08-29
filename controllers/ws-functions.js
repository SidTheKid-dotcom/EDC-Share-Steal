const { getClients } = require("../game-state/clients");

const WebSocket = require('ws');

exports.broadcast = (message) => {

    const clients = getClients();
    clients.forEach(client => {
        if (client.client.readyState === WebSocket.OPEN) {
            client.client.send(message);
        }
    });
}

exports.broadcastToOne = (message, client) => {
    
    if (client.readyState === WebSocket.OPEN) {
        client.send(message);
    }
};
