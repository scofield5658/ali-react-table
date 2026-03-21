# srp-table

[![NPM version][npm-image]][npm-url]
[![node version][node-image]][node-url]
[![npm download][download-image]][download-url]
[![npm license][license-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/%40guozhi5658%2Fsrp-table.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/@guozhi5658/srp-table
[node-image]: https://img.shields.io/badge/node.js-%3E=_18-green.svg?style=flat-square
[node-url]: http://nodejs.org/download/
[download-image]: https://img.shields.io/npm/dm/%40guozhi5658%2Fsrp-table.svg?style=flat-square
[download-url]: https://www.npmjs.com/package/@guozhi5658/srp-table
[license-image]: https://img.shields.io/npm/l/%40guozhi5658%2Fsrp-table.svg

`srp-table` is a high-performance table component library for React applications. It is designed for data-intensive UIs and supports two integration styles:

- direct prop-based usage with `BaseTable`
- composable enhancement through `pipeline` and feature plugins

The library also exposes customizable component injection points and feature slots so teams can adapt rendering, interaction, and business behaviors without rewriting the rendering core.

## Project Status

This project is forked from [alibaba/ali-react-table](https://github.com/alibaba/ali-react-table).

The fork keeps the original MIT licensing model. Please retain the upstream attribution and license terms when redistributing or modifying the codebase.

## Highlights

- high-performance rendering for large datasets
- sticky header and sticky footer support
- left and right locked columns
- horizontal and vertical virtualization
- tree data, row detail, sorting, and other pipeline-driven features
- pluggable renderers and component slots for customization
- pivot table entry for cross-table and cross-tree-table scenarios

## Installation

```bash
npm install @guozhi5658/srp-table
```

## Quick Start

### BaseTable

```tsx
import { BaseTable } from '@guozhi5658/srp-table'

const columns = [
  { code: 'name', name: 'Name', width: 180 },
  { code: 'status', name: 'Status', width: 120 },
]

const dataSource = [
  { id: '1', name: 'Alpha', status: 'Ready' },
  { id: '2', name: 'Beta', status: 'Running' },
]

export function DemoTable() {
  return (
    <BaseTable
      primaryKey="id"
      columns={columns}
      dataSource={dataSource}
      isStickyHeader
    />
  )
}
```

### Pipeline

```tsx
import { BaseTable, features, useTablePipeline } from '@guozhi5658/srp-table'

export function PipelineDemo({ columns, dataSource }) {
  const pipeline = useTablePipeline()

  const tableProps = pipeline
    .input({ columns, dataSource })
    .primaryKey('id')
    .use(
      features.sort({
        mode: 'multiple',
      }),
    )
    .getProps()

  return <BaseTable {...tableProps} />
}
```

## Playground

Run the local playground to develop and validate new features against the built-in flat, tree, and row-detail mock datasets:

```bash
npm install
npm run playground
```

The playground is intended for iterative feature work in a real React runtime and is the fastest way to verify layout, interaction, sticky behavior, and virtualization changes.

## Build

```bash
npm run build
```

Build artifacts are emitted to `dist/`, including:

- `dist/srp-table.js`
- `dist/srp-table.esm.js`
- `dist/srp-table.d.ts`
- `dist/srp-table-pivot.js`
- `dist/srp-table-pivot.esm.js`
- `dist/srp-table-pivot.d.ts`

## License

MIT. This fork is based on [alibaba/ali-react-table](https://github.com/alibaba/ali-react-table), and the upstream attribution should be preserved.
