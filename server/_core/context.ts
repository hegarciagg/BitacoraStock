import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Si falla la autenticación (OAuth no configurado), inyectamos un usuario por defecto
    // para permitir el uso de la aplicación localmente.
    user = {
      id: 1,
      openId: "invitado_local",
      name: "Usuario Hegarciagg",
      email: "hegarciagg@local.com",
      loginMethod: "local",
      passwordHash: null,
      isEmailVerified: 1,
      role: "admin",
      riskProfile: "moderate",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      profilePicture: null,
    };
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
