const supertest = require("supertest");
const mongoose = require("mongoose");
const config = require("config");
const app = require("../src/app");
const FunkoPops = require("../src/models/FunkPop");
const User = require("../src/models/User");
const { hashPassword, generateJWT } = require("../src/utils/generators");

const request = supertest(app);
const dbConfig = config.get("database");

const funkoPopItem = {
  title: "Marvel: WandaVision - Halloween Wanda",
  price: 7.2,
  description: "Funko pop of halloween wanda",
  quantity: "100"
};

const validUser = {
  email: "johndoe@test.com",
  password: "test1234"
};

const createAdmin = async () => {
  const hash = await hashPassword(validUser.password);
  return User.create({
    ...validUser,
    password: hash,
    role: "admin"
  });
};

const createUser = async () => {
  const hash = await hashPassword(validUser.password);
  return User.create({
    ...validUser,
    password: hash,
    role: "user"
  });
};

const deleteFunkoPopRequest = async (id, options = {}) => {
  const agent = request.delete(`/api/1.0/funkopops/${id}`);
  if (options.token) {
    agent.set("authorization", options.token);
  }

  return agent.send();
};

beforeAll(async () => {
  await mongoose.connect(dbConfig.url);
});

describe("Funko Pop Delete", () => {
  it("should send 200 OK when funko pop product is deleted and role is admin", async () => {
    const funkopop = await FunkoPops.create(funkoPopItem);
    const popID = funkopop.id;

    const admin = await createAdmin();
    const jwtToken = await generateJWT(admin.id);
    const token = `Bearer ${jwtToken}`;

    const response = await deleteFunkoPopRequest(popID, { token: token });
    expect(response.status).toBe(200);
  });

  it("should delete funko pop product from the DB and role is admin", async () => {
    const funkopop = await FunkoPops.create(funkoPopItem);
    const popID = funkopop.id;

    const admin = await createAdmin();
    const jwtToken = await generateJWT(admin.id);
    const token = `Bearer ${jwtToken}`;

    await deleteFunkoPopRequest(popID, { token: token });

    const productExists = await FunkoPops.findById(popID);
    expect(productExists).toBeNull();
  });

  it("should return size as 0 when DB has only 1 product and it is deleted and role is admin", async () => {
    const funkopop = await FunkoPops.create(funkoPopItem);
    const popID = funkopop.id;

    const admin = await createAdmin();
    const jwtToken = await generateJWT(admin.id);
    const token = `Bearer ${jwtToken}`;

    await deleteFunkoPopRequest(popID, { token: token });

    const size = await FunkoPops.find();
    expect(size.length).toBe(0);
  });

  it("should return deleted funko pop product in response body when role is admin", async () => {
    const funkopop = await FunkoPops.create(funkoPopItem);
    const popID = funkopop.id;

    const admin = await createAdmin();
    const jwtToken = await generateJWT(admin.id);
    const token = `Bearer ${jwtToken}`;

    const response = await deleteFunkoPopRequest(popID, { token: token });
    expect(response.body.deletedFunkoPop).toBeTruthy();
  });

  it("should return fields id, title, price, description, quantity, instock, reviews for deleted funko pop product in response bodycwhen role is admin", async () => {
    const funkopop = await FunkoPops.create(funkoPopItem);
    const popID = funkopop.id;

    const admin = await createAdmin();
    const jwtToken = await generateJWT(admin.id);
    const token = `Bearer ${jwtToken}`;

    const response = await deleteFunkoPopRequest(popID, { token: token });
    expect(Object.keys(response.body.deletedFunkoPop)).toEqual([
      "_id",
      "title",
      "price",
      "description",
      "quantity",
      "instock",
      "reviews"
    ]);
  });

  it("should return 204 when deleting item that doesn't exists", async () => {
    const popID = "61503ae7f4a6fb0b9bb9a218";
    const admin = await createAdmin();
    const jwtToken = await generateJWT(admin.id);
    const token = `Bearer ${jwtToken}`;

    const response = await deleteFunkoPopRequest(popID, { token: token });
    expect(response.status).toBe(204);
  });

  it("should return 200 on first delete and 204 on second delete when continuously deleting item that doesn't exists", async () => {
    const funkopop = await FunkoPops.create(funkoPopItem);
    const popID = funkopop.id;
    const admin = await createAdmin();
    const jwtToken = await generateJWT(admin.id);
    const token = `Bearer ${jwtToken}`;

    const firstResponse = await deleteFunkoPopRequest(popID, { token: token });
    expect(firstResponse.status).toBe(200);
    const secondResponse = await deleteFunkoPopRequest(popID, { token: token });
    expect(secondResponse.status).toBe(204);
  });

  it("should send 403 when deleting funko pop and role is user", async () => {
    const funkopop = await FunkoPops.create(funkoPopItem);
    const popID = funkopop.id;

    const user = await createUser();
    const jwtToken = await generateJWT(user.id);
    const token = `Bearer ${jwtToken}`;

    const response = await deleteFunkoPopRequest(popID, { token: token });
    expect(response.status).toBe(403);
  });

  it("should send forbidden message when deleting funko pop and role is user", async () => {
    const funkopop = await FunkoPops.create(funkoPopItem);
    const popID = funkopop.id;

    const user = await createUser();
    const jwtToken = await generateJWT(user.id);
    const token = `Bearer ${jwtToken}`;

    const response = await deleteFunkoPopRequest(popID, { token: token });
    expect(response.body.message).toBe(
      "You are forbidden to access this route"
    );
  });
});

afterEach(async () => {
  await FunkoPops.deleteMany();
  await User.deleteMany();
});

afterAll(async () => {
  await mongoose.disconnect();
});
