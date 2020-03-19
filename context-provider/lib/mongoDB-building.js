const Building = require('../models/building');

class BuildingUpdate {
  /**
   * @param {*} model
   */
  constructor(model) {
    this.model = model;
  }

  /**
   * @param {String} name
   */
  upsert(id, name, address, verified = false) {
    const newBuilding = {
      id,
      name,
      address,
      verified
    };
    return this.model.findOneAndUpdate({ id }, newBuilding, { upsert: true });
  }

  findAll() {
    return this.model.find();
  }

  /**
   * @param {Integer} id
   */
  findById(id) {
    return this.model.findOne({ id });
  }

  /**
   * @param {integer} id
   */
  deleteById(id) {
    return this.model.findOneAndDelete({ id });
  }

  /**
   *
   * @param {integer} id
   * @param {*} object
   */
  updateById(id, object) {
    const query = { id };
    return this.model.findOneAndUpdate(query, {
      $set: {
        name: object.name,
        address: object.address,
        verified: object.verified
      }
    });
  }
}

module.exports = new BuildingUpdate(Building);
