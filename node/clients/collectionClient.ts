import type { InstanceOptions, IOContext } from '@vtex/api'
import { ExternalClient } from '@vtex/api'

export default class CollectionClient extends ExternalClient {
  constructor(context: IOContext, options?: InstanceOptions) {
    super(
      `http://${context.account}.myvtex.com/api/catalog/pvt/collection`,
      context,
      {
        params: {
          Active: 'true',
          Visible: 'true',
        },
        ...options,
        headers: {
          ...options?.headers,
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json',
          'X-Vtex-Use-Https': 'true',
          VtexIdclientAutcookie: context.authToken ?? '',
        },
      }
    )
  }

  public getCollection(collection: string) {
    return this.http.get(`/${collection}/products`)
  }
}
