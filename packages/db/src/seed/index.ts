/* eslint-disable no-console */
import { prisma } from '../client'
import { seedBancas } from './bancas'
import { seedEspecialidadesETemas } from './especialidades'
import { seedGuidelines } from './guidelines'
import { seedQuestoes } from './questoes'

async function main() {
  console.log('Seeding bancas...')
  await seedBancas(prisma)

  console.log('Seeding especialidades + temas...')
  await seedEspecialidadesETemas(prisma)

  console.log('Seeding guidelines...')
  await seedGuidelines(prisma)

  console.log('Seeding questoes...')
  await seedQuestoes(prisma)

  console.log('Seed completo')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
