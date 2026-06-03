# Mobile (Expo)

App React Native compartilhando API com o web.

## Stack

- **Expo SDK 52** (React Native 0.76, New Architecture)
- **Expo Router 4** com tabs e stacks aninhados
- **Supabase Auth** (`@supabase/supabase-js`) com `expo-secure-store` para persistência de sessão
- **tRPC v11** apontando para o mesmo `apps/web` API (resolvido via `EXPO_PUBLIC_API_URL` ou IP do debugger). Mobile envia `Authorization: Bearer <supabase_jwt>`
- **AsyncStorage** para fila offline de respostas
- **expo-notifications** para push diario + lembrete de revisao

## Telas

| Rota                    | Funcao                                           |
| ----------------------- | ------------------------------------------------ |
| `/(auth)/sign-in`       | Login com email/senha (Supabase)                 |
| `/(auth)/sign-up`       | Cadastro + (opcional) confirmacao por email      |
| `/(app)/index`          | Home com KPIs, streak, alerta de revisao vencida |
| `/(app)/questoes`       | Lista do banco com filtros                       |
| `/(app)/questoes/[id]`  | Responder questao + correcao + offline queue     |
| `/(app)/simulado/index` | Configurar simulado                              |
| `/(app)/simulado/[id]`  | Executar simulado cronometrado                   |
| `/(app)/revisao`        | Items SM-2 vencidos hoje                         |
| `/(app)/conta`          | Plano, uso, sincronizar fila offline, sair       |

## Sync offline

Quando a `mutation` de responder falhar (sem internet, p.ex.), a resposta vai para fila local em
AsyncStorage. Em `/(app)/conta` ha botao "Sincronizar agora" que processa a fila — server-wins:
4xx descarta local, 5xx mantem para retentar.

## Setup

```bash
# Em ~/Developer/residencia-med
pnpm install

# Em apps/mobile
cd apps/mobile
cp ../../.env.example .env  # ajustar EXPO_PUBLIC_*
pnpm dev                     # inicia Metro

# iOS / Android
pnpm ios       # requer Xcode + simulador
pnpm android   # requer Android SDK
```

A API web precisa estar rodando em paralelo:

```bash
pnpm --filter @residencia-med/web dev
```

Quando rodando em dispositivo fisico, defina `EXPO_PUBLIC_API_URL` apontando para o IP da
sua maquina dev (`http://192.168.x.y:3000`), pois `localhost` nao e acessivel pelo dispositivo.

## Build de producao

```bash
pnpm --filter @residencia-med/mobile build:ios
pnpm --filter @residencia-med/mobile build:android
```

EAS Build faz o resto (precisa configurar `eas.json` e fazer login no EAS).
