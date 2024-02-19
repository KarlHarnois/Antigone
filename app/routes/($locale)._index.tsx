import {defer, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Await, useLoaderData, Link, type MetaFunction} from '@remix-run/react';
import {Suspense} from 'react';
import {Image, Money} from '@shopify/hydrogen';
import type {
  CatalogQuery,
  CatalogProductFragment,
} from 'storefrontapi.generated';

export const meta: MetaFunction = () => {
  return [{title: 'Antigone | Home'}];
};

export async function loader({context}: LoaderFunctionArgs) {
  const {storefront} = context;
  const products = storefront.query(CATALOG_QUERY);

  return defer({products});
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="home">
      <Catalog products={data.products} />
    </div>
  );
}

function Catalog({products}: {products: Promise<CatalogQuery>}) {
  return (
    <div className="catalog-products">
      <Suspense fallback={<div>Loading...</div>}>
        <Await resolve={products}>
          {({products}) => (
            <div className="catalog-products-grid">
              {products.nodes.map((product) => (
                <CatalogProduct key={product.id} product={product} />
              ))}
            </div>
          )}
        </Await>
      </Suspense>
      <br />
    </div>
  );
}

function CatalogProduct({product}: {product: CatalogProductFragment}) {
  return (
    <Link className="catalog-product" to={`/products/${product.handle}`}>
      <Image
        data={product.images.nodes[0]}
        aspectRatio="1/1"
        sizes="(min-width: 45em) 20vw, 50vw"
      />
      <h4>{product.title}</h4>
      <small>
        <Money data={product.priceRange.minVariantPrice} />
      </small>
    </Link>
  );
}

const CATALOG_QUERY = `#graphql
  fragment CatalogProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    images(first: 1) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
  }

  query Catalog ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 20, sortKey: TITLE) {
      nodes {
        ...CatalogProduct
      }
    }
  }
` as const;
