import { once, showUI } from '@create-figma-plugin/utilities'

import { CloseHandler, PackPagesHandler, UnpackPagesHandler } from './types'

const TEMP_PAGE_NAME = '__TCC_TEMP__'

function isTempPage(page: PageNode): boolean {
  return page.name.trim() === TEMP_PAGE_NAME
}

function getOrCreateTempPage(): PageNode {
  const existingTempPage = figma.root.children.find((page) => isTempPage(page))
  if (existingTempPage !== undefined) {
    return existingTempPage
  }
  const page = figma.createPage()
  page.name = TEMP_PAGE_NAME
  figma.root.insertChild(figma.root.children.length, page)
  return page
}

function clearPage(page: PageNode): void {
  // PageNode doesn't have `removeAll()`; remove children one by one.
  const children = [...page.children]
  for (const child of children) {
    child.remove()
  }
}

function getUniquePageName(baseName: string): string {
  const trimmedBaseName = baseName.trim() === '' ? 'Untitled' : baseName.trim()
  const existingNames = new Set(figma.root.children.map((page) => page.name))
  if (existingNames.has(trimmedBaseName) === false) {
    return trimmedBaseName
  }
  let suffix = 2
  while (existingNames.has(`${trimmedBaseName} (Imported ${suffix})`)) {
    suffix += 1
  }
  return `${trimmedBaseName} (Imported ${suffix})`
}

function calculateBoundingBox(nodes: ReadonlyArray<SceneNode>): {
  x: number
  y: number
  width: number
  height: number
} {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 100, height: 100 }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const node of nodes) {
    minX = Math.min(minX, node.x)
    minY = Math.min(minY, node.y)
    maxX = Math.max(maxX, node.x + node.width)
    maxY = Math.max(maxY, node.y + node.height)
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }
}

function cloneTopLevelNodesIntoFrame(sourcePage: PageNode, targetFrame: FrameNode): void {
  // Clone only top-level nodes. This avoids bringing the whole page node itself.
  // `clone()` keeps locked/hidden status as-is.
  const clonedNodes: Array<SceneNode> = []
  for (const node of sourcePage.children) {
    const cloned = node.clone()
    targetFrame.appendChild(cloned)
    clonedNodes.push(cloned)
  }

  // NO auto layout - preserve absolute positioning!
  // Calculate bounding box and resize frame to fit all content with padding.
  const bounds = calculateBoundingBox(clonedNodes)
  const padding = 50

  // Adjust node positions to be relative to frame origin with padding offset
  for (const node of clonedNodes) {
    node.x = node.x - bounds.x + padding
    node.y = node.y - bounds.y + padding
  }

  // Resize frame to fit content + padding on all sides
  targetFrame.resize(bounds.width + padding * 2, bounds.height + padding * 2)
}

function stackFramesVertically(frames: Array<FrameNode>, spacing: number): void {
  let y = 0
  for (const frame of frames) {
    frame.x = 0
    frame.y = y
    // We don't resize frames in v1; just provide visual separation.
    y += frame.height + spacing
  }
}

function packPages(): void {
  const sourcePages = figma.root.children.filter((page) => isTempPage(page) === false)
  if (sourcePages.length === 0) {
    figma.notify('No pages found to pack.')
    return
  }

  const tempPage = getOrCreateTempPage()
  clearPage(tempPage)
  figma.currentPage = tempPage

  const frames: Array<FrameNode> = []

  for (const page of sourcePages) {
    const frame = figma.createFrame()
    frame.name = page.name
    // Use pluginData so unpack can prefer the original name.
    frame.setPluginData('tcc:pageName', page.name)

    // Keep the default fills/strokes. Users can ignore visuals.
    tempPage.appendChild(frame)

    cloneTopLevelNodesIntoFrame(page, frame)
    frames.push(frame)
  }

  // After applying auto layout, we still want some spacing between the page-frames themselves.
  stackFramesVertically(frames, 200)

  figma.currentPage.selection = frames
  figma.viewport.scrollAndZoomIntoView(frames)

  figma.notify(
    `Packed ${frames.length} page${frames.length === 1 ? '' : 's'} into ${TEMP_PAGE_NAME}. Copy selection (Cmd/Ctrl+C).`
  )
}

function unpackPages(): void {
  console.log('[TCC] Unpack started')
  
  let sourcePage: PageNode
  const tempPage = figma.root.children.find((page) => isTempPage(page))
  
  if (tempPage === undefined) {
    console.log(`[TCC] ${TEMP_PAGE_NAME} not found, using current page: ${figma.currentPage.name}`)
    sourcePage = figma.currentPage
  } else {
    console.log(`[TCC] Found ${TEMP_PAGE_NAME}, using it as source`)
    sourcePage = tempPage
    if (figma.currentPage.id !== tempPage.id) {
      figma.currentPage = tempPage
    }
  }

  // Only unpack top-level frames.
  const frames = sourcePage.children.filter((node): node is FrameNode => node.type === 'FRAME')
  console.log(`[TCC] Found ${frames.length} top-level frames on page "${sourcePage.name}"`)

  if (frames.length === 0) {
    const msg = `No top-level frames found on page "${sourcePage.name}".`
    console.log(`[TCC] ${msg}`)
    figma.notify(msg)
    return
  }

  let createdPagesCount = 0

  for (const frame of frames) {
    const preferredName = frame.getPluginData('tcc:pageName') || frame.name
    const pageName = getUniquePageName(preferredName)
    console.log(`[TCC] Creating page "${pageName}" from frame "${frame.name}"`)

    const page = figma.createPage()
    page.name = pageName
    figma.root.insertChild(figma.root.children.length, page)

    // Move children from frame -> page.
    const children = [...frame.children]
    console.log(`[TCC] Moving ${children.length} children from frame to page`)
    for (const child of children) {
      page.appendChild(child)
    }

    frame.remove()
    createdPagesCount += 1
  }

  figma.currentPage = figma.root.children[figma.root.children.length - 1]

  const msg = `Unpacked ${createdPagesCount} page${createdPagesCount === 1 ? '' : 's'}.`
  console.log(`[TCC] ${msg}`)
  figma.notify(msg)
}

export default function () {
  once<PackPagesHandler>('PACK_PAGES', function () {
    packPages()
  })

  once<UnpackPagesHandler>('UNPACK_PAGES', function () {
    unpackPages()
  })

  once<CloseHandler>('CLOSE', function () {
    figma.closePlugin()
  })

  showUI({
    height: 156,
    width: 240
  })
}
