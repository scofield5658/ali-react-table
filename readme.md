# sr-table

`sr-table` is a high-performance table component library for React applications. It is designed for data-intensive UIs and supports two integration styles:

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
npm install sr-table
```

## Quick Start

### BaseTable

```tsx
import { BaseTable } from 'sr-table'

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
import { BaseTable, features, useTablePipeline } from 'sr-table'

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

- `dist/sr-table.js`
- `dist/sr-table.esm.js`
- `dist/sr-table.d.ts`
- `dist/sr-table-pivot.js`
- `dist/sr-table-pivot.esm.js`
- `dist/sr-table-pivot.d.ts`

## License

MIT. This fork is based on [alibaba/ali-react-table](https://github.com/alibaba/ali-react-table), and the upstream attribution should be preserved.
