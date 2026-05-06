import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * OpenAPI 3.1 spec da API pública v1.
 * Estaticamente gerada — todas as rotas /api/v1/* devem estar documentadas aqui.
 */
const spec = {
  openapi: '3.1.0',
  info: {
    title: 'Residência Med — API B2B',
    version: '1.0.0',
    description:
      'API REST para integradores B2B. Autenticação via Bearer token (chave de API criada em /org/api). Rate limit: 100 req/min (STARTER) ou 1000 req/min (GROWTH).',
    contact: { email: 'api@residencia-med.com' },
  },
  servers: [{ url: 'https://residencia-med.vercel.app/api/v1' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'Chave de API com prefixo `rmed_`. Crie em /org/api.',
      },
    },
    schemas: {
      Erro: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['codigo', 'mensagem'],
            properties: {
              codigo: { type: 'string', example: 'unknown_key' },
              mensagem: { type: 'string', example: 'Chave desconhecida' },
            },
          },
        },
      },
      Organizacao: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          plano: { type: 'string', enum: ['STARTER', 'GROWTH', 'ENTERPRISE'] },
          seats: { type: 'integer' },
        },
      },
      Membro: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          nome: { type: 'string', nullable: true },
          papel: { type: 'string', enum: ['ADMIN', 'MEMBRO'] },
          criadoEm: { type: 'string', format: 'date-time' },
          totalRespostas: { type: 'integer' },
        },
      },
      Questao: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          ano: { type: 'integer' },
          enunciado: { type: 'string' },
          vignette: { type: 'string', nullable: true },
          gabaritoLetra: { type: 'string', enum: ['A', 'B', 'C', 'D', 'E'] },
          dificuldade: { type: 'string', enum: ['FACIL', 'MEDIO', 'DIFICIL', 'MUITO_DIFICIL'] },
          banca: {
            type: 'object',
            properties: {
              codigo: { type: 'string' },
              nome: { type: 'string' },
            },
          },
          tema: {
            type: 'object',
            nullable: true,
            properties: {
              codigo: { type: 'string' },
              nome: { type: 'string' },
            },
          },
          alternativas: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                letra: { type: 'string' },
                texto: { type: 'string' },
                correta: { type: 'boolean' },
              },
            },
          },
        },
      },
      Dashboard: {
        type: 'object',
        properties: {
          organizationId: { type: 'string' },
          janela: { type: 'string', example: '30d' },
          usuariosTotal: { type: 'integer' },
          ativos30d: { type: 'integer' },
          respostasMes: { type: 'integer' },
          taxaMedia: { type: 'number' },
          temasFracos: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                tema: { type: 'string' },
                total: { type: 'integer' },
                taxa: { type: 'number' },
              },
            },
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/me': {
      get: {
        summary: 'Informações da organização autenticada',
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    organizacao: { $ref: '#/components/schemas/Organizacao' },
                    scopes: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Chave inválida',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Erro' } } },
          },
        },
      },
    },
    '/membros': {
      get: {
        summary: 'Lista membros da organização',
        parameters: [
          { in: 'query', name: 'limit', schema: { type: 'integer', maximum: 200, default: 50 } },
          { in: 'query', name: 'cursor', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    itens: { type: 'array', items: { $ref: '#/components/schemas/Membro' } },
                    proxCursor: { type: 'string', nullable: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/questoes': {
      get: {
        summary: 'Lista questões publicadas',
        parameters: [
          { in: 'query', name: 'banca', schema: { type: 'string', example: 'AMRIGS' } },
          { in: 'query', name: 'ano', schema: { type: 'integer' } },
          {
            in: 'query',
            name: 'dificuldade',
            schema: { type: 'string', enum: ['FACIL', 'MEDIO', 'DIFICIL', 'MUITO_DIFICIL'] },
          },
          { in: 'query', name: 'limit', schema: { type: 'integer', maximum: 200, default: 50 } },
          { in: 'query', name: 'cursor', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    itens: { type: 'array', items: { $ref: '#/components/schemas/Questao' } },
                    proxCursor: { type: 'string', nullable: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/dashboard': {
      get: {
        summary: 'Agregado de atividade da organização nos últimos 30 dias',
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Dashboard' } },
            },
          },
        },
      },
    },
  },
}

export function GET() {
  return NextResponse.json(spec, {
    headers: {
      'Cache-Control': 'public, max-age=60',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
