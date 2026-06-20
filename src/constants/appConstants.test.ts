import { ROUTES } from "./appConstants";

describe("appConstants", () => {
  describe("ROUTES.AUTH", () => {
    it("matches the mounted auth routes", () => {
      expect(ROUTES.AUTH.LOGIN).toBe("/auth/signin");
      expect(ROUTES.AUTH.REGISTER).toBe("/auth/signup");
    });
  });
});
