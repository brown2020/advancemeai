import { sendEmailVerificationAllowingPreviewHost } from "./email-verification";

describe("sendEmailVerificationAllowingPreviewHost", () => {
  it("sends with the continue URL when Firebase accepts it", async () => {
    const sendWithContinueUrl = jest.fn().mockResolvedValue(undefined);
    const sendPlain = jest.fn();

    const result = await sendEmailVerificationAllowingPreviewHost(
      sendWithContinueUrl,
      sendPlain,
      () => null
    );

    expect(result).toBe("sent");
    expect(sendWithContinueUrl).toHaveBeenCalledTimes(1);
    expect(sendPlain).not.toHaveBeenCalled();
  });

  it("retries without a continue URL when the preview host is unauthorized", async () => {
    const unauthorized = Object.assign(new Error("unauthorized"), {
      code: "auth/unauthorized-continue-uri",
    });
    const sendWithContinueUrl = jest.fn().mockRejectedValue(unauthorized);
    const sendPlain = jest.fn().mockResolvedValue(undefined);

    const result = await sendEmailVerificationAllowingPreviewHost(
      sendWithContinueUrl,
      sendPlain,
      (error) =>
        error && typeof error === "object" && "code" in error
          ? String((error as { code: unknown }).code)
          : null
    );

    expect(result).toBe("sent-without-continue-url");
    expect(sendPlain).toHaveBeenCalledTimes(1);
  });

  it("surfaces other send failures", async () => {
    const failure = Object.assign(new Error("quota"), { code: "auth/too-many-requests" });
    await expect(
      sendEmailVerificationAllowingPreviewHost(
        () => Promise.reject(failure),
        jest.fn(),
        () => "auth/too-many-requests"
      )
    ).rejects.toBe(failure);
  });
});
