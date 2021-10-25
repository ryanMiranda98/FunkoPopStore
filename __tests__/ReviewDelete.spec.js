const mongoose = require("mongoose");
const app = require("../src/app");
const supertest = require("supertest");
const config = require("config");
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

const createAdminToken = async (testUser = { ...validUser }) => {
  const hash = await hashPassword(testUser.password);
  const user = await User.create({
    ...testUser,
    password: hash,
    role: "admin"
  });
  const token = await generateJWT(user.id);
  return `Bearer ${token}`;
};

const createUserToken = async (testUser = { ...validUser }) => {
  const hash = await hashPassword(testUser.password);
  const user = await User.create({
    ...testUser,
    password: hash,
    role: "user"
  });
  const token = await generateJWT(user.id);
  return `Bearer ${token}`;
};

const createFunkoPop = async () => {
  return FunkoPop.create(funkoPopItem);
};

const createReview = async ({ productId, userId, message }) => {
  return Review.create({
    productId,
    userId,
    message,
    timestamp: new Date().getTime()
  });
};

const deleteReviewRequest = async (productId, reviewId, options = {}) => {
  const agent = request.delete(
    `/api/1.0/funkopops/${productId}/reviews/${reviewId}`
  );
  if (options.token) {
    agent.set("authorization", options.token);
  }
  return agent.send();
};

beforeAll(async () => {
  await mongoose.connect(dbConfig.url);
});

describe("Review Delete", () => {
  it("returns 200 ok when deleting review with authenticated user", async () => {
    const funkoPop = await createFunkoPop();
    const token = await createUserToken();
    const userId = await verifyJWT(token.split("Bearer ")[1]);

    const reviewData = {
      productId: funkoPop.id,
      userId: userId,
      message: "Loved the product"
    };
    const review = await createReview(reviewData);

    const response = await deleteReviewRequest(funkoPop.id, review.id, {
      token
    });
    expect(response.status).toBe(200);
  });

  it("should delete review from DB when authenticated user deletes it", async () => {
    const funkoPop = await createFunkoPop();
    const token = await createUserToken();
    const userId = await verifyJWT(token.split("Bearer ")[1]);

    const reviewData = {
      productId: funkoPop.id,
      userId: userId,
      message: "Loved the product"
    };
    const review = await createReview(reviewData);
    await deleteReviewRequest(funkoPop.id, review.id, {
      token
    });

    const reviewDb = await Review.find();
    expect(reviewDb.length).toBe(0);
  });

  it("should return deleted review in response when authenticated user deletes review", async () => {
    const funkoPop = await createFunkoPop();
    const token = await createUserToken();
    const userId = await verifyJWT(token.split("Bearer ")[1]);

    const reviewData = {
      productId: funkoPop.id,
      userId: userId,
      message: "Loved the product"
    };
    const review = await createReview(reviewData);
    const response = await deleteReviewRequest(funkoPop.id, review.id, {
      token
    });

    expect(response.body.deletedReview).toBeTruthy();
  });

  it("returns fields productId, userId, message, timestamp, _id in response when authenticated user deletes review", async () => {
    const funkoPop = await createFunkoPop();
    const token = await createUserToken();
    const userId = await verifyJWT(token.split("Bearer ")[1]);

    const reviewData = {
      productId: funkoPop.id,
      userId: userId,
      message: "Loved the product"
    };
    const review = await createReview(reviewData);
    const response = await deleteReviewRequest(funkoPop.id, review.id, {
      token
    });
    expect(Object.keys(response.body.deletedReview)).toEqual([
      "_id",
      "productId",
      "userId",
      "message",
      "timestamp"
    ]);
  });

  it("returns 200 when a user with role admin tries to delete any another users review", async () => {
    const funkoPop = await createFunkoPop();
    const userToken = await createUserToken();
    const userId = await verifyJWT(userToken.split("Bearer ")[1]);

    const reviewData = {
      productId: funkoPop.id,
      userId: userId,
      message: "Loved the product"
    };
    const review = await createReview(reviewData);
    const adminToken = await createAdminToken({
      email: "test@test.com",
      password: "12345677"
    });

    const response = await deleteReviewRequest(funkoPop.id, review.id, {
      token: adminToken
    });
    expect(response.status).toBe(200);
  });

  it("deletes review from FunkoPop product when authenticated user deletes their review", async () => {
    const funkoPop = await createFunkoPop();
    const userToken = await createUserToken();
    const userId = await verifyJWT(userToken.split("Bearer ")[1]);

    const reviewData = {
      productId: funkoPop.id,
      userId: userId,
      message: "Loved the product"
    };
    const review = await createReview(reviewData);

    await deleteReviewRequest(funkoPop.id, review.id, {
      token: userToken
    });

    const updatedFunko = await FunkoPop.findById(funkoPop.id);
    const funkoReview = updatedFunko.reviews.length;
    expect(funkoReview).toBe(0);
  });

  it("returns 401 and unauthorized error message when deleting review with unauthenticated user", async () => {
    const funkoPop = await createFunkoPop();
    const token = await createUserToken();
    const userId = await verifyJWT(token.split("Bearer ")[1]);

    const reviewData = {
      productId: funkoPop.id,
      userId: userId,
      message: "Loved the product"
    };
    const review = await createReview(reviewData);

    const response = await deleteReviewRequest(funkoPop.id, "review.id");
    expect(response.status).toBe(401);
    expect(response.body.message).toBe(
      "You are unauthorized to access this route"
    );
  });

  it("returns 404 error and funko pop not found message when creating a review for invalid product with authenticated user", async () => {
    const invalidFunkoPopId = "6173bb466e5c8157e8827acd";
    const invalidReviewId = "6173bb466e5c8157e8827acd";
    const token = await createUserToken();
    const userId = await verifyJWT(token.split("Bearer ")[1]);

    const reviewData = {
      productId: invalidFunkoPopId,
      userId: userId,
      message: "Loved the product"
    };

    await createReview(reviewData);

    const response = await deleteReviewRequest(
      invalidFunkoPopId,
      invalidReviewId,
      { token }
    );

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Sorry! Requested Funko Pop not found");
  });

  it("returns 404 error and Cast Error message when creating a review for invalid product with authenticated user", async () => {
    const invalidFunkoPopId = "6173bb466e5c8157e8827a";
    const invalidReviewId = "6173bb466e5c8157e8827a";
    const token = await createUserToken();

    const response = await deleteReviewRequest(
      invalidFunkoPopId,
      invalidReviewId,
      { token }
    );
    expect(response.status).toBe(404);
    expect(response.body.message).toBe(
      "Sorry! You have provided an invalid resource ID"
    );
  });

  it("should return 404 when deleting review that doesn't exists", async () => {
    const funkoPop = await createFunkoPop();
    const token = await createUserToken();

    const response = await deleteReviewRequest(
      funkoPop.id,
      "6173bb466e5c8157e8827acd",
      {
        token
      }
    );
    expect(response.status).toBe(404);
  });

  it("returns 403 and forbidden access message when a user with role user tries to delete another users comment", async () => {
    const funkoPop = await createFunkoPop();
    const firstUserToken = await createUserToken();
    const userId = await verifyJWT(firstUserToken.split("Bearer ")[1]);

    const reviewData = {
      productId: funkoPop.id,
      userId: userId,
      message: "Loved the product"
    };
    const review = await createReview(reviewData);
    const secondUserToken = await createUserToken({
      email: "test@test.com",
      password: "12345677"
    });

    const response = await deleteReviewRequest(funkoPop.id, review.id, {
      token: secondUserToken
    });
    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      "You are forbidden to access this route"
    );
  });
});

afterEach(async () => {
  await Review.deleteMany();
  await FunkoPop.deleteMany();
  await User.deleteMany();
});

afterAll(async () => {
  await mongoose.disconnect();
});
