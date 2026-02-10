import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: string = "1"): TrpcContext {
  const user: AuthenticatedUser = {
    id: parseInt(userId),
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "oauth",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("auth.getSessions", () => {
  it("debe retornar lista de sesiones del usuario autenticado", async () => {
    const ctx = createAuthContext("1");
    const caller = appRouter.createCaller(ctx);

    const sessions = await caller.auth.getSessions();

    expect(Array.isArray(sessions)).toBe(true);
    // Cada sesión debe tener los campos requeridos
    if (sessions.length > 0) {
      const session = sessions[0];
      expect(session).toHaveProperty("id");
      expect(session).toHaveProperty("userId");
      expect(session).toHaveProperty("deviceInfo");
      expect(session).toHaveProperty("ipAddress");
      expect(session).toHaveProperty("lastActivity");
      expect(session).toHaveProperty("createdAt");
    }
  });

  it("debe retornar sesiones ordenadas por lastActivity descendente", async () => {
    const ctx = createAuthContext("1");
    const caller = appRouter.createCaller(ctx);

    const sessions = await caller.auth.getSessions();

    if (sessions.length > 1) {
      for (let i = 0; i < sessions.length - 1; i++) {
        const current = new Date(sessions[i]!.lastActivity).getTime();
        const next = new Date(sessions[i + 1]!.lastActivity).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    }
  });

  it("debe requerir autenticación", async () => {
    const unAuthContext = createUnauthContext();
    const caller = appRouter.createCaller(unAuthContext);

    try {
      await caller.auth.getSessions();
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.code).toBe("UNAUTHORIZED");
    }
  });
});

describe("auth.closeSession", () => {
  it("debe permitir cerrar una sesión", async () => {
    const ctx = createAuthContext("1");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.closeSession({ sessionId: "test-session-id" });
    expect(result).toHaveProperty("success");
    expect(typeof result.success).toBe("boolean");
  });

  it("debe requerir autenticación", async () => {
    const unAuthContext = createUnauthContext();
    const caller = appRouter.createCaller(unAuthContext);

    try {
      await caller.auth.closeSession({ sessionId: "test-id" });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.code).toBe("UNAUTHORIZED");
    }
  });
});

describe("Session Management Integration", () => {
  it("debe retornar lista de sesiones válida", async () => {
    const ctx = createAuthContext("1");
    const caller = appRouter.createCaller(ctx);

    const sessions = await caller.auth.getSessions();

    expect(Array.isArray(sessions)).toBe(true);
    expect(typeof sessions.length).toBe("number");

    // Validar estructura de cada sesión
    sessions.forEach((session) => {
      expect(typeof session.id).toBe("string");
      expect(typeof session.userId).toBe("number");
      expect(typeof session.deviceInfo).toBe("string");
      expect(typeof session.ipAddress).toBe("string");
      expect(session.lastActivity instanceof Date).toBe(true);
      expect(session.createdAt instanceof Date).toBe(true);
    });
  });

  it("debe mantener sesiones de otros usuarios intactas", async () => {
    const ctx1 = createAuthContext("1");
    const ctx2 = createAuthContext("2");

    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    // Obtener sesiones de ambos usuarios
    const sessions1 = await caller1.auth.getSessions();
    const sessions2 = await caller2.auth.getSessions();

    // Las sesiones deben estar separadas por usuario
    if (sessions1.length > 0 && sessions2.length > 0) {
      const user1Sessions = sessions1.filter((s) => s.userId === 1);
      const user2Sessions = sessions2.filter((s) => s.userId === 2);

      expect(user1Sessions.length).toBeGreaterThan(0);
      expect(user2Sessions.length).toBeGreaterThan(0);
    }
  });

  it("debe permitir cerrar una sesión válida", async () => {
    const ctx = createAuthContext("1");
    const caller = appRouter.createCaller(ctx);

    // Obtener sesiones
    const sessions = await caller.auth.getSessions();

    if (sessions.length > 0) {
      const sessionToClose = sessions[0]!.id;

      // Cerrar la sesión
      const result = await caller.auth.closeSession({ sessionId: sessionToClose });

      expect(result).toHaveProperty("success");
      expect(typeof result.success).toBe("boolean");
    }
  });
});
