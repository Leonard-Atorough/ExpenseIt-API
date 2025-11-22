import "dotenv/config";
import { authService } from "../services/authService.js";
import { parseExpiryToMs } from "../utils/timeUtils.js";

// Robust authentication controller to handle user auth routes
// including registration, login, token refresh, and logout.
// Missing features: account verification, password reset, multi-factor authentication.
export function authController(prisma) {
  const service = authService(prisma);

  async function register(req, res, next) {
    console.log("Handling registration request");
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !email || !password)
      return res.status(400).json({ message: "Required fields missing." });

    try {
      const result = await service.register({ firstName, lastName, email, password });

      if (!result.ok) {
        return res.status(result.code).json({ message: result.message || "Registration failed" });
      }

      console.log("Registration successful for user:", result.data.email);

      // A future enhancement could be to send a verification email here to confirm the user's email address.
      // We can then have another endpoint to handle email verification.
      return res.status(result.code).json({ user: result.data });
    } catch (err) {
      console.error("Failed to register account", err);
      next(err instanceof Error ? err : new Error(String(err)));
    }
  }

  async function login(req, res, next) {
    console.log("Handling login request");
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ message: "Required fields missing" });

      const ip = req.ip;
      const userAgent = req.get("User-Agent") ?? "";

      const result = await service.login({ email, password, ip, userAgent });

      if (!result.ok) return res.status(result.code).json({ message: result.message });

      const { accessToken, refreshToken, user } = result.data;

      //for more info on res and all its methods https://expressjs.com/en/5x/api.html#res
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === "true",
        path: "/auth/refresh",
        maxAge: parseExpiryToMs(process.env.REFRESH_TOKEN_EXP || "7d"),
        sameSite: "Lax",
      });

      console.log("Login successful, tokens set");
      //finally, send access token alongside user (user has been lceaned in the service, password not exposed)
      // In the future we can consider adding roles/permissions to the user object here
      // and we can also consider sending an 2FA email if we implement multi-factor authentication (research needed)
      return res.status(result.code).json({ accessToken, user });
    } catch (err) {
      console.error("Failed login", err);
      next(err instanceof Error ? err : new Error(String(err)));
    }
  }

  async function refresh(req, res, next) {
    console.log("Handling token refresh request");
    const rawRefresh = req.cookies.refreshToken;
    if (!rawRefresh) return res.status(401).json({ message: "No refresh token provided" });

    try {
      const result = await service.refresh({ rawRefresh });

      if (!result.ok) return res.status(result.code).json({ message: result.message });
      // TODO - Log the refresh event. Question is where to log it. Maybe a new collection/table for auth events?
      const { token, refreshToken } = result.data;

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === "true",
        path: "/auth/refresh",
        maxAge: parseExpiryToMs(process.env.REFRESH_TOKEN_EXP || "7d"),
        sameSite: "Lax",
      });

      console.log("Token refresh successful, new tokens set");
      return res.status(result.code).json({ accessToken: token });
      // NOTE - We return our access token in the response body, but the refresh token is set as a cookie
      // This is to prevent XSS attacks from stealing the refresh token
    } catch (err) {
      console.error("Failed refresh", err);
      next(err instanceof Error ? err : new Error(String(err)));
    }
  }

  async function logout(req, res, next) {
    console.log("Handling logout request");
    const rawRefresh = req.cookies.refreshToken;
    if (!rawRefresh) return res.status(400).json({ message: "No refresh token provided" });

    try {
      const result = await service.logout({ rawRefresh });
      if (!result.ok) return res.status(result.code).json({ message: result.message });

      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === "true",
        path: "/auth/refresh",
        sameSite: "Lax",
      });

      console.log("Logout successful, refresh token cleared");
      return res.status(result.code).json({ message: "Logged out successfully" });
    } catch (err) {
      console.error("Failed logout", err);
      next(err instanceof Error ? err : new Error(String(err)));
    }
  }

  return { register, login, refresh, logout };
}
