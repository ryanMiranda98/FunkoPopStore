const config = require("config");
const mongoose = require("mongoose");
const data = require("./data/dummy.js");
const FunkoPops = require("./src/models/FunkPop");

const dbConfig = config.get("database");

mongoose
  .connect(dbConfig.url, {})
  .then(async () => {
    console.log(`Connected to ${dbConfig.name} DB`);

    await deleteData();
    await importData(data);
  })
  .finally(() => {
    console.log(`Disconnecting from ${dbConfig.name} DB`);
    process.exit(0);
  });

// Insert Funko pop products
async function importData(data) {
  for (const item of data) {
    await FunkoPops.create(item);
  }
}

// CLear previous data from DB
async function deleteData() {
  await FunkoPops.deleteMany();
}
