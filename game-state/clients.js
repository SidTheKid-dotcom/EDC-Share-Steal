// clients.js

let clients = [];

const addClient = (client, playerId) => {
  clients.push({ client, playerId });
};

const removeClient = (client) => {
  clients = clients.filter(c => c !== client);
};

const getClients = () => {
  return clients;
};

const getClientById = (playerId) => {
  return clients.find(c => c.playerId === JSON.stringify(playerId)).client;
};

module.exports = {
  addClient,
  removeClient,
  getClients,
  getClientById
};
