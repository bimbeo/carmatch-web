import { createClient } from '@sanity/client'

export const client = createClient({
  projectId: 'zwazjo4q',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2024-01-01',
})

// Queries
export const postsQuery = `*[_type == "post"] | order(publishedAt desc) {
  _id,
  title,
  slug,
  publishedAt,
  excerpt,
  "mainImageUrl": mainImage.asset->url,
  "categories": categories[]->title,
  author
}`

// Alias for backwards compatibility
export const sanityClient = client

export const postBySlugQuery = `*[_type == "post" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  publishedAt,
  excerpt,
  "mainImageUrl": mainImage.asset->url,
  "categories": categories[]->title,
  author,
  body,
  seoTitle,
  seoDescription
}`
