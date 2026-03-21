import React, { ReactNode, useLayoutEffect, useRef, useState } from 'react'
import { BaseTable, features, useTablePipeline } from './runtime-lib'
import type { ArtColumn, BaseTableProps } from './runtime-lib'

type ScenarioKey = 'flat' | 'tree' | 'detail'
type VolumeKey = 'small' | 'medium' | 'large'

const scenarioMeta: Record<
  ScenarioKey,
  {
    title: string
    eyebrow: string
    description: string
    chain: string
    note: string
  }
> = {
  flat: {
    title: '平铺直出',
    eyebrow: 'Flat Dataset',
    description: '最贴近列表页的日常表格，适合调排序、锁列、虚拟滚动和单元格渲染。',
    chain: 'input -> sort -> BaseTable',
    note: '适合先接最基础的新 feature，确认列增强和行渲染没有副作用。',
  },
  tree: {
    title: '树状展开',
    eyebrow: 'Tree Expand',
    description: '原始数据保留 children 层级，通过 treeMode 在 pipeline 中做展开与缩进。',
    chain: 'input(tree) -> treeMode -> BaseTable',
    note: '适合验证树形缩进、展开态、锁列与虚拟滚动的组合行为。',
  },
  detail: {
    title: '展开子表',
    eyebrow: 'Row Detail',
    description: '每行都有摘要和明细，展开后插入一个跨列 detail 行渲染子表。',
    chain: 'input -> rowDetail -> BaseTable',
    note: '适合调“主表 + 子表”的组合 feature，比如操作列、行内面板、异步明细。',
  },
}

const volumeMeta: Record<VolumeKey, { label: string; flatCount: number; treeRoots: number; detailCount: number }> = {
  small: { label: 'S', flatCount: 18, treeRoots: 3, detailCount: 10 },
  medium: { label: 'M', flatCount: 64, treeRoots: 4, detailCount: 24 },
  large: { label: 'L', flatCount: 240, treeRoots: 6, detailCount: 60 },
}

const accentByScenario: Record<ScenarioKey, string> = {
  flat: '#e9734a',
  tree: '#0f766e',
  detail: '#2d5bff',
}

const pageStyle = {
  '--bg': '#f5efe2',
  '--surface': 'rgba(255, 251, 245, 0.86)',
  '--surface-strong': '#fffaf0',
  '--line': 'rgba(60, 44, 30, 0.12)',
  '--ink': '#201610',
  '--ink-soft': '#635449',
  '--shadow': '0 24px 80px rgba(60, 32, 12, 0.12)',
} as React.CSSProperties

export default function App() {
  const railRef = useRef<HTMLElement>(null)
  const [railHeight, setRailHeight] = useState<number | null>(null)
  const [scenario, setScenario] = useState<ScenarioKey>('flat')
  const [volume, setVolume] = useState<VolumeKey>('medium')
  const [lockColumns, setLockColumns] = useState(true)
  const [stickyHeader, setStickyHeader] = useState(true)
  const [virtual, setVirtual] = useState(true)
  const [outerBorder, setOuterBorder] = useState(true)

  const activeMeta = scenarioMeta[scenario]
  const accent = accentByScenario[scenario]

  useLayoutEffect(() => {
    const rail = railRef.current
    if (rail == null) {
      return
    }

    const update = () => {
      setRailHeight(Math.ceil(rail.getBoundingClientRect().height))
    }

    update()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update)
      return () => {
        window.removeEventListener('resize', update)
      }
    }

    const observer = new ResizeObserver(() => update())
    observer.observe(rail)
    window.addEventListener('resize', update)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <div
      className="playground-shell"
      style={{ ...pageStyle, '--accent': accent, '--rail-height': railHeight ? `${railHeight}px` : undefined } as React.CSSProperties}
    >
      <aside ref={railRef} className="control-rail">
        <div className="rail-card masthead">
          <p className="eyebrow">sr-table playground</p>
          <h1>SR Table Console</h1>
          <p className="lead">
            这里直接消费当前仓库源码，方便你在接入新 feature 时围绕真实数据形态做来回验证。
          </p>
        </div>

        <div className="rail-card">
          <p className="section-label">Scenario</p>
          <div className="scenario-grid">
            {(
              [
                ['flat', '平铺'],
                ['tree', '树形'],
                ['detail', '子表'],
              ] as Array<[ScenarioKey, string]>
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={scenario === key ? 'chip active' : 'chip'}
                onClick={() => setScenario(key)}
              >
                <span>{label}</span>
                <small>{scenarioMeta[key].eyebrow}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="rail-card">
          <p className="section-label">Data Volume</p>
          <div className="segmented">
            {(['small', 'medium', 'large'] as VolumeKey[]).map((key) => (
              <button
                key={key}
                type="button"
                className={volume === key ? 'segment active' : 'segment'}
                onClick={() => setVolume(key)}
              >
                {volumeMeta[key].label}
              </button>
            ))}
          </div>
          <p className="helper-text">切到 L 时更容易观察虚拟滚动和大数据渲染行为。</p>
        </div>

        <div className="rail-card">
          <p className="section-label">Debug Toggles</p>
          <ToggleRow label="锁列" checked={lockColumns} onChange={setLockColumns} />
          <ToggleRow label="Sticky Header" checked={stickyHeader} onChange={setStickyHeader} />
          <ToggleRow label="虚拟滚动" checked={virtual} onChange={setVirtual} />
          <ToggleRow label="外边框模式" checked={outerBorder} onChange={setOuterBorder} />
        </div>

        <div className="rail-card narrative">
          <p className="section-label">Current Chain</p>
          <h2>{activeMeta.title}</h2>
          <p>{activeMeta.description}</p>
          <code>{activeMeta.chain}</code>
          <p className="note">{activeMeta.note}</p>
        </div>
      </aside>

      <main className="canvas">
        <header className="canvas-header">
          <div>
            <p className="eyebrow">{activeMeta.eyebrow}</p>
            <h2>{activeMeta.title}</h2>
          </div>
          <div className="metric-row">
            <MetricCard title="Source Shape" value={activeMeta.eyebrow} />
            <MetricCard title="Volume" value={volumeMeta[volume].label} />
            <MetricCard title="Focus" value={scenario === 'flat' ? '排序/虚拟滚动' : scenario === 'tree' ? '展开/缩进' : '主子表联动'} />
          </div>
        </header>

        <section className="table-stage">
          <ScenarioBoard
            scenario={scenario}
            volume={volume}
            lockColumns={lockColumns}
            stickyHeader={stickyHeader}
            virtual={virtual}
            outerBorder={outerBorder}
          />
        </section>
      </main>
    </div>
  )
}

function ScenarioBoard({
  scenario,
  volume,
  lockColumns,
  stickyHeader,
  virtual,
  outerBorder,
}: {
  scenario: ScenarioKey
  volume: VolumeKey
  lockColumns: boolean
  stickyHeader: boolean
  virtual: boolean
  outerBorder: boolean
}) {
  if (scenario === 'tree') {
    return (
      <TreeScenarioTable
        volume={volume}
        lockColumns={lockColumns}
        stickyHeader={stickyHeader}
        virtual={virtual}
        outerBorder={outerBorder}
      />
    )
  }

  if (scenario === 'detail') {
    return (
      <DetailScenarioTable
        volume={volume}
        lockColumns={lockColumns}
        stickyHeader={stickyHeader}
        virtual={virtual}
        outerBorder={outerBorder}
      />
    )
  }

  return (
    <FlatScenarioTable
      volume={volume}
      lockColumns={lockColumns}
      stickyHeader={stickyHeader}
      virtual={virtual}
      outerBorder={outerBorder}
    />
  )
}

function FlatScenarioTable({
  volume,
  lockColumns,
  stickyHeader,
  virtual,
  outerBorder,
}: {
  volume: VolumeKey
  lockColumns: boolean
  stickyHeader: boolean
  virtual: boolean
  outerBorder: boolean
}) {
  const rows = createFlatRows(volume)
  const pipeline = useTablePipeline()
  const props = pipeline
    .input({
      dataSource: rows,
      columns: createFlatColumns(lockColumns),
    })
    .primaryKey('id')
    .use(
      features.sort({
        mode: 'multiple',
        defaultSorts: [{ code: 'gmv', order: 'desc' }],
        highlightColumnWhenActive: true,
      }),
    )
    .getProps()

  return (
    <TableFrame title="平铺直出表格" subtitle={`共 ${rows.length} 行数据，默认开启多列排序示例。`}>
      <BaseTable
        {...props}
        isStickyHeader={stickyHeader}
        useVirtual={virtual ? 'auto' : false}
        useOuterBorder={outerBorder}
        defaultColumnWidth={140}
        style={sharedTableStyle}
      />
    </TableFrame>
  )
}

function TreeScenarioTable({
  volume,
  lockColumns,
  stickyHeader,
  virtual,
  outerBorder,
}: {
  volume: VolumeKey
  lockColumns: boolean
  stickyHeader: boolean
  virtual: boolean
  outerBorder: boolean
}) {
  const rows = createTreeRows(volume)
  const pipeline = useTablePipeline()
  const props = pipeline
    .input({
      dataSource: rows,
      columns: createTreeColumns(lockColumns),
    })
    .primaryKey('id')
    .use(
      features.treeMode({
        defaultOpenKeys: rows.slice(0, 2).map((node) => node.id),
      }),
    )
    .getProps()

  return (
    <TableFrame title="树状展开表格" subtitle="原始数据保留 children，展开态由 pipeline 接管。">
      <BaseTable
        {...props}
        isStickyHeader={stickyHeader}
        useVirtual={virtual ? 'auto' : false}
        useOuterBorder={outerBorder}
        defaultColumnWidth={150}
        style={sharedTableStyle}
      />
    </TableFrame>
  )
}

function DetailScenarioTable({
  volume,
  lockColumns,
  stickyHeader,
  virtual,
  outerBorder,
}: {
  volume: VolumeKey
  lockColumns: boolean
  stickyHeader: boolean
  virtual: boolean
  outerBorder: boolean
}) {
  const rows = createDetailRows(volume)
  const pipeline = useTablePipeline()
  const props = pipeline
    .input({
      dataSource: rows,
      columns: createDetailColumns(lockColumns),
    })
    .primaryKey('id')
    .use(
      features.rowDetail({
        defaultOpenKeys: rows.slice(0, 2).map((row) => row.id),
        hasDetail(row) {
          return Array.isArray(row.lineItems) && row.lineItems.length > 0
        },
        renderDetail(row) {
          return <DetailSubTable parent={row} />
        },
        detailCellStyle: {
          background: '#fffaf3',
        },
      }),
    )
    .getProps()

  return (
    <TableFrame title="展开子表场景" subtitle="展开后会插入一整行 detail，适合调主子表联动 feature。">
      <BaseTable
        {...props}
        isStickyHeader={stickyHeader}
        useVirtual={virtual ? 'auto' : false}
        useOuterBorder={outerBorder}
        defaultColumnWidth={150}
        style={sharedTableStyle}
      />
    </TableFrame>
  )
}

function DetailSubTable({ parent }: { parent: any }) {
  const columns: ArtColumn[] = [
    { name: 'SKU', code: 'sku', width: 180 },
    { name: '规格', code: 'spec', width: 200 },
    { name: '数量', code: 'qty', align: 'right', width: 100 },
    { name: '单价', code: 'price', align: 'right', width: 120 },
    { name: '金额', code: 'amount', align: 'right', width: 140 },
  ]

  return (
    <div className="detail-card">
      <div className="detail-head">
        <div>
          <strong>{parent.customer}</strong>
          <span>{parent.channel} 渠道明细</span>
        </div>
        <div className="detail-badges">
          <em>{parent.status}</em>
          <em>{parent.owner}</em>
        </div>
      </div>
      <BaseTable
        primaryKey="sku"
        dataSource={parent.lineItems}
        columns={columns}
        hasHeader
        isStickyHeader={false}
        useVirtual={false}
        useOuterBorder
        style={{
          '--bgcolor': '#fffdf8',
          '--header-bgcolor': '#efe2c6',
          '--border-color': '#ddceb2',
          '--row-height': '42px',
          '--cell-padding': '8px 10px',
        }}
      />
    </div>
  )
}

function TableFrame({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="table-frame">
      <div className="table-frame-header">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <div className="frame-pill">Source-linked</div>
      </div>
      <div className="table-wrap">{children}</div>
    </div>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange(nextValue: boolean): void
}) {
  return (
    <button type="button" className="toggle-row" onClick={() => onChange(!checked)}>
      <span>{label}</span>
      <span className={checked ? 'toggle-pill active' : 'toggle-pill'}>{checked ? 'ON' : 'OFF'}</span>
    </button>
  )
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="metric-card">
      <small>{title}</small>
      <strong>{value}</strong>
    </div>
  )
}

function createFlatColumns(lockColumns: boolean): ArtColumn[] {
  return [
    {
      name: '商品',
      code: 'product',
      width: 220,
      lock: lockColumns,
      features: { sortable: true },
      render(value: string, row: any) {
        return (
          <div className="cell-stack">
            <strong>{value}</strong>
            <span>{row.category}</span>
          </div>
        )
      },
    },
    {
      name: '区域',
      code: 'region',
      width: 120,
      lock: lockColumns,
      features: { sortable: true },
    },
    {
      name: '负责人',
      code: 'owner',
      width: 140,
      features: { sortable: true },
    },
    {
      name: '状态',
      code: 'status',
      width: 130,
      features: { sortable: true },
      render(value: string) {
        return <span className={`status-dot status-${value.toLowerCase()}`}>{value}</span>
      },
    },
    {
      name: '件数',
      code: 'stock',
      width: 120,
      align: 'right',
      features: { sortable: true },
    },
    {
      name: '访问量',
      code: 'visits',
      width: 120,
      align: 'right',
      features: { sortable: true },
    },
    {
      name: '转化率',
      code: 'rate',
      width: 120,
      align: 'right',
      features: { sortable: true },
    },
    {
      name: 'GMV',
      code: 'gmv',
      width: 140,
      align: 'right',
      features: { sortable: true },
      render(value: number) {
        return <strong>{formatCurrency(value)}</strong>
      },
    },
    {
      name: '最近更新',
      code: 'updatedAt',
      width: 160,
      features: { sortable: true },
    },
  ]
}

function createTreeColumns(lockColumns: boolean): ArtColumn[] {
  return [
    {
      name: '节点',
      code: 'name',
      width: 260,
      lock: lockColumns,
      render(value: string, row: any) {
        return (
          <div className="cell-stack">
            <strong>{value}</strong>
            <span>{row.kind}</span>
          </div>
        )
      },
    },
    { name: 'Owner', code: 'owner', width: 140, lock: lockColumns },
    { name: '健康度', code: 'health', width: 120 },
    { name: '进度', code: 'progress', width: 120, align: 'right' },
    { name: '预算', code: 'budget', width: 140, align: 'right', render: (value: number) => formatCurrency(value) },
    { name: '风险', code: 'risk', width: 180 },
  ]
}

function createDetailColumns(lockColumns: boolean): ArtColumn[] {
  return [
    {
      name: '订单',
      code: 'orderNo',
      width: 220,
      lock: lockColumns,
      render(value: string, row: any) {
        return (
          <div className="cell-stack">
            <strong>{value}</strong>
            <span>{row.customer}</span>
          </div>
        )
      },
    },
    { name: '渠道', code: 'channel', width: 140, lock: lockColumns },
    { name: '负责人', code: 'owner', width: 120 },
    {
      name: '状态',
      code: 'status',
      width: 120,
      render(value: string) {
        return <span className={`status-dot status-${value.toLowerCase()}`}>{value}</span>
      },
    },
    { name: '订单额', code: 'amount', width: 140, align: 'right', render: (value: number) => formatCurrency(value) },
    { name: '商品数', code: 'itemCount', width: 120, align: 'right' },
    { name: '创建时间', code: 'createdAt', width: 160 },
  ]
}

function createFlatRows(volume: VolumeKey) {
  const regions = ['华东', '华北', '华南', '西南']
  const owners = ['Ada', 'Ming', 'Iris', 'Neo', 'Jules']
  const statuses = ['Healthy', 'Watching', 'Risk']
  const categories = ['家居', '运动', '数码', '零食']
  const count = volumeMeta[volume].flatCount

  return Array.from({ length: count }, (_, index) => {
    const stock = 40 + ((index * 17) % 380)
    const visits = 1200 + index * 91
    const rate = `${(2.4 + (index % 7) * 0.53).toFixed(2)}%`
    return {
      id: `flat-${index}`,
      product: `Momo Desk ${String(index + 1).padStart(3, '0')}`,
      category: categories[index % categories.length],
      region: regions[index % regions.length],
      owner: owners[index % owners.length],
      status: statuses[index % statuses.length],
      stock,
      visits,
      rate,
      gmv: 3200 + stock * 87 + (index % 5) * 1800,
      updatedAt: `2026-03-${String((index % 18) + 1).padStart(2, '0')} 1${index % 10}:20`,
    }
  })
}

function createTreeRows(volume: VolumeKey) {
  const roots = volumeMeta[volume].treeRoots
  const rows: any[] = []

  for (let groupIndex = 0; groupIndex < roots; groupIndex++) {
    rows.push({
      id: `dept-${groupIndex}`,
      name: `North Star Domain ${groupIndex + 1}`,
      kind: 'Domain',
      owner: ['Aster', 'Kira', 'Mona', 'Reed'][groupIndex % 4],
      health: ['稳态', '加速中', '预警'][groupIndex % 3],
      progress: `${64 + groupIndex * 6}%`,
      budget: 180000 + groupIndex * 32000,
      risk: groupIndex % 2 === 0 ? '接口收敛压力' : '排期资源紧张',
      children: Array.from({ length: volume === 'large' ? 5 : 4 }, (_, squadIndex) => ({
        id: `dept-${groupIndex}-squad-${squadIndex}`,
        name: `Squad ${groupIndex + 1}.${squadIndex + 1}`,
        kind: 'Squad',
        owner: ['Yan', 'Luca', 'Tia', 'June'][squadIndex % 4],
        health: ['稳态', '试运行', '需关注'][squadIndex % 3],
        progress: `${48 + squadIndex * 9}%`,
        budget: 64000 + squadIndex * 12000,
        risk: squadIndex % 2 === 0 ? '测试补位' : '接口联调',
        children: Array.from({ length: volume === 'small' ? 2 : 3 }, (_, taskIndex) => ({
          id: `dept-${groupIndex}-squad-${squadIndex}-task-${taskIndex}`,
          name: `Task ${groupIndex + 1}.${squadIndex + 1}.${taskIndex + 1}`,
          kind: 'Task',
          owner: ['Sol', 'Yoyo', 'Pia'][taskIndex % 3],
          health: ['正常', '观察中', '阻塞'][taskIndex % 3],
          progress: `${22 + taskIndex * 23}%`,
          budget: 12000 + taskIndex * 4000,
          risk: taskIndex % 2 === 0 ? '需求变更' : '验证待补齐',
        })),
      })),
    })
  }

  return rows
}

function createDetailRows(volume: VolumeKey) {
  const count = volumeMeta[volume].detailCount

  return Array.from({ length: count }, (_, index) => {
    const itemCount = 2 + (index % 4)
    const lineItems = Array.from({ length: itemCount }, (_, itemIndex) => {
      const qty = 1 + ((index + itemIndex) % 5)
      const price = 89 + itemIndex * 35 + (index % 3) * 22
      return {
        sku: `SKU-${index + 1}-${itemIndex + 1}`,
        spec: ['曜石黑 / M', '暖砂白 / L', '海雾灰 / XL', '浅栗棕 / S'][(index + itemIndex) % 4],
        qty,
        price: formatCurrency(price),
        amount: formatCurrency(qty * price),
      }
    })

    return {
      id: `order-${index}`,
      orderNo: `ORD-202603-${String(index + 1).padStart(4, '0')}`,
      customer: ['Orchid Studio', 'Nebula Mart', 'Atlas Supply', 'Juniper Lab'][index % 4],
      channel: ['直营', '分销', '联营'][index % 3],
      owner: ['Cora', 'Mika', 'Theo', 'Liam'][index % 4],
      status: ['Pending', 'Packed', 'Delayed'][index % 3],
      amount: 1200 + itemCount * 380 + (index % 6) * 240,
      itemCount,
      createdAt: `2026-03-${String((index % 17) + 3).padStart(2, '0')} 0${index % 9}:10`,
      lineItems,
    }
  })
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 0,
  }).format(value)
}

const sharedTableStyle: BaseTableProps['style'] = {
  '--bgcolor': '#fffdf9',
  '--header-bgcolor': '#eadfcb',
  '--header-color': '#433128',
  '--border-color': '#d8c8af',
  '--hover-bgcolor': '#fff4de',
  '--highlight-bgcolor': '#f8ebd0',
  '--row-height': '46px',
  '--cell-padding': '8px 12px',
}
