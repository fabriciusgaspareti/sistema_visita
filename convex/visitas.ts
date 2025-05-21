import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listarConsultores = query({
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const criarConsultor = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autorizado");

    return await ctx.db.insert("users", args);
  },
});

export const listarAgencias = query({
  handler: async (ctx) => {
    return await ctx.db.query("agencias").collect();
  },
});

export const criarAgencia = mutation({
  args: {
    id: v.string(),
    nome: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autorizado");

    return await ctx.db.insert("agencias", args);
  },
});

export const criar = mutation({
  args: {
    dataVisita: v.string(),
    consultorId: v.id("users"),
    agenciaSolicitante: v.string(),
    empresaProspectada: v.string(),
    contatoEmpresa: v.string(),
    telefoneEmpresa: v.optional(v.string()),
    emailEmpresa: v.optional(v.string()),
    observacoes: v.optional(v.string()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autorizado");

    return await ctx.db.insert("visitas", args);
  },
});

export const editar = mutation({
  args: {
    id: v.id("visitas"),
    dataVisita: v.string(),
    consultorId: v.id("users"),
    agenciaSolicitante: v.string(),
    empresaProspectada: v.string(),
    contatoEmpresa: v.string(),
    telefoneEmpresa: v.optional(v.string()),
    emailEmpresa: v.optional(v.string()),
    observacoes: v.optional(v.string()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autorizado");
    
    const { id, ...data } = args;
    return await ctx.db.replace(id, data);
  },
});

export const excluir = mutation({
  args: {
    id: v.id("visitas"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autorizado");
    
    await ctx.db.delete(args.id);
  },
});

export const listar = query({
  handler: async (ctx) => {
    const visitas = await ctx.db
      .query("visitas")
      .withIndex("by_data")
      .order("desc")
      .collect();

    return Promise.all(
      visitas.map(async (visita) => {
        const consultor = await ctx.db.get(visita.consultorId);
        return {
          ...visita,
          consultorNome: consultor?.name ?? "Desconhecido",
        };
      })
    );
  },
});

export const estatisticas = query({
  args: {
    ano: v.string(),
    mes: v.string(),
  },
  handler: async (ctx, args) => {
    // Buscar TODAS as visitas
    const todasVisitas = await ctx.db
      .query("visitas")
      .collect();
    
    console.log(`Buscando estatísticas para mês=${args.mes}, ano=${args.ano}`);
    console.log("Todas as visitas encontradas:", todasVisitas.length);
    
    // Inicializar contadores zerados
    let negociacao = 0;
    let andamento = 0;
    let negado = 0;
    let fechado = 0;
    let jaCliente = 0;
    
    // Processar cada visita
    for (const visita of todasVisitas) {
      console.log(`\nAnalisando visita: ID=${visita._id}, Data=${visita.dataVisita}, Status=${visita.status}`);
      
      if (!visita.status) {
        console.log("  → Visita sem status, ignorando");
        continue;
      }
      
      // Verificar o status primeiro (independente da data)
      const status = visita.status.toLowerCase().trim();
      
      // Verificar se a data existe e corresponde ao mês/ano selecionado
      let correspondeAoPeriodo = false;
      
      if (visita.dataVisita) {
        // Converter a data para o formato que queremos analisar
        let dataFormatada = visita.dataVisita;
        
        // Se a data contém barras (15/05/2025), converter para traços
        if (dataFormatada.includes('/')) {
          const partes = dataFormatada.split('/');
          if (partes.length === 3) {
            dataFormatada = `${partes[2]}-${partes[1]}-${partes[0]}`;
          }
        }
        
        console.log(`  → Data formatada: ${dataFormatada}`);
        
        // Verificar se a data começa com o ano e mês selecionados
        const anoMesSelecionado = `${args.ano}-${args.mes.padStart(2, '0')}`;
        correspondeAoPeriodo = dataFormatada.startsWith(anoMesSelecionado) || 
                              dataFormatada.endsWith(`/${args.mes}/${args.ano}`);
        
        console.log(`  → Verificando se corresponde ao período ${anoMesSelecionado}: ${correspondeAoPeriodo}`);
      }
      
      // Se a visita corresponde ao período selecionado, contar no status apropriado
      if (correspondeAoPeriodo) {
        console.log(`  → Visita corresponde ao período! Status: "${status}"`);
        
        if (status.includes("fechado")) {
          fechado++;
          console.log(`  → Contabilizado como "fechado"`);
        }
        else if (status.includes("negociacao") || status.includes("negociação")) {
          negociacao++;
          console.log(`  → Contabilizado como "negociacao"`);
        } 
        else if (status.includes("andamento")) {
          andamento++;
          console.log(`  → Contabilizado como "andamento"`);
        } 
        else if (status.includes("negado")) {
          negado++;
          console.log(`  → Contabilizado como "negado"`);
        } 
        else if (status.includes("cliente")) {
          jaCliente++;
          console.log(`  → Contabilizado como "jaCliente"`);
        } else {
          console.log(`  → NÃO CONTABILIZADO! Status não reconhecido: "${status}"`);
        }
      } else {
        console.log(`  → Visita NÃO corresponde ao período selecionado, ignorando`);
      }
    }
    
    const resultado = {
      negociacao,
      andamento,
      negado,
      fechado,
      jaCliente
    };
    
    console.log(`\nEstatísticas calculadas (${args.mes}/${args.ano}):`, resultado);
    
    return resultado;
  },
});

export const excluirConsultor = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    // Verificar se o consultor está sendo usado em alguma visita
    const visitasDoConsultor = await ctx.db
      .query("visitas")
      .filter((q) => q.eq(q.field("consultorId"), args.id))
      .collect();

    // Buscar outro consultor para substituir (se houver)
    const outrosConsultores = await ctx.db
      .query("users")
      .filter((q) => q.neq(q.field("_id"), args.id))
      .take(1);
    
    // Usar undefined em vez de null quando não houver substituto
    const consultorSubstituto = outrosConsultores.length > 0 ? outrosConsultores[0]._id : undefined;
    
    if (visitasDoConsultor.length > 0 && !consultorSubstituto) {
      throw new Error("Não é possível excluir o último consultor do sistema. Crie outro consultor antes de excluir este.");
    }

    // Desvincular o consultor de todas as visitas associadas
    for (const visita of visitasDoConsultor) {
      // Atribuir a outro consultor em vez de deixar vazio
      await ctx.db.patch(visita._id, { consultorId: consultorSubstituto });
    }

    // Excluir o consultor
    await ctx.db.delete(args.id);
    return { 
      success: true,
      visitasAtualizadas: visitasDoConsultor.length 
    };
  },
});

export const excluirAgencia = mutation({
  args: { id: v.id("agencias") },
  handler: async (ctx, args) => {
    // Verificar se a agência está sendo usada em alguma visita
    const agencia = await ctx.db.get(args.id);
    if (!agencia) {
      throw new Error("Agência não encontrada.");
    }

    const visitasDaAgencia = await ctx.db
      .query("visitas")
      .filter((q) => q.eq(q.field("agenciaSolicitante"), agencia.id))
      .collect();

    // Desvincular a agência de todas as visitas associadas
    for (const visita of visitasDaAgencia) {
      await ctx.db.patch(visita._id, { agenciaSolicitante: "" });
    }

    // Excluir a agência
    await ctx.db.delete(args.id);
    return { 
      success: true,
      visitasAtualizadas: visitasDaAgencia.length 
    };
  },
});