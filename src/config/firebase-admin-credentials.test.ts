import { resolveAdminCredentials } from "./firebase-admin-credentials";

const key = "-----BEGIN PRIVATE KEY-----\\nabc123\\n-----END PRIVATE KEY-----\\n";

describe("resolveAdminCredentials", () => {
  it("resolves split Firebase Admin environment variables", () => {
    expect(
      resolveAdminCredentials({
        FIREBASE_PROJECT_ID: "advance-me",
        FIREBASE_CLIENT_EMAIL:
          "firebase-adminsdk-test@advance-me.iam.gserviceaccount.com",
        FIREBASE_PRIVATE_KEY: key,
      })
    ).toEqual({
      projectId: "advance-me",
      clientEmail:
        "firebase-adminsdk-test@advance-me.iam.gserviceaccount.com",
      privateKey:
        "-----BEGIN PRIVATE KEY-----\nabc123\n-----END PRIVATE KEY-----\n",
    });
  });

  it("resolves FIREBASE_ADMIN_* aliases", () => {
    expect(
      resolveAdminCredentials({
        FIREBASE_ADMIN_PROJECT_ID: "advance-me",
        FIREBASE_ADMIN_CLIENT_EMAIL:
          "firebase-adminsdk-test@advance-me.iam.gserviceaccount.com",
        FIREBASE_ADMIN_PRIVATE_KEY: key,
      })
    ).toMatchObject({
      projectId: "advance-me",
      clientEmail:
        "firebase-adminsdk-test@advance-me.iam.gserviceaccount.com",
    });
  });

  it("resolves a service-account JSON environment variable", () => {
    const serviceAccount = JSON.stringify({
      project_id: "advance-me",
      client_email:
        "firebase-adminsdk-test@advance-me.iam.gserviceaccount.com",
      private_key: key,
    });

    expect(
      resolveAdminCredentials({ FIREBASE_SERVICE_ACCOUNT_KEY: serviceAccount })
    ).toEqual({
      projectId: "advance-me",
      clientEmail:
        "firebase-adminsdk-test@advance-me.iam.gserviceaccount.com",
      privateKey:
        "-----BEGIN PRIVATE KEY-----\nabc123\n-----END PRIVATE KEY-----\n",
    });
  });

  it("resolves a base64 service-account JSON environment variable", () => {
    const serviceAccount = Buffer.from(
      JSON.stringify({
        project_id: "advance-me",
        client_email:
          "firebase-adminsdk-test@advance-me.iam.gserviceaccount.com",
        private_key: key,
      }),
      "utf8"
    ).toString("base64");

    expect(
      resolveAdminCredentials({
        FIREBASE_SERVICE_ACCOUNT_JSON_BASE64: serviceAccount,
      })
    ).toMatchObject({
      projectId: "advance-me",
      clientEmail:
        "firebase-adminsdk-test@advance-me.iam.gserviceaccount.com",
    });
  });

  it("resolves base64 JSON from a generic service-account environment variable", () => {
    const serviceAccount = Buffer.from(
      JSON.stringify({
        project_id: "advance-me",
        client_email:
          "firebase-adminsdk-test@advance-me.iam.gserviceaccount.com",
        private_key: key,
      }),
      "utf8"
    ).toString("base64");

    expect(
      resolveAdminCredentials({ FIREBASE_SERVICE_ACCOUNT_KEY: serviceAccount })
    ).toMatchObject({
      projectId: "advance-me",
      clientEmail:
        "firebase-adminsdk-test@advance-me.iam.gserviceaccount.com",
    });
  });

  it("returns null when credentials are incomplete", () => {
    expect(
      resolveAdminCredentials({
        FIREBASE_PROJECT_ID: "advance-me",
        FIREBASE_PRIVATE_KEY: key,
      })
    ).toBeNull();
  });
});
