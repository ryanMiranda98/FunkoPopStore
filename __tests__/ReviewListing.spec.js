const mongoose = require("mongoose");
const app = require("../src/app");
const supertest = require("supertest");
const config = require("config");
const FunkoPop = require("../src/models/FunkPop");
const User = require("../src/models/User");
const Review = require("../src/models/Reviews");
const { hashPassword } = require("../src/utils/generators");

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

const createUser = async () => {
  const hash = await hashPassword(validUser.password);
  return User.create({
    ...validUser,
    password: hash,
    role: "user"
  });
};

const createFunkoPop = async () => {
  return FunkoPop.create(funkoPopItem);
};

const getReviewsRequest = async (productId) => {
  const agent = request.get(`/api/1.0/funkopops/${productId}/reviews`);
  return agent.send();
};

const createReview = async ({ productId, userId, message }) => {
  return Review.create({
    productId,
    userId,
    message
  });
};

beforeAll(async () => {
  await mongoose.connect(dbConfig.url);
});

describe("Review Listing", () => {
  it("returns 200 ok when retrieving all reviews on product", async () => {
    const funkoPop = await createFunkoPop();

    const response = await getReviewsRequest(funkoPop.id);
    expect(response.status).toBe(200);
  });

  it("returns 3 reviews when there are only 3 reviews on product", async () => {
    const user = await createUser();
    const funkoPop = await createFunkoPop();

    const review = {
      productId: funkoPop.id,
      userId: user.id,
      message: "Loved the product"
    };

    await createReview(review);
    await createReview(review);
    await createReview(review);

    const response = await getReviewsRequest(funkoPop.id);
    expect(response.body.reviews.length).toBe(3);
  });

  it("returns 10 reviews when there are only 15 reviews on product", async () => {
    const user = await createUser();
    const funkoPop = await createFunkoPop();

    const review = {
      productId: funkoPop.id,
      userId: user.id,
      message: "Loved the product"
    };

    for (let i = 0; i < 15; i++) {
      await createReview(review);
    }

    const response = await getReviewsRequest(funkoPop.id);
    expect(response.body.reviews.length).toBe(10);
  });

  it("returns 200 and [] when there are no reviews on product", async () => {
    const funkoPop = await createFunkoPop();

    const response = await getReviewsRequest(funkoPop.id);
    expect(response.status).toBe(200);
    expect(response.body.reviews.length).toBe(0);
  });

  it("returns 404 error and funko pop not found message when creating a review for invalid product", async () => {
    const response = await getReviewsRequest("6173bb466e5c8157e8827acd");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Sorry! Requested Funko Pop not found");
  });

  it("returns 404 error and Cast Error message when creating a review for invalid product", async () => {
    const response = await getReviewsRequest("6173bb466e5c8157e88");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe(
      "Sorry! You have provided an invalid resource ID"
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
