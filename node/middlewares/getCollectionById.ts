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

  // eslint-disable-next-line no-console
  console.log('collection at new middleware:', collection)

  const response = await context.clients.collection.getCollection(
    collection as string
  )

  context.body = response

  context.status = 200
  context.set('Cache-Control', 'no-cache')
}

export default getCollectionById
