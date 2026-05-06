import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'
import { falarQuestao, pararFala } from '@/lib/speech'
import { cores, espacamento, fontes, radii } from '@/lib/theme'

type Props = {
  vignette?: string | null
  enunciado: string
  alternativas?: Array<{ letra: string; texto: string }>
}

export function BotaoOuvir({ vignette, enunciado, alternativas }: Props) {
  const [tocando, setTocando] = useState(false)

  useEffect(() => {
    return () => {
      pararFala()
    }
  }, [])

  const onPress = async () => {
    if (tocando) {
      pararFala()
      setTocando(false)
      return
    }
    setTocando(true)
    await falarQuestao(
      { vignette, enunciado, alternativas, velocidade: 1.0 },
      {
        onDone: () => setTocando(false),
        onStopped: () => setTocando(false),
        onError: () => setTocando(false),
      },
    )
  }

  return (
    <Pressable
      onPress={onPress}
      style={[styles.botao, tocando && styles.tocando]}
      accessibilityLabel={tocando ? 'Parar leitura' : 'Ouvir questão'}
    >
      <Text style={[styles.texto, tocando && styles.textoTocando]}>
        {tocando ? '⏸ Parar' : '▶ Ouvir'}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  botao: {
    paddingHorizontal: espacamento.sm + 4,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: cores.primary,
    backgroundColor: 'transparent',
  },
  tocando: {
    backgroundColor: cores.primary,
  },
  texto: {
    fontSize: fontes.size.sm,
    fontWeight: fontes.weight.medium,
    color: cores.primary,
  },
  textoTocando: {
    color: '#fff',
  },
})
