import type {
  ApiResponse,
  AuthResponseDto,
  CreateUserDto,
  LoginUserDto,
  RefreshTokenResponseDto,
  UserResponseDto,
} from "src/application/dtos";
import type { AuthenticationService } from "src/application/services";
import type { NextFunction, Request, Response } from "express";

export class AuthenticationController {
  private authenticationService: AuthenticationService;
  constructor(authenticationService: AuthenticationService) {
    this.authenticationService = authenticationService;
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
        data: authResult,
      };

      res.status(200).json(response);
    } catch (err) {
      next(err instanceof Error ? err : new Error(String(err)));
    }
  }

  async Refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawRefresh = req.cookies.refreshToken as string;

      const refreshResult = await this.authenticationService.refresh({ rawRefresh });

      const response: ApiResponse<RefreshTokenResponseDto> = {
        ok: true,
        code: 200,
        data: refreshResult,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err instanceof Error ? err : new Error(String(err)));
    }
  }

  async Logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawRefresh = req.cookies.refreshToken as string;

      await this.authenticationService.logout({ rawRefresh });

      const response: ApiResponse<null> = {
        ok: true,
        code: 200,
        data: null,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
