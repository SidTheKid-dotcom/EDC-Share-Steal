// clients.js

let clients = [];

const addClient = (client, playerId, gameId) => {
  clients.push({ client, playerId, gameId });
};

const removeClient = (client) => {
  clients = clients.filter((c) => {
    return c.client !== client;
  });
};

const removeClientById = (playerId) => {
  clients = clients.filter((c) => c.playerId !== playerId);
};

const getClients = () => {
  return clients;
};

const getClientById = (playerId) => {
  return clients.find((c) => c.playerId === playerId)?.client;
};

module.exports = {
  addClient,
  removeClient,
  removeClientById,
  getClients,
  getClientById,
};
