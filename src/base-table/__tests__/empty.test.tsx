import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { EmptyHtmlTable } from '../empty'

const render = (props: Partial<React.ComponentProps<typeof EmptyHtmlTable>> = {}) =>
  renderToStaticMarkup(React.createElement(EmptyHtmlTable, { descriptors: [], isLoading: false, ...props }))

const imgSrc = (html: string) => decodeURIComponent(/<img[^>]*src="([^"]*)"/.exec(html)?.[1].replace(/&amp;/g, '&') ?? '')

test('the default empty content keeps the original <img> element and only embeds its source', () => {
  const html = render()
  expect(html).toMatch(/<img alt="empty-image" class="empty-image" src="data:image\/svg\+xml,/)
  expect(html).not.toMatch(/alicdn/)
  expect(imgSrc(html)).toMatch(/^data:image\/svg\+xml,<svg width="50" height="50" /)
})

test('the default empty content adds no element ids to the page', () => {
  // Ids inside an <img> source stay in the image's own document, so several empty tables cannot collide.
  expect(render()).not.toMatch(/\sid="/)
})

test('the default empty text is unchanged for existing consumers', () => {
  expect(render()).toContain('没有符合查询条件的数据<br/>请修改条件后重新查询')
})

test('components.EmptyContent still replaces the default content', () => {
  const html = render({ EmptyContent: () => React.createElement('span', { className: 'custom' }, 'No data') })
  expect(html).toContain('<span class="custom">No data</span>')
  expect(html).not.toMatch(/empty-image/)
})

test('nothing is shown while loading', () => {
  expect(render({ isLoading: true })).not.toMatch(/empty-image|art-empty-wrapper/)
})
