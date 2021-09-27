const supertest = require("supertest");
const mongoose = require("mongoose");
const config = require("config");
const app = require("../src/app");
const FunkoPops = require("../src/models/FunkPop");

const request = supertest(app);
const dbConfig = config.get("database");

beforeAll(async () => {
  await mongoose.connect(dbConfig.url);
});

const funkoPopItem = {
  title: "Marvel: WandaVision - Halloween Wanda",
  price: 7.2,
  description: "Funko pop of halloween wanda",
  quantity: "100"
};

describe("Create funko pops", () => {
  it("should return 201 when funko pop is created", async () => {
    const response = await request
      .post("/api/1.0/funkopops")
      .send(funkoPopItem);
    expect(response.status).toBe(201);
  });

  it("should return fields title, price, description, quantity, instock, _id and __v when creating funkopop with valid body", async () => {
    const response = await request
      .post("/api/1.0/funkopops")
      .send(funkoPopItem);
    expect(Object.keys(response.body.funkopop)).toEqual([
      "title",
      "price",
      "description",
      "quantity",
      "instock",
      "_id",
      "__v"
    ]);
  });

  it("should return 400 when funko pop is being created and body is not valid", async () => {
    const response = await request.post("/api/1.0/funkopops").send();
    expect(response.status).toBe(400);
  });

  it("should return path, timestamp, message and validationErrors field when funkopop is being created and body is not valid", async () => {
    const preRequestTimestamp = new Date().getTime();
    const response = await request.post("/api/1.0/funkopops").send();
    expect(Object.keys(response.body)).toEqual([
      "path",
      "timestamp",
      "message",
      "validationErrors"
    ]);

    expect(response.body.path).toBe("/api/1.0/funkopops");
    expect(response.body.message).toBe("Validation Failure");
    expect(response.body.timestamp).toBeGreaterThan(preRequestTimestamp);
  });

  it.each`
    field            | value              | message
    ${"title"}       | ${null}            | ${`Cannot create funko pop without title!`}
    ${"title"}       | ${""}              | ${`Cannot create funko pop without title!`}
    ${"title"}       | ${"h3fh34"}        | ${`Title has to be 10-50 characters long`}
    ${"title"}       | ${"h".repeat(51)}  | ${`Title has to be 10-50 characters long`}
    ${"price"}       | ${null}            | ${`Cannot create funko pop without price!`}
    ${"price"}       | ${"asb3"}          | ${`Price has to be numeric`}
    ${"description"} | ${null}            | ${`Cannot create funko pop without decription!`}
    ${"description"} | ${"Testdesc"}      | ${`Description has to be 10-250 characters long`}
    ${"description"} | ${"T".repeat(251)} | ${`Description has to be 10-250 characters long`}
    ${"quantity"}    | ${null}            | ${`Cannot create funko pop without quantity!`}
    ${"quantity"}    | ${"asb4"}          | ${`Quantity has to be numeric`}
  `(
    "returns $message when creating funko pop with $value as value in field $field",
    async ({ field, value, message }) => {
      const invalidBody = { ...funkoPopItem };
      invalidBody[field] = value;

      const response = await request
        .post("/api/1.0/funkopops")
        .send(invalidBody);
      expect(response.body.validationErrors[field]).toBe(message);
    }
  );
});

afterEach(async () => {
  await FunkoPops.deleteMany();
});

afterAll(async () => {
  await mongoose.disconnect();
});
