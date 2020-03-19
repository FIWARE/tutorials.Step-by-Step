const mongoDB = require('../../lib/mongoDB-building');
const debug = require('debug')('tutorial:ngsi-v2');

// This is a promise to send data to a MongoDB database
// for each individual building.
function upsertToMongoDB(building) {
  return new Promise((resolve, reject) => {
    mongoDB
      .upsert(building.id, building.name, building.address, building.verified)
      .then(() => {
        return resolve();
      })
      .catch(error => {
        return reject(error);
      });
  });
}

// Function to create address documents in a MongoDB database
// when receiving an NGSI-LD subscription.
function duplicateBuildings(req, res) {
  debug('duplicateBuildings');
  async function copyEntityData(building) {
    await upsertToMongoDB(building);
  }
  req.body.data.forEach(copyEntityData);
  res.status(204).send();
}

module.exports = {
  duplicateBuildings
};
