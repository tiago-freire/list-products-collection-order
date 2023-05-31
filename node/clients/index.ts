import { IOClients } from '@vtex/api'

import CollectionClient from './collectionClient'
import StylesGraphqlClient from './stylesGraphQLClient'

export class Clients extends IOClients {
  public get collection() {
    return this.getOrSet('collection', CollectionClient)
  }

  public get stylesGraphql() {
    return this.getOrSet('stylesGraphql', StylesGraphqlClient)
  }
}
