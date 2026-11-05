-- Figuras das questoes (ECG, fotos, tabelas em imagem): URLs publicas do Storage.
ALTER TABLE "Questao" ADD COLUMN IF NOT EXISTS "imagens" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
