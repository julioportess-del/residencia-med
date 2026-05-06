import type { PrismaClient } from '@prisma/client'

const BANCAS = [
  { codigo: 'AMRIGS', nome: 'AMRIGS', estado: 'RS', cor: '#0E7490', prioridade: 100 },
  { codigo: 'ENARE', nome: 'ENARE - Exame Nacional de Residencia', estado: null, cor: '#1E40AF', prioridade: 95 },
  { codigo: 'PSU-MG', nome: 'PSU Minas Gerais', estado: 'MG', cor: '#7C3AED', prioridade: 90 },
  { codigo: 'IPSEMG', nome: 'IPSEMG', estado: 'MG', cor: '#A21CAF', prioridade: 85 },
  { codigo: 'USP', nome: 'USP - Hospital das Clinicas', estado: 'SP', cor: '#1D4ED8', prioridade: 95 },
  { codigo: 'SUS-SP', nome: 'SUS-SP', estado: 'SP', cor: '#0891B2', prioridade: 90 },
  { codigo: 'SES-SC', nome: 'SES Santa Catarina', estado: 'SC', cor: '#16A34A', prioridade: 80 },
  { codigo: 'BH', nome: 'Belo Horizonte', estado: 'MG', cor: '#DC2626', prioridade: 80 },
  { codigo: 'UNIFESP', nome: 'UNIFESP', estado: 'SP', cor: '#0F766E', prioridade: 85 },
  { codigo: 'UNICAMP', nome: 'UNICAMP', estado: 'SP', cor: '#B45309', prioridade: 85 },
  { codigo: 'UFRJ', nome: 'UFRJ', estado: 'RJ', cor: '#1E3A8A', prioridade: 85 },
  { codigo: 'HCPA', nome: 'HCPA - Hospital de Clinicas POA', estado: 'RS', cor: '#15803D', prioridade: 80 },
  { codigo: 'UFPR', nome: 'UFPR', estado: 'PR', cor: '#B91C1C', prioridade: 75 },
  { codigo: 'FMRP-USP', nome: 'FMRP USP Ribeirao Preto', estado: 'SP', cor: '#0369A1', prioridade: 80 },
] as const

export async function seedBancas(prisma: PrismaClient) {
  for (const b of BANCAS) {
    await prisma.banca.upsert({
      where: { codigo: b.codigo },
      create: b,
      update: { nome: b.nome, estado: b.estado, cor: b.cor, prioridade: b.prioridade },
    })
  }
}
