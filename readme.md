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
[license-image]: https://img.shields.io/npm/l/%40guozhi5658%2Fsrp-table.svg?style=flat-square

**`@guozhi5658/srp-table`** is a high-performance React table library for data-heavy UIs. It is **forked from** [alibaba/ali-react-table](https://github.com/alibaba/ali-react-table) and keeps the MIT model; retain upstream attribution when redistributing or modifying the codebase.

## Architecture

| Layer | Role |
|-------|------|
| **`BaseTable`** | Rendering core: horizontal/vertical virtualization, left/right locked columns, sticky header/footer, row height management. |
| **`TablePipeline` + `features`** | Composable enhancements to `columns`, `dataSource`, row props, selection, tree shape, sorting, filters, etc., before props reach `<BaseTable />`. |

Integration styles:

- Pass props directly to **`BaseTable`**
- Chain **`.use(features.xxx(...))`** on a pipeline, then **`<BaseTable {...pipeline.getProps()} />`**

A legacy **`transforms`** API still exists for compatibility; **new capabilities belong in `pipeline/features`**, not in `transforms`.

Pivot / cross-table scenarios use the subpath package:

```bash
npm install @guozhi5658/srp-table
# import from '@guozhi5658/srp-table/pivot'
```

## Pipeline features (overview)

Sixteen features live under `features` and are composed with `pipeline.use(features.xxx(...))`. Several require UI components via **`ctx.components`** (e.g. Checkbox, Radio, Popover).

| Group | Features |
|-------|----------|
| Selection | `multiSelect`, `singleSelect`, `treeSelect` |
| Tree | `treeMode`, `buildTree` |
| Expand / group | `rowDetail`, `rowGrouping` |
| Column UX | `columnHover`, `columnRangeHover`, `columnResize`, `sort`, `tips`, `filterMode` |
| Layout | `fillRemainingWidth`, `autoRowSpan` |
| Row | `rowPopover` |

For descriptions, `ctx.components` dependencies, and engineering constraints, see **[AGENTS.md](./AGENTS.md)** (Chinese, detailed). **[CLAUDE.md](./CLAUDE.md)** is a shorter English checklist for agents working in this repo.

## Highlights

- Virtualized rows and columns for large datasets  
- Sticky header/footer, left/right locked columns  
- Tree rows, row detail, grouping, sorting, resizing, filters, and other pipeline-driven behavior  
- Customizable slots: `BaseTableProps.components`, column render hooks, pipeline `ctx.components`  
- **`@guozhi5658/srp-table/pivot`**: cross-table and cross-tree-table built on the same `BaseTable` core  

## Installation

```bash
npm install @guozhi5658/srp-table
```

Peer dependency: **React** `^16.8.0 || ^17.0.1 || ^18.0.0`.

## Quick start

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

You can combine multiple `.use(...)` calls; **order matters** when features append or rewrite columns. See **AGENTS.md** for full-row span and lock-column caveats.

## Playground

```bash
npm install
npm run playground   # dev server (e.g. port 3100)
```

The playground is a Vite app for flat, tree, row-detail, grouped-header, and merged-cell scenarios—useful for layout, sticky behavior, and virtualization checks. For library development, this repo pins **Node 22.x** via **Volta** (see `package.json`).

## Build & compatibility

```bash
npm run build                  # Rollup → dist/
npm run playground:build
npm run verify:react-compat    # React 16 / 17 / 18 smoke script
```

Artifacts under `dist/` include `srp-table` and `srp-table-pivot` entry bundles and `.d.ts` files (see **Build** list in **AGENTS.md** if you need exact filenames).

## License

MIT. This fork is based on [alibaba/ali-react-table](https://github.com/alibaba/ali-react-table); preserve upstream attribution.
