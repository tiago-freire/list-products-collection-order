import type { ServiceContext } from '@vtex/api'
import { UserInputError } from '@vtex/api'

import type { Clients } from '../clients'

const getCollectionById = async (context: ServiceContext<Clients>) => {
  const {
    vtex: {
      route: {
        params: { collection },
      },
    },
  } = context

  if (!collection) {
    throw new UserInputError('collection is required')
  }

  const response = await context.clients.collection.getCollection(
    String(collection)
  )

  context.set('Access-Control-Allow-Origin', '*')
  context.set('Access-Control-Allow-Headers', '*')
  context.set('Access-Control-Allow-Credentials', 'true')
  context.set('Access-Control-Allow-Methods', '*')
  context.set('Content-Type', 'application/json')
  context.set('Cache-Control', 'max-age=86400')

  context.status = 200
  context.body = response
}

export default getCollectionById
