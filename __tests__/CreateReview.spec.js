const supertest = require("supertest");
const mongoose = require("mongoose");
const config = require("config");
const app = require("../src/app");
const FunkoPop = require("../src/models/FunkPop");
const User = require("../src/models/User");
const Review = require("../src/models/Reviews");
const {
  hashPassword,
  generateJWT,
  verifyJWT
} = require("../src/utils/generators");

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

const createUserToken = async () => {
  const hash = await hashPassword(validUser.password);
  const user = await User.create({
    ...validUser,
    password: hash,
    role: "user"
  });
  const token = await generateJWT(user.id);
  return `Bearer ${token}`;
};

const createFunkoPop = async () => {
  return FunkoPop.create(funkoPopItem);
};

const createReviewRequest = async (productId, message, options = {}) => {
  const agent = request.post(`/api/1.0/funkopops/${productId}/reviews`);
  if (options.token) {
    agent.set("authorization", options.token);
  }
  const body = { message };
  return agent.send(body);
};

describe("Create Reviews", () => {
  it("returns 200 ok when creating a review with authenticated user", async () => {
    const funkoPop = await createFunkoPop();
    const token = await createUserToken();

    const response = await createReviewRequest(
      funkoPop.id,
      "Loved the product",
      { token }
    );
    expect(response.status).toBe(200);
  });

  it("returns fields productId, userId, message, timestamp when creating user with authenticated user", async () => {
    const funkoPop = await createFunkoPop();
    const token = await createUserToken();

    const response = await createReviewRequest(
      funkoPop.id,
      "Loved the product",
      { token }
    );
    expect(Object.keys(response.body.review)).toEqual([
      "productId",
      "userId",
      "message",
      "timestamp",
      "_id",
      "__v"
    ]);
  });

  it("saves review ID in FunkoPop product when successful review is created by authenticated user", async () => {
    const funkoPop = await createFunkoPop();
    const token = await createUserToken();

    const response = await createReviewRequest(
      funkoPop.id,
      "Loved the product",
      { token }
    );

    const updatedFunko = await FunkoPop.findById(funkoPop.id);
    const funkoReview = updatedFunko.reviews[0].toString();
    expect(response.body.review._id).toBe(funkoReview);
  });

  it("should return save current user ID when successful review is created by authenicated user", async () => {
    const funkoPop = await createFunkoPop();
    const token = await createUserToken();

    const response = await createReviewRequest(
      funkoPop.id,
      "Loved the product",
      { token }
    );

    const userId = await verifyJWT(token.split("Bearer ")[1]);
    expect(response.body.review.userId).toBe(userId);
  });

  it("should return save message when successful review is created by authenicated user", async () => {
    const funkoPop = await createFunkoPop();
    const token = await createUserToken();

    const response = await createReviewRequest(
      funkoPop.id,
      "Loved the product",
      { token }
    );

    expect(response.body.review.message).toBe("Loved the product");
  });

  it("returns 401 and unauthorized message when creating a review with unauthenticated user", async () => {
    const funkoPop = await createFunkoPop();

    const response = await createReviewRequest(
      funkoPop.id,
      "Loved the product"
    );

    expect(response.status).toBe(401);
    expect(response.body.message).toBe(
      "You are unauthorized to access this route"
    );
  });

  it("returns 404 error and funko pop not found message when creating a review for invalid product with authenticated user", async () => {
    const token = await createUserToken();
    const response = await createReviewRequest(
      "6173bb466e5c8157e8827acd",
      "Loved the product",
      { token }
    );

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Sorry! Requested Funko Pop not found");
  });

  it("returns 404 error and Cast Error message when creating a review for invalid product with authenticated user", async () => {
    const token = await createUserToken();
    const response = await createReviewRequest(
      "6173bb466e5c8157e88",
      "Loved the product",
      { token }
    );

    expect(response.status).toBe(404);
    expect(response.body.message).toBe(
      "Sorry! You have provided an invalid resource ID"
    );
  });

  it.each`
    field        | value              | length     | message
    ${"message"} | ${null}            | ${"null"}  | ${"Message cannot be empty"}
    ${"message"} | ${"nyc"}           | ${"short"} | ${"Message has to be atleast 4 characters long"}
    ${"message"} | ${"n".repeat(501)} | ${"long"}  | ${"Message cannot be more than 500 characters long"}
  `(
    "returns message $message when value is $length for field $field",
    async ({ field, value, message }) => {
      const funkoPop = await createFunkoPop();
      const token = await createUserToken();

      const response = await createReviewRequest(funkoPop.id, value, { token });
      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Validation Failure");
      expect(response.body.validationErrors[field]).toBe(message);
    }
  );
});

afterEach(async () => {
  await Review.deleteMany();
  await FunkoPop.deleteMany();
  await User.deleteMany();
});

afterAll(async () => {
  await mongoose.disconnect();
});
