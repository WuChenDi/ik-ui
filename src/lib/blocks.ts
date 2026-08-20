import { readFile } from 'fs/promises'
import { join } from 'path'
import { highlightCode } from './highlight-code'
import { getRegistry } from './registry'
import type { RegistryItem } from './types'

/** Block sources live here, one `<name>.tsx` per block. */
const BLOCKS_DIR = 'registry/ikui/blocks'

/** Ordered, labelled categories driving the `/blocks` gallery nav. */
export const blockCategories = [
  { slug: 'video', label: 'Video' },
  { slug: 'image', label: 'Image' },
  { slug: 'audio', label: 'Audio' },
] as const

export type BlockCategory = (typeof blockCategories)[number]['slug']

/**
 * Gallery display order — registry.json interleaves blocks with components, so
 * the sequence is pinned here instead. Video-heavy compositions lead, then
 * image, then audio; the plain compressor utility trails the media tools.
 * Unlisted blocks fall to the end in registry order.
 */
const BLOCK_ORDER = [
  'video-frame-extractor',
  'video-trimmer',
  'video-audio-extractor',
  'storyboard-timeline',
  'image-cropper',
  'image-editor',
  'audio-trimmer',
  'media-compressor',
]

export interface Block {
  name: string
  title: string
  description: string
  categories: string[]
  /** Preview iframe height in px. Falls back to the BlockViewer default. */
  iframeHeight?: number
}

/** A block plus its source and pre-highlighted markup, ready to render. */
export interface RenderedBlock extends Block {
  code: string
  highlightedCode: string
}

function toBlock(item: RegistryItem): Block {
  return {
    name: item.name,
    title: item.title,
    description: item.description,
    categories: item.categories ?? [],
    iframeHeight: item.meta?.iframeHeight,
  }
}

/** All `registry:block` items — the business compositions shown under `/blocks`. */
export async function getBlocks(): Promise<Block[]> {
  const { items } = await getRegistry()
  const blocks = items.filter((i) => i.type === 'registry:block').map(toBlock)
  const rank = (name: string) => {
    const i = BLOCK_ORDER.indexOf(name)
    return i === -1 ? BLOCK_ORDER.length : i
  }
  // Sort by pinned rank, falling back to the original registry index so
  // unlisted blocks keep registry order regardless of sort stability.
  return blocks
    .map((block, i) => ({ block, i }))
    .sort((a, b) => rank(a.block.name) - rank(b.block.name) || a.i - b.i)
    .map((entry) => entry.block)
}

/** Blocks tagged with the given category slug. */
export async function getBlocksByCategory(slug: string): Promise<Block[]> {
  const blocks = await getBlocks()
  return blocks.filter((b) => b.categories.includes(slug))
}

export async function getBlock(name: string): Promise<Block | undefined> {
  const blocks = await getBlocks()
  return blocks.find((b) => b.name === name)
}

/** Attach each block's source + highlighted markup for the gallery pages. */
export async function renderBlocks(blocks: Block[]): Promise<RenderedBlock[]> {
  return Promise.all(
    blocks.map(async (block) => {
      const code = await getBlockCode(block.name)
      return { ...block, code, highlightedCode: await highlightCode(code) }
    }),
  )
}

/**
 * The block's source — the exact text a user copies / installs. Scoped to a
 * literal subfolder so the bundler does not trace the whole project.
 */
export async function getBlockCode(name: string): Promise<string> {
  return readFile(join(process.cwd(), BLOCKS_DIR, `${name}.tsx`), 'utf-8')
}
