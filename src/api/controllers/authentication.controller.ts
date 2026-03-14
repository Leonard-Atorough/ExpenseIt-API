import type {
  ApiResponse,
  AuthResponseDto,
  CreateUserDto,
  LoginUserDto,
  TokenResponseDto,
  UserResponseDto,
} from "src/application/dtos";
import type { AuthenticationService } from "src/application/services";
import type { NextFunction, Request, Response } from "express";
import { REFRESH_TOKEN_COOKIE_OPTIONS } from "../config";
import { ENVIRONMENT_CONFIG } from "@config";
import { ForbiddenError } from "@src/application/errors";

export class AuthenticationController {
  private authenticationService: AuthenticationService;
  constructor(authenticationService: AuthenticationService) {
    this.authenticationService = authenticationService;
  }

  async GetCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    const userId = req.user?.sub;
    try {
      const user = await this.authenticationService.getCurrentUser(userId);
      const response: ApiResponse<UserResponseDto> = {
        ok: true,
        code: 200,
        data: user,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err instanceof Error ? err : new Error(String(err)));
    }
  }

  async Register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.body as unknown as CreateUserDto;

      const newUser = await this.authenticationService.register(user);

      const response: ApiResponse<UserResponseDto> = {
        ok: true,
        code: 201,
        data: newUser,
      };
      res.status(201).json(response);
    } catch (err) {
      // handle localized errors here (errors of type AppError with known codes)
      // for unexpected errors, pass on to global error handler
      next(err instanceof Error ? err : new Error(String(err)));
    }
  }

  async Login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body as unknown as LoginUserDto;

      // In a future enhancement, we could log the IP address and user agent for security monitoring and anomaly detection.
      const ip = req.ip;
      const userAgent = req.get("User-Agent") ?? "";

      const authResult = await this.authenticationService.login(email, password);
      const response: ApiResponse<AuthResponseDto> = {
        ok: true,
        code: 200,
        data: authResult.authUser,
      };

      res.cookie("refreshToken", authResult.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
      res.status(200).json(response);
    } catch (err) {
      next(err instanceof Error ? err : new Error(String(err)));
    }
  }

  async Refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawRefresh = req.cookies.refreshToken as string;

      const refreshResult = await this.authenticationService.refresh({ rawRefresh });

      const response: ApiResponse<TokenResponseDto> = {
        ok: true,
        code: 200,
        data: refreshResult.token,
      };
      res.cookie("refreshToken", refreshResult.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

      res.status(200).json(response);
    } catch (err) {
      next(err instanceof Error ? err : new Error(String(err)));
    }
  }

  async Logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawRefresh = req.cookies.refreshToken as string;

      await this.authenticationService.logout({ rawRefresh });

      const response: ApiResponse<void> = {
        ok: true,
        code: 200,
      };
      res.clearCookie("refreshToken", REFRESH_TOKEN_COOKIE_OPTIONS);
      res.status(200).json(response);
    } catch (err) {
      next(err instanceof Error ? err : new Error(String(err)));
    }
  }

  /**
   * This endpoint is for testing purposes only. It allows us to generate a token for a user without going through the login process.
   * Requires a special header "x-test-token" with a value that matches ENVIRONMENT_CONFIG.TEST_TOKEN. If the header is missing or the value does not match, it returns a 403 Forbidden response.
   * This way we can safely have this endpoint in our codebase without risking unauthorized access in production, since the test token value should only be known to developers and testers.
   *
   * @param req
   * @param res
   * @param next
   */
  async GenerateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    const testTokenHeader = req.headers["x-test-token"];
    if (ENVIRONMENT_CONFIG.TEST_TOKEN && testTokenHeader !== ENVIRONMENT_CONFIG.TEST_TOKEN) {
      throw new ForbiddenError("Invalid test token");
      return;
    }

    try {
      const { userId } = req.body as { userId: string };
      const tokenResult = await this.authenticationService.generateToken(userId);
      const response: ApiResponse<{ token: string, refreshToken: string }> = {
        ok: true,
        code: 200,
        data: tokenResult,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
