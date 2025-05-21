import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const applicationTables = {
  visitas: defineTable({
    dataVisita: v.string(),
    consultorId: v.id("users"),
    agenciaSolicitante: v.string(),
    empresaProspectada: v.string(),
    contatoEmpresa: v.string(),
    telefoneEmpresa: v.optional(v.string()),
    emailEmpresa: v.optional(v.string()),
    observacoes: v.optional(v.string()),
    status: v.string(),
  })
    .index("by_consultor", ["consultorId"])
    .index("by_data", ["dataVisita"])
    .index("by_status", ["status"]),

  agencias: defineTable({
    id: v.string(),
    nome: v.string(),
  }).index("by_codigo", ["id"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
