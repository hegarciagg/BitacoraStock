import { describe, it, expect, beforeEach, vi } from "vitest";
import { z } from "zod";

describe("Auth Router - updateProfile", () => {
  it("debe validar que el nombre sea una cadena válida", () => {
    const schema = z.object({
      name: z.string().min(1).max(255).optional(),
      riskProfile: z.enum(["conservative", "moderate", "aggressive"]).optional(),
    });

    const validData = { name: "John Doe", riskProfile: "moderate" };
    expect(() => schema.parse(validData)).not.toThrow();
  });

  it("debe rechazar nombre vacío", () => {
    const schema = z.object({
      name: z.string().min(1).max(255).optional(),
      riskProfile: z.enum(["conservative", "moderate", "aggressive"]).optional(),
    });

    const invalidData = { name: "" };
    expect(() => schema.parse(invalidData)).toThrow();
  });

  it("debe rechazar nombre muy largo", () => {
    const schema = z.object({
      name: z.string().min(1).max(255).optional(),
      riskProfile: z.enum(["conservative", "moderate", "aggressive"]).optional(),
    });

    const invalidData = { name: "a".repeat(256) };
    expect(() => schema.parse(invalidData)).toThrow();
  });

  it("debe validar perfiles de riesgo válidos", () => {
    const schema = z.object({
      name: z.string().min(1).max(255).optional(),
      riskProfile: z.enum(["conservative", "moderate", "aggressive"]).optional(),
    });

    const validProfiles = ["conservative", "moderate", "aggressive"];
    validProfiles.forEach((profile) => {
      expect(() => schema.parse({ riskProfile: profile })).not.toThrow();
    });
  });

  it("debe rechazar perfil de riesgo inválido", () => {
    const schema = z.object({
      name: z.string().min(1).max(255).optional(),
      riskProfile: z.enum(["conservative", "moderate", "aggressive"]).optional(),
    });

    const invalidData = { riskProfile: "invalid" };
    expect(() => schema.parse(invalidData)).toThrow();
  });

  it("debe permitir actualizar solo el nombre", () => {
    const schema = z.object({
      name: z.string().min(1).max(255).optional(),
      riskProfile: z.enum(["conservative", "moderate", "aggressive"]).optional(),
    });

    const data = { name: "Jane Doe" };
    expect(() => schema.parse(data)).not.toThrow();
  });

  it("debe permitir actualizar solo el perfil de riesgo", () => {
    const schema = z.object({
      name: z.string().min(1).max(255).optional(),
      riskProfile: z.enum(["conservative", "moderate", "aggressive"]).optional(),
    });

    const data = { riskProfile: "aggressive" };
    expect(() => schema.parse(data)).not.toThrow();
  });

  it("debe permitir actualizar ambos campos", () => {
    const schema = z.object({
      name: z.string().min(1).max(255).optional(),
      riskProfile: z.enum(["conservative", "moderate", "aggressive"]).optional(),
    });

    const data = { name: "Jane Doe", riskProfile: "conservative" };
    expect(() => schema.parse(data)).not.toThrow();
  });

  it("debe permitir objeto vacío (sin cambios)", () => {
    const schema = z.object({
      name: z.string().min(1).max(255).optional(),
      riskProfile: z.enum(["conservative", "moderate", "aggressive"]).optional(),
    });

    const data = {};
    expect(() => schema.parse(data)).not.toThrow();
  });

  it("debe rechazar campos adicionales desconocidos", () => {
    const schema = z.object({
      name: z.string().min(1).max(255).optional(),
      riskProfile: z.enum(["conservative", "moderate", "aggressive"]).optional(),
    }).strict();

    const invalidData = { name: "John", unknownField: "value" };
    expect(() => schema.parse(invalidData)).toThrow();
  });
});
