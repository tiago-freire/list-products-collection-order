import { IOClients } from '@vtex/api'

import CollectionClient from './collectionClient'

export class Clients extends IOClients {
  public get collection() {
    return this.getOrSet('collection', CollectionClient)
  }
}
