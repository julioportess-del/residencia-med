/**
 * Layout HTML básico para todos os emails.
 * Email é teimoso — inline styles + tabela ainda é o formato seguro.
 */
export function envelope(conteudo: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f7fa;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.06);">
          <tr>
            <td style="padding:24px 32px 12px;border-bottom:1px solid #e2e8f0;">
              <div style="font-size:18px;font-weight:600;color:#1d4ed8;">Residência Med</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;line-height:1.55;font-size:15px;">
              ${conteudo}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">
              Esse email foi enviado pela plataforma Residência Med. Você está recebendo porque tem
              uma conta ativa. Para parar de receber, ajuste suas preferências em
              <a href="https://residencia-med.vercel.app/conta" style="color:#1d4ed8;">/conta</a>.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function botao(href: string, texto: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:18px 0;">
  <tr>
    <td style="border-radius:8px;background:#1d4ed8;">
      <a href="${href}" style="display:inline-block;padding:11px 24px;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;">
        ${texto}
      </a>
    </td>
  </tr>
</table>`
}
