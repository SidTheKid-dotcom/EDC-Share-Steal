// clients.js

let clients = [];

const addClient = (client) => {
  clients.push(client);
};

const removeClient = (client) => {
  clients = clients.filter(c => c !== client);
};

const getClients = () => {
  return clients;
};

module.exports = {
  addClient,
  removeClient,
  getClients
};
