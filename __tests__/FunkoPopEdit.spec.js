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

const editedFunkoPopItem = {
  title: "Marvel: Falcon - Halloween Falcon",
  price: 7.2,
  description: "Funko pop of halloween Falcon",
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

const editFunkoPopRequest = async (id, body, options = {}) => {
  const agent = request.patch(`/api/1.0/funkopops/${id}`);
  if (options.token) {
    agent.set("authorization", options.token);
  }

  return agent.send(body);
};

beforeAll(async () => {
  await mongoose.connect(dbConfig.url);
});

describe("Funko Pop Edit", () => {
  it("should return 200 OK when item is successfully edited and role is admin", async () => {
    const funkopop = await FunkoPops.create(funkoPopItem);
    const popID = funkopop.id;

    const admin = await createAdmin();
    const jwtToken = await generateJWT(admin.id);
    const token = `Bearer ${jwtToken}`;

    const response = await editFunkoPopRequest(popID, editedFunkoPopItem, {
      token: token
    });
    expect(response.status).toBe(200);
  });

  it("should return different title and description for updated funko pop product when valid request is sent and role is admin", async () => {
    const funkopop = await FunkoPops.create(funkoPopItem);
    const popID = funkopop.id;

    const admin = await createAdmin();
    const jwtToken = await generateJWT(admin.id);
    const token = `Bearer ${jwtToken}`;

    const response = await editFunkoPopRequest(popID, editedFunkoPopItem, {
      token: token
    });

    expect(response.body.funkopop.title).toBe(
      "Marvel: Falcon - Halloween Falcon"
    );
    expect(response.body.funkopop.description).toBe(
      "Funko pop of halloween Falcon"
    );
  });

  it("should return 403 and forbidden message when trying to edit funkopop and role is user", async () => {
    const funkopop = await FunkoPops.create(funkoPopItem);
    const popID = funkopop.id;

    const user = await createUser();
    const jwtToken = await generateJWT(user.id);
    const token = `Bearer ${jwtToken}`;

    const response = await editFunkoPopRequest(popID, editedFunkoPopItem, {
      token: token
    });
    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      "You are forbidden to access this route"
    );
  });

  it("returns fields _id, title, price, description, quantity, instock of updated funko pop product when valid request body is sent and role is admin", async () => {
    const funkopop = await FunkoPops.create(funkoPopItem);
    const popID = funkopop.id;

    const admin = await createAdmin();
    const jwtToken = await generateJWT(admin.id);
    const token = `Bearer ${jwtToken}`;

    const response = await editFunkoPopRequest(popID, editedFunkoPopItem, {
      token: token
    });

    expect(Object.keys(response.body.funkopop)).toEqual([
      "_id",
      "title",
      "price",
      "description",
      "quantity",
      "instock"
    ]);
  });

  it.each`
    field            | value
    ${"title"}       | ${"Marvel: Falcon - Halloween Falcon"}
    ${"price"}       | ${8.9}
    ${"description"} | ${"Funko pop of halloween Falcon"}
    ${"quantity"}    | ${200}
  `(
    "updates only field $field with value $value when $field is sent in request body and role is admin",
    async ({ field, value }) => {
      const funkopop = await FunkoPops.create(funkoPopItem);
      const popID = funkopop.id;

      const validBody = {};
      validBody[field] = value;

      const admin = await createAdmin();
      const jwtToken = await generateJWT(admin.id);
      const token = `Bearer ${jwtToken}`;

      const response = await editFunkoPopRequest(popID, validBody, {
        token: token
      });

      expect(response.status).toBe(200);
      expect(response.body.funkopop[field]).toBe(value);
    }
  );

  it("should return 404 when item to be edited is not found and role is admin", async () => {
    const popID = "61503ae7f4a6fb0b9bb9a218";
    const admin = await createAdmin();
    const jwtToken = await generateJWT(admin.id);
    const token = `Bearer ${jwtToken}`;

    const response = await editFunkoPopRequest(popID, editedFunkoPopItem, {
      token: token
    });
    expect(response.status).toBe(404);
  });

  it("should return 403 when item to be edited is not found and role is user", async () => {
    const popID = "61503ae7f4a6fb0b9bb9a218";
    const user = await createUser();
    const jwtToken = await generateJWT(user.id);
    const token = `Bearer ${jwtToken}`;

    const response = await editFunkoPopRequest(popID, editedFunkoPopItem, {
      token: token
    });
    expect(response.status).toBe(403);
  });

  it("should return 400 when funko pop is being edited and body is not valid and role is admin", async () => {
    const funkopop = await FunkoPops.create(funkoPopItem);
    const popID = funkopop.id;

    const admin = await createAdmin();
    const jwtToken = await generateJWT(admin.id);
    const token = `Bearer ${jwtToken}`;

    const response = await editFunkoPopRequest(
      popID,
      {
        title: "",
        description: "",
        quantity: ""
      },
      {
        token: token
      }
    );
    expect(response.status).toBe(400);
  });

  it("should return path, timestamp, message and validationErrors field when funkopop is being edited and body is not valid and role is admin", async () => {
    const funkopop = await FunkoPops.create(funkoPopItem);
    const popID = funkopop.id;
    const admin = await createAdmin();
    const jwtToken = await generateJWT(admin.id);
    const token = `Bearer ${jwtToken}`;

    const preRequestTimestamp = new Date().getTime();
    const response = await editFunkoPopRequest(
      popID,
      {
        title: "",
        description: "",
        quantity: ""
      },
      {
        token: token
      }
    );
    expect(Object.keys(response.body)).toEqual([
      "path",
      "timestamp",
      "message",
      "validationErrors"
    ]);

    expect(response.body.path).toBe(`/api/1.0/funkopops/${popID}`);
    expect(response.body.message).toBe("Validation Failure");
    expect(response.body.timestamp).toBeGreaterThan(preRequestTimestamp);
  });

  it.each`
    field            | value              | message
    ${"title"}       | ${null}            | ${`Cannot edit funko pop without title!`}
    ${"title"}       | ${""}              | ${`Cannot edit funko pop without title!`}
    ${"title"}       | ${"h3fh34"}        | ${`Title has to be 10-50 characters long`}
    ${"title"}       | ${"h".repeat(51)}  | ${`Title has to be 10-50 characters long`}
    ${"price"}       | ${null}            | ${`Cannot edit funko pop without price!`}
    ${"price"}       | ${"asb3"}          | ${`Price has to be numeric`}
    ${"description"} | ${null}            | ${`Cannot edit funko pop without decription!`}
    ${"description"} | ${"Testdesc"}      | ${`Description has to be 10-250 characters long`}
    ${"description"} | ${"T".repeat(251)} | ${`Description has to be 10-250 characters long`}
    ${"quantity"}    | ${null}            | ${`Cannot edit funko pop without quantity!`}
    ${"quantity"}    | ${"asb4"}          | ${`Quantity has to be numeric`}
  `(
    "returns $message when editing funko pop with $value as value in field $field and role is admin",
    async ({ field, value, message }) => {
      const invalidBody = { ...funkoPopItem };
      invalidBody[field] = value;

      const funkopop = await FunkoPops.create(funkoPopItem);
      const popID = funkopop.id;
      const admin = await createAdmin();
      const jwtToken = await generateJWT(admin.id);
      const token = `Bearer ${jwtToken}`;

      const response = await editFunkoPopRequest(popID, invalidBody, {
        token: token
      });
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
