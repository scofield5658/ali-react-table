import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { EmptyHtmlTable } from '../empty'

const render = (props: Partial<React.ComponentProps<typeof EmptyHtmlTable>> = {}) =>
  renderToStaticMarkup(React.createElement(EmptyHtmlTable, { descriptors: [], isLoading: false, ...props }))

test('the default empty content draws its illustration inline instead of loading a remote image', () => {
  const html = render()
  expect(html).not.toMatch(/<img/)
  expect(html).not.toMatch(/alicdn/)
  expect(html).toMatch(/<svg[^>]*class="empty-image"/)
  expect(html).toMatch(/xlink:href="#srp-empty-a"/)
  expect(html).toMatch(/fill="url\(#srp-empty-b\)"/)
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
