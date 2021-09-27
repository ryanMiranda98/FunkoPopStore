const supertest = require("supertest");
const mongoose = require("mongoose");
const config = require("config");
const app = require("../src/app");
const FunkoPops = require("../src/models/FunkPop");

const request = supertest(app);
const dbConfig = config.get("database");

const funkoPopItem = {
  title: "Marvel: WandaVision - Halloween Wanda",
  price: 7.2,
  description: "Funko pop of halloween wanda",
  quantity: "100"
};

beforeAll(async () => {
  await mongoose.connect(dbConfig.url);
});

describe("Funko Pop Delete", () => {
  it("should send 200 OK when funko pop product is deleted", async () => {
    const funkopop = await FunkoPops.create(funkoPopItem);
    const popID = funkopop.id;

    const response = await request.delete(`/api/1.0/funkopops/${popID}`);
    expect(response.status).toBe(200);
  });

  it("should delete funko pop product from the DB", async () => {
    const funkopop = await FunkoPops.create(funkoPopItem);
    const popID = funkopop.id;

    await request.delete(`/api/1.0/funkopops/${popID}`);

    const productExists = await FunkoPops.findById(popID);
    expect(productExists).toBeNull();
  });

  it("should return size as 0 when DB has only 1 product and it is deleted", async () => {
    const funkopop = await FunkoPops.create(funkoPopItem);
    const popID = funkopop.id;

    await request.delete(`/api/1.0/funkopops/${popID}`);

    const size = await FunkoPops.find();
    expect(size.length).toBe(0);
  });

  it("should return deleted funko pop product in response body", async () => {
    const funkopop = await FunkoPops.create(funkoPopItem);
    const popID = funkopop.id;

    const response = await request.delete(`/api/1.0/funkopops/${popID}`);
    expect(response.body.deletedFunkoPop).toBeTruthy();
  });

  it("should return fields id, title, price, description, quantity, instock for deleted funko pop product in response body", async () => {
    const funkopop = await FunkoPops.create(funkoPopItem);
    const popID = funkopop.id;

    const response = await request.delete(`/api/1.0/funkopops/${popID}`);
    expect(Object.keys(response.body.deletedFunkoPop)).toEqual([
      "_id",
      "title",
      "price",
      "description",
      "quantity",
      "instock"
    ]);
  });

  it("should retur 204 when deleting item that doesn't exists", async () => {
    const popID = "61503ae7f4a6fb0b9bb9a218";
    const response = await request.delete(`/api/1.0/funkopops/${popID}`);
    expect(response.status).toBe(204);
  });

  it("should return 200 on first delete and 204 on second delete when continuously deleting item that doesn't exists", async () => {
    const funkopop = await FunkoPops.create(funkoPopItem);
    const popID = funkopop.id;
    const firstResponse = await request.delete(`/api/1.0/funkopops/${popID}`);
    expect(firstResponse.status).toBe(200);
    const secondResponse = await request.delete(`/api/1.0/funkopops/${popID}`);
    expect(secondResponse.status).toBe(204);
  });
});

afterEach(async () => {
  await FunkoPops.deleteMany();
});

afterAll(async () => {
  await mongoose.disconnect();
});
