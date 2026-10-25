import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  ChartLine,
  Compass,
  CreditCard,
  Gauge,
  GraduationCap,
  Layers,
  LifeBuoy,
  MessageSquare,
  NotebookPen,
  Repeat2,
  Target,
  Users,
  type LucideIcon,
} from 'lucide-react'

export type ItemNav = { href: string; icon: LucideIcon; label: string; principal: boolean }

/**
 * Grupo da sidebar. `label: null` desenha o item solto, sem título de seção
 * (usado para "Início" e para áreas que ainda têm só um item).
 */
export type GrupoNav = {
  id: string
  label: string | null
  itens: readonly ItemNav[]
}

/**
 * Sidebar organizada em grupos no estilo cursinho premium: Início, Método,
 * Execução, Agenda, Mentor, Conta. Alguns grupos têm um item só por enquanto;
 * o layout já suporta o crescimento das ondas 2–4 (dashboards de Foco,
 * vídeo-aulas em Execução, comunidade/suporte, etc).
 */
export const GRUPOS_NAV: readonly GrupoNav[] = [
  {
    id: 'inicio',
    label: null,
    itens: [{ href: '/dashboard', icon: ChartLine, label: 'Painel', principal: true }],
  },
  {
    id: 'metodo',
    label: 'Método',
    itens: [{ href: '/plano', icon: Compass, label: 'Plano', principal: false }],
  },
  {
    id: 'foco',
    label: 'Foco',
    itens: [
      { href: '/foco/indicadores', icon: Gauge, label: 'Indicadores', principal: false },
      { href: '/foco/desempenho', icon: BarChart3, label: 'Desempenho', principal: false },
    ],
  },
  {
    id: 'execucao',
    label: 'Execução',
    itens: [
      { href: '/questoes', icon: BookOpen, label: 'Questões', principal: true },
      { href: '/flashcards', icon: Layers, label: 'Flashcards', principal: true },
      { href: '/revisao', icon: Repeat2, label: 'Revisão', principal: true },
      { href: '/simulado', icon: Target, label: 'Simulado', principal: false },
      { href: '/cursos', icon: GraduationCap, label: 'Cursos', principal: false },
      { href: '/caderno', icon: NotebookPen, label: 'Caderno de erros', principal: false },
    ],
  },
  {
    id: 'agenda',
    label: 'Agenda',
    itens: [{ href: '/provas', icon: CalendarCheck, label: 'Minhas provas', principal: false }],
  },
  {
    id: 'ambiente',
    label: 'Ambiente',
    itens: [
      { href: '/comunidade', icon: Users, label: 'Comunidade', principal: false },
      { href: '/suporte', icon: LifeBuoy, label: 'Suporte', principal: false },
    ],
  },
  {
    id: 'conta',
    label: 'Conta',
    itens: [
      { href: '/mentor', icon: MessageSquare, label: 'Mentor', principal: false },
      { href: '/conta', icon: CreditCard, label: 'Conta', principal: false },
    ],
  },
]

/** Lista flat para a NavMobile (que não exibe grupos). `principal` = aparece
 *  na barra inferior do celular; o resto fica em "Mais". */
export const NAV: readonly ItemNav[] = GRUPOS_NAV.flatMap((g) => g.itens)

export function itemAtivo(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}
