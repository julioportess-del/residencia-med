import {
  BookOpen,
  Calendar,
  ChartLine,
  Layers,
  CreditCard,
  MessageSquare,
  NotebookPen,
  Repeat2,
  Target,
  type LucideIcon,
} from 'lucide-react'

export type ItemNav = { href: string; icon: LucideIcon; label: string; principal: boolean }

/** `principal` = aparece na barra inferior do celular; o resto fica em "Mais". */
export const NAV: readonly ItemNav[] = [
  { href: '/dashboard', icon: ChartLine, label: 'Painel', principal: true },
  { href: '/questoes', icon: BookOpen, label: 'Questões', principal: true },
  { href: '/flashcards', icon: Layers, label: 'Flashcards', principal: true },
  { href: '/revisao', icon: Repeat2, label: 'Revisão', principal: true },
  { href: '/simulado', icon: Target, label: 'Simulado', principal: false },
  { href: '/caderno', icon: NotebookPen, label: 'Caderno de erros', principal: false },
  { href: '/plano', icon: Calendar, label: 'Plano', principal: false },
  { href: '/mentor', icon: MessageSquare, label: 'Mentor', principal: false },
  { href: '/conta', icon: CreditCard, label: 'Conta', principal: false },
]

export function itemAtivo(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}
