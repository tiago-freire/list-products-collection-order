import type { ClientsConfig, ServiceContext } from '@vtex/api'
import { LRUCache, method, Service, UserInputError } from '@vtex/api'
import type { Colors } from 'vtex.styles-graphql'

import { Clients } from './clients'

const TIMEOUT_MS = 800
const memoryCache = new LRUCache<string, never>({ max: 5000 })

const clients: ClientsConfig<Clients> = {
  implementation: Clients,
  options: {
    default: {
      retries: 2,
      timeout: TIMEOUT_MS,
    },
    status: {
      memoryCache,
    },
  },
}

// type PossibleColors =
//   | BackgroundColors
//   | HoverBackgroundColors
//   | ActiveBackgroundColors
//   | TextColors
//   | VisitedTextColors
//   | HoverTextColors
//   | ActiveTextColors
//   | BorderColors
//   | HoverBorderColors
//   | ActiveBorderColors
//   | OnColors
//   | HoverOnColors
//   | ActiveOnColors
export default new Service({
  clients,
  routes: {
    collection: method({
      GET: async (context: ServiceContext<Clients>) => {
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
          collection as string
        )

        context.body = response

        context.status = 200
        context.set('Cache-Control', 'no-cache')
      },
    }),
    teste: method({
      GET: async (context: ServiceContext<Clients>) => {
        const {
          clients: { stylesGraphql },
        } = context

        const styles = (await stylesGraphql.getStyles()) ?? {}

        const cssVariables = Object.keys(styles)
          .map(
            majorKey =>
              // styles[majorKey as keyof Colors]?.map(
              //   minorKey =>
              //     `--${majorKey}-${minorKey}: ${
              //       styles[majorKey as keyof Colors]
              //         ? styles[majorKey as keyof Colors]
              //           ? [minorKey as keyof PossibleColors]
              //           : ''
              //         : ''
              //     };`
              // )

              `--${majorKey}-: ${JSON.stringify(
                styles[majorKey as keyof Colors]
              )}`
          )
          .join('\n')

        context.body = cssVariables
        context.status = 200
        context.set('Content-Type', 'application/json')
        context.set('Cache-Control', 'no-cache')
      },
    }),
  },
})
