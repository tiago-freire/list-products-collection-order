/* eslint-disable react/react-in-jsx-scope */
/* eslint-disable vtex/prefer-early-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ComponentType, PropsWithChildren } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useQuery } from 'react-apollo'
import { usePixel } from 'vtex.pixel-manager'
import { ProductSummaryListWithoutQuery } from 'vtex.product-summary'
import type { QueryProductsTypes } from 'vtex.store-resources'
import { QueryProducts } from 'vtex.store-resources'

import Skeleton from '../Skeleton/Skeleton'

type PreferenceType =
  | 'FIRST_AVAILABLE'
  | 'LAST_AVAILABLE'
  | 'PRICE_ASC'
  | 'PRICE_DESC'

const ORDER_BY_OPTIONS = {
  RELEVANCE: {
    name: 'admin/editor.productSummaryList.orderType.relevance',
    value: '',
  },
  COLLECTION: {
    name: 'admin/editor.productSummaryList.orderType.collection',
    value: 'OrderByCollection',
  },
  TOP_SALE_DESC: {
    name: 'admin/editor.productSummaryList.orderType.sales',
    value: 'OrderByTopSaleDESC',
  },
  PRICE_DESC: {
    name: 'admin/editor.productSummaryList.orderType.priceDesc',
    value: 'OrderByPriceDESC',
  },
  PRICE_ASC: {
    name: 'admin/editor.productSummaryList.orderType.priceAsc',
    value: 'OrderByPriceASC',
  },
  NAME_ASC: {
    name: 'admin/editor.productSummaryList.orderType.nameAsc',
    value: 'OrderByNameASC',
  },
  NAME_DESC: {
    name: 'admin/editor.productSummaryList.orderType.nameDesc',
    value: 'OrderByNameDESC',
  },
  RELEASE_DATE_DESC: {
    name: 'admin/editor.productSummaryList.orderType.releaseDate',
    value: 'OrderByReleaseDateDESC',
  },
  BEST_DISCOUNT_DESC: {
    name: 'admin/editor.productSummaryList.orderType.discount',
    value: 'OrderByBestDiscountDESC',
  },
}

const parseFilters = ({ id, value }: { id: string; value: string }) =>
  `specificationFilter_${id}:${value}`

function getOrdinationProp(attribute: 'name' | 'value') {
  return Object.keys(ORDER_BY_OPTIONS).map(
    key => ORDER_BY_OPTIONS[key as keyof typeof ORDER_BY_OPTIONS][attribute]
  )
}

export interface ProductClickParams {
  position: number
}

interface SpecificationFilter {
  id: string
  value: string
}

interface Props {
  /** Category ID of the listed items. For sub-categories, use "/" (e.g. "1/2/3") */
  category?: string
  /** Specification Filters of the listed items. */
  specificationFilters?: SpecificationFilter[]
  /** Filter by collection. */
  collection?: string
  /**
   * Ordination type of the items. Possible values: `''`, `OrderByCollection`, `OrderByTopSaleDESC`, `OrderByReleaseDateDESC`, `OrderByBestDiscountDESC`, `OrderByPriceDESC`, `OrderByPriceASC`, `OrderByNameASC`, `OrderByNameDESC`
   * @default ""
   */
  orderBy?:
    | ''
    | 'OrderByCollection'
    | 'OrderByTopSaleDESC'
    | 'OrderByPriceDESC'
    | 'OrderByPriceASC'
    | 'OrderByNameASC'
    | 'OrderByNameDESC'
    | 'OrderByReleaseDateDESC'
    | 'OrderByBestDiscountDESC'
  /** Hides items that are unavailable. */
  hideUnavailableItems?: boolean
  /**
   * Maximum items to be fetched.
   * @default 10
   */
  maxItems?: number
  /**
   * Control SKUs returned for each product in the query. The less SKUs needed to be returned, the more performant your shelf query will be.
   * @default "ALL_AVAILABLE"
   */
  skusFilter?: 'ALL_AVAILABLE' | 'ALL' | 'FIRST_AVAILABLE'
  /**
   * Control what price to be shown when price has different installments options.
   * @default "MAX_WITHOUT_INTEREST"
   */
  installmentCriteria?: 'MAX_WITHOUT_INTEREST' | 'MAX_WITH_INTEREST'
  /**
   * Name of the list property on Google Analytics events.
   */
  listName?: string
  /**
   * Logic to enable which SKU will be the selected item
   * */
  preferredSKU?: PreferenceType
  /** Slot of a product summary. */
  ProductSummary: ComponentType<{ product: any; actionOnClick: any }>
  /** Callback on product click. */
  actionOnProductClick?: (product: any) => void
}

const ListProductsCollectionOrder = (props: PropsWithChildren<Props>) => {
  const {
    category = '',
    collection,
    hideUnavailableItems = false,
    orderBy = ORDER_BY_OPTIONS.RELEVANCE.value,
    specificationFilters = [],
    maxItems = 10,
    skusFilter,
    installmentCriteria,
    children,
    listName: rawListName,
    ProductSummary,
    actionOnProductClick,
    preferredSKU,
  } = props

  const { push } = usePixel()

  const { data, loading, error } = useQuery<
    QueryProductsTypes.Data,
    QueryProductsTypes.Variables
  >(QueryProducts, {
    variables: {
      category,
      ...(collection != null
        ? {
            collection,
          }
        : {}),
      specificationFilters: specificationFilters.map(parseFilters),
      orderBy:
        orderBy === ORDER_BY_OPTIONS.COLLECTION.value
          ? ORDER_BY_OPTIONS.RELEVANCE.value
          : orderBy,
      from: 0,
      to: maxItems - 1,
      hideUnavailableItems,
      skusFilter,
      installmentCriteria,
    },
  })

  const { products } = data ?? {}
  const [reorderedProducts, setReorderedProducts] = useState<
    typeof products | undefined
  >(products)

  const [loadingRest, setLoadingRest] = useState(true)

  // Not using ?? operator because listName can be ''
  // eslint-disable-next-line no-unneeded-ternary
  const listName = rawListName ? rawListName : 'List of products'

  const productClick = useCallback(
    (product: any, productClickParams?: ProductClickParams) => {
      actionOnProductClick?.(product)

      const { position } = productClickParams ?? {}

      push({
        event: 'productClick',
        list: listName,
        product,
        position,
      })
    },
    [push, actionOnProductClick, listName]
  )

  useEffect(() => {
    if (orderBy === ORDER_BY_OPTIONS.COLLECTION.value) {
      fetch(`/_v/collection/${collection}`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
      })
        .then(res => res.json())
        .then(json => {
          if (products?.length && products?.length === json?.Data?.length) {
            const newReorderedProducts: typeof products = []

            json?.Data.forEach((p, index: number) => {
              products.forEach(product => {
                if (+(product.productId as string) === p.ProductId) {
                  newReorderedProducts[index] = product
                }
              })
            })
            setReorderedProducts(newReorderedProducts)
          }
        })
        .catch(e => {
          console.error(
            'Showing default order because of an error retrieving collection:',
            e
          )
          setReorderedProducts(products)
        })
        .finally(() => setLoadingRest(false))
    } else {
      setReorderedProducts(products)
      setLoadingRest(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderBy, collection, products])

  if (loading || loadingRest) {
    return <Skeleton height={400} />
  }

  if (error) {
    return 'Erro ao recuperar coleção'
  }

  return (
    <ProductSummaryListWithoutQuery
      products={reorderedProducts}
      listName={listName}
      ProductSummary={ProductSummary}
      actionOnProductClick={productClick}
      preferredSKU={preferredSKU}
    >
      {children}
    </ProductSummaryListWithoutQuery>
  )
}

ListProductsCollectionOrder.schema = {
  title: 'admin/editor.productSummaryList.title',
  description: 'admin/editor.productSummaryList.description',
  type: 'object',
  properties: {
    category: {
      title: 'admin/editor.productSummaryList.category.title',
      description: 'admin/editor.productSummaryList.category.description',
      type: 'string',
      isLayout: false,
    },
    specificationFilters: {
      title: 'admin/editor.productSummaryList.specificationFilters.title',
      type: 'array',
      items: {
        title:
          'admin/editor.productSummaryList.specificationFilters.item.title',
        type: 'object',
        properties: {
          id: {
            type: 'string',
            title:
              'admin/editor.productSummaryList.specificationFilters.item.id.title',
          },
          value: {
            type: 'string',
            title:
              'admin/editor.productSummaryList.specificationFilters.item.value.title',
          },
        },
      },
    },
    collection: {
      title: 'admin/editor.productSummaryList.collection.title',
      type: 'string',
      isLayout: false,
    },
    orderBy: {
      title: 'admin/editor.productSummaryList.orderBy.title',
      type: 'string',
      enum: getOrdinationProp('value'),
      enumNames: getOrdinationProp('name'),
      default: ORDER_BY_OPTIONS.RELEVANCE.value,
      isLayout: false,
    },
    hideUnavailableItems: {
      title: 'admin/editor.productSummaryList.hideUnavailableItems',
      type: 'boolean',

      default: false,
      isLayout: false,
    },
    maxItems: {
      title: 'admin/editor.productSummaryList.maxItems.title',
      type: 'number',
      isLayout: false,
      default: 10,
    },
    skusFilter: {
      title: 'admin/editor.productSummaryList.skusFilter.title',
      description: 'admin/editor.productSummaryList.skusFilter.description',
      type: 'string',
      default: 'ALL_AVAILABLE',
      enum: ['ALL_AVAILABLE', 'ALL', 'FIRST_AVAILABLE'],
      enumNames: [
        'admin/editor.productSummaryList.skusFilter.all-available',
        'admin/editor.productSummaryList.skusFilter.none',
        'admin/editor.productSummaryList.skusFilter.first-available',
      ],
    },
    installmentCriteria: {
      title: 'admin/editor.productSummaryList.installmentCriteria.title',
      description:
        'admin/editor.productSummaryList.installmentCriteria.description',
      type: 'string',
      default: 'MAX_WITHOUT_INTEREST',
      enum: ['MAX_WITHOUT_INTEREST', 'MAX_WITH_INTEREST'],
      enumNames: [
        'admin/editor.productSummaryList.installmentCriteria.max-without-interest',
        'admin/editor.productSummaryList.installmentCriteria.max-with-interest',
      ],
    },
    listName: {
      title: 'admin/editor.productSummaryList.analyticsListName.title',
      type: 'string',
    },
  },
}

export default ListProductsCollectionOrder
