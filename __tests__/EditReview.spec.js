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

const createAdminToken = async (userInfo = { ...validUser }) => {
  const hash = await hashPassword(userInfo.password);
  const user = await User.create({
    ...userInfo,
    password: hash,
    role: "admin"
  });
  const token = await generateJWT(user.id);
  return `Bearer ${token}`;
};

const createUserToken = async (userInfo = { ...validUser }) => {
  const hash = await hashPassword(userInfo.password);
  const user = await User.create({
    ...userInfo,
    password: hash,
    role: "user"
  });
  const token = await generateJWT(user.id);
  return `Bearer ${token}`;
};

const createFunkoPop = async () => {
  return FunkoPop.create(funkoPopItem);
};

const createReview = async (productId, userId, message) => {
  return Review.create({
    productId,
    userId,
    message,
    timestamp: new Date().getTime()
  });
};

const editReviewRequest = async (editInfo, options = {}) => {
  const { productId, reviewId, message } = editInfo;
  const agent = request.patch(
    `/api/1.0/funkopops/${productId}/reviews/${reviewId}`
  );
  if (options.token) {
    agent.set("authorization", options.token);
  }
  return agent.send({ message });
};

beforeAll(async () => {
  await mongoose.connect(dbConfig.url);
});

describe("Edit Review", () => {
  it("returns 200 when authenticated user edits their own review", async () => {
    const funkoPop = await createFunkoPop();
    const token = await createUserToken();
    const userId = await verifyJWT(token.split("Bearer ")[1]);
    const review = await createReview(funkoPop.id, userId, "Loved the product");

    const response = await editReviewRequest(
      {
        productId: funkoPop.id,
        reviewId: review.id,
        message: "Fantastic product"
      },
      { token }
    );
    expect(response.status).toBe(200);
  });

  it("returns fields _id, productId, userId, message, timestamp when authenticated user edits their own review", async () => {
    const funkoPop = await createFunkoPop();
    const token = await createUserToken();
    const userId = await verifyJWT(token.split("Bearer ")[1]);
    const review = await createReview(funkoPop.id, userId, "Loved the product");

    const response = await editReviewRequest(
      {
        productId: funkoPop.id,
        reviewId: review.id,
        message: "Fantastic product"
      },
      { token }
    );
    expect(Object.keys(response.body.review)).toEqual([
      "_id",
      "productId",
      "userId",
      "message",
      "timestamp"
    ]);
  });

  it("returns updated message and  when authenticated user edits their own review", async () => {
    const funkoPop = await createFunkoPop();
    const token = await createUserToken();
    const userId = await verifyJWT(token.split("Bearer ")[1]);
    const review = await createReview(funkoPop.id, userId, "Loved the product");

    const response = await editReviewRequest(
      {
        productId: funkoPop.id,
        reviewId: review.id,
        message: "Fantastic product"
      },
      { token }
    );
    expect(response.body.review.message).toBe("Fantastic product");
    expect(response.body.review.message).not.toBe(review.message);
    expect(response.body.review.timestamp).not.toBe(review.timestamp);
  });

  it("saves updated review in DB when authenticated user edits their own review", async () => {
    const funkoPop = await createFunkoPop();
    const token = await createUserToken();
    const userId = await verifyJWT(token.split("Bearer ")[1]);
    const review = await createReview(funkoPop.id, userId, "Loved the product");

    const response = await editReviewRequest(
      {
        productId: funkoPop.id,
        reviewId: review.id,
        message: "Fantastic product"
      },
      { token }
    );

    const updatedReview = await Review.findById(review.id);

    expect(updatedReview.message).toBe(response.body.review.message);
    expect(updatedReview.timestamp).not.toBe(response.body.review.timestamp);
  });

  it("does not increment reviews in FunkoPop product when authenticated user edits their own review", async () => {
    const funkoPop = await createFunkoPop();
    const token = await createUserToken();
    const userId = await verifyJWT(token.split("Bearer ")[1]);
    const review = await createReview(funkoPop.id, userId, "Loved the product");

    const fetchFunkoBeforeEdit = await FunkoPop.findById(funkoPop.id);
    const beforeReviewCount = fetchFunkoBeforeEdit.reviews.length;
    const beforeReviewId = fetchFunkoBeforeEdit.reviews[0];
    await editReviewRequest(
      {
        productId: funkoPop.id,
        reviewId: review.id,
        message: "Fantastic product"
      },
      { token }
    );

    const fetchFunkoAfterEdit = await FunkoPop.findById(funkoPop.id);
    const afterReviewCount = fetchFunkoAfterEdit.reviews.length;
    const afterReviewId = fetchFunkoAfterEdit.reviews[0];

    expect(beforeReviewCount).toBe(afterReviewCount);
    expect(beforeReviewId).toBe(afterReviewId);
  });

  it("returns same review ID when authenticated user edits their own review", async () => {
    const funkoPop = await createFunkoPop();
    const token = await createUserToken();
    const userId = await verifyJWT(token.split("Bearer ")[1]);
    const review = await createReview(funkoPop.id, userId, "Loved the product");

    const response = await editReviewRequest(
      {
        productId: funkoPop.id,
        reviewId: review.id,
        message: "Fantastic product"
      },
      { token }
    );

    expect(response.body.review._id).toBe(review.id);
  });

  it("returns 404 and funkopop not found message when authenticated user tries to edit review of an invalid funkopop", async () => {
    const funkoPop = await createFunkoPop();
    const token = await createUserToken();
    const userId = await verifyJWT(token.split("Bearer ")[1]);
    const review = await createReview(funkoPop.id, userId, "Loved the product");

    const response = await editReviewRequest(
      {
        productId: "6173bb466e5c8157e8827acd",
        reviewId: review.id,
        message: "Fantastic product"
      },
      { token }
    );
    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Sorry! Requested Funko Pop not found");
  });

  it("returns 404 and review not found message when authenticated user tries to edit an invalid review", async () => {
    const funkoPop = await createFunkoPop();
    const token = await createUserToken();
    const userId = await verifyJWT(token.split("Bearer ")[1]);
    const review = await createReview(funkoPop.id, userId, "Loved the product");

    const response = await editReviewRequest(
      {
        productId: funkoPop.id,
        reviewId: "6173bb466e5c8157e8827acd",
        message: "Fantastic product"
      },
      { token }
    );
    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Sorry! Requested review not found");
  });

  it("returns 404 and funkopop not found message when authenticated user tries to edit an invalid product with invalid review", async () => {
    const funkoPop = await createFunkoPop();
    const token = await createUserToken();
    const userId = await verifyJWT(token.split("Bearer ")[1]);
    const review = await createReview(funkoPop.id, userId, "Loved the product");

    const response = await editReviewRequest(
      {
        productId: "6173bb466e5c8157e8827acd",
        reviewId: "6173bb466e5c8157e8827acd",
        message: "Fantastic product"
      },
      { token }
    );
    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Sorry! Requested Funko Pop not found");
  });

  it("returns 403 and forbidden message when authenticated user tries to edit a review that is not their own", async () => {
    const funkoPop = await createFunkoPop();
    const firstUserToken = await createUserToken();
    const userId = await verifyJWT(firstUserToken.split("Bearer ")[1]);
    const review = await createReview(funkoPop.id, userId, "Loved the product");

    const secondUserToken = await createUserToken({
      email: "test@test.com",
      password: "test1234"
    });
    const response = await editReviewRequest(
      {
        productId: funkoPop.id,
        reviewId: review.id,
        message: "Fantastic product"
      },
      { token: secondUserToken }
    );
    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      "You are forbidden to access this route"
    );
  });

  it("returns 403 and forbidden message when authenticated admin tries to edit a review that is not their own", async () => {
    const funkoPop = await createFunkoPop();
    const userToken = await createUserToken();
    const userId = await verifyJWT(userToken.split("Bearer ")[1]);
    const review = await createReview(funkoPop.id, userId, "Loved the product");

    const adminToken = await createAdminToken({
      email: "test@test.com",
      password: "test1234"
    });
    const response = await editReviewRequest(
      {
        productId: funkoPop.id,
        reviewId: review.id,
        message: "Fantastic product"
      },
      { token: adminToken }
    );
    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      "You are forbidden to access this route"
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
      const userId = await verifyJWT(token.split("Bearer ")[1]);
      const review = await createReview(
        funkoPop.id,
        userId,
        "Loved the product"
      );

      const response = await editReviewRequest(
        {
          productId: funkoPop.id,
          reviewId: review.id,
          message: value
        },
        { token }
      );
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
