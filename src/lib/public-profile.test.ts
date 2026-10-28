import { toPublicProfile } from "./public-profile";

describe("toPublicProfile", () => {
  it("drops email and subscription fields", () => {
    const profile = toPublicProfile("uid-1", {
      email: "student@example.com",
      subscription: "plus",
      subscriptionExpiresAt: 123,
      displayName: "Ada",
      username: "ada",
      role: "teacher",
      photoUrl: "https://lh3.googleusercontent.com/a/photo",
      school: "North",
      createdAt: 10,
      updatedAt: 20,
    });

    expect(profile).toEqual({
      uid: "uid-1",
      displayName: "Ada",
      username: "ada",
      role: "teacher",
      photoUrl: "https://lh3.googleusercontent.com/a/photo",
      school: "North",
      createdAt: 10,
      updatedAt: 20,
    });
    expect(profile).not.toHaveProperty("email");
    expect(profile).not.toHaveProperty("subscription");
  });

  it("rejects non-https photos", () => {
    const profile = toPublicProfile("uid-2", {
      photoUrl: "http://evil.example/a.png",
      role: "nope",
    });
    expect(profile.photoUrl).toBeUndefined();
    expect(profile.role).toBe("student");
  });
});
