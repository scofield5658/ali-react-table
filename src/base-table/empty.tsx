import cx from 'classnames'
import React from 'react'
import { Colgroup } from './colgroup'
import { VisibleColumnDescriptor } from './interfaces'
import { Classes } from './styles'

/** 内联的空状态插图（原 img.alicdn.com 上的同一张 SVG），避免渲染空表格时发起外部网络请求 */
function EmptyImage() {
  return (
    <svg className="empty-image" role="img" aria-label="empty-image" width="50" height="50" viewBox="0 0 50 50">
      <defs>
        <path d="M.008 3.68v23.456l17.808-4.963.366-22.165L.008 3.68z" id="srp-empty-a" />
        <linearGradient x1="33.757%" y1="68.854%" x2="80.209%" y2="31.388%" id="srp-empty-b">
          <stop stopColor="#7B8594" stopOpacity=".2" offset="0%" />
          <stop stopColor="#8C96A5" stopOpacity=".4" offset="100%" />
        </linearGradient>
        <linearGradient x1="50%" y1="60.911%" x2="50%" y2="0%" id="srp-empty-c">
          <stop stopColor="#B0B8C2" stopOpacity=".2" offset="0%" />
          <stop stopColor="#8992A1" stopOpacity=".2" offset="100%" />
        </linearGradient>
      </defs>
      <g fill="none" fillRule="evenodd">
        <circle fillOpacity=".04" fill="#1F3858" cx="25" cy="25" r="25" />
        <path d="M25.052 21.613v23.455l17.807-4.963.366-22.164-18.173 3.672z" fill="#E0E4E9" opacity=".96" />
        <use fill="#E0E4E9" xlinkHref="#srp-empty-a" transform="translate(25.043 17.933)" />
        <path fill="#E0E4E9" d="M5.38 19.338V40.83l19.767 4.27-.131-23.426z" />
        <path
          fill="url(#srp-empty-b)"
          opacity=".6"
          transform="matrix(1 0 0 -1 5 48.762)"
          d="M.456 7.927L0 28.729l19.39-2.121V3.783z"
        />
        <path fill="url(#srp-empty-c)" d="M19.493 5.517v23.38l18.357-5.018.578-22.15z" transform="translate(5 16.25)" />
        <path fill="#A4AFBF" opacity=".8" d="M5.102 19.467l17.003-3.184 21.336 1.702-18.35 3.67z" />
        <path fill="#9EA7B3" opacity=".8" d="M22.105 21.654v-5.37l21.336 1.7-18.35 3.67z" />
        <path fill="#F3F4F5" d="M25.058 21.663l6.152 8.96 18.376-5.081-6.147-7.562z" />
        <path fill="#FFF" opacity=".1" d="M49.586 25.542L43.44 17.98l-18.381 3.683 6.152 8.96z" />
        <path fill="#F3F4F5" d="M5.121 19.47l-4.51 8.165 20.125 3.38 4.304-9.355z" />
        <path fill="#FFF" opacity=".1" d="M20.736 31.016l4.304-9.356-19.919-2.19-4.51 8.165z" />
        <path
          d="M7.465.327s.31 7.984 5.255 10.119c4.946 2.134 10.727-1.347 10.727-1.347s-7.445-3.635-8.152-6.672c-4.63.725-7.83-2.1-7.83-2.1z"
          fill="#FFF"
        />
        <path
          d="M8.369 5.029s2.201 2.844 5.68 2.54c1.816 2.823 7.532 2.462 7.532 2.462s-4.541 2.134-8.043.988c-3.503-1.145-5.17-5.99-5.17-5.99z"
          fill="#CFD4DB"
        />
        <path
          d="M33.426 9.209c.877.466 3.192.205 4.399-.207-.512.963-1.56 2.314-2.757 3.614-.755.82-2.013 1.64-3.18 2.009-1.898.165-3.603-.37-3.603-.37s3.509-1.977 5.14-5.046z"
          fill="#FFF"
        />
      </g>
    </svg>
  )
}

const DefaultEmptyContent = React.memo(() => (
  <>
    <EmptyImage />
    <div className="empty-tips">
      没有符合查询条件的数据
      <br />
      请修改条件后重新查询
    </div>
  </>
))

export interface EmptyTableProps {
  descriptors: VisibleColumnDescriptor[]
  isLoading: boolean
  emptyCellHeight?: number | string
  EmptyContent?: React.ComponentType
}

export function EmptyHtmlTable({
  descriptors,
  isLoading,
  emptyCellHeight,
  EmptyContent = DefaultEmptyContent,
}: EmptyTableProps) {
  const show = !isLoading

  return (
    <table>
      <Colgroup descriptors={descriptors} />
      <tbody>
        <tr className={cx(Classes.tableRow, 'first', 'last', 'no-hover')} data-rowindex={0}>
          <td
            className={cx(Classes.tableCell, 'first', 'last')}
            colSpan={descriptors.length}
            style={{ height: emptyCellHeight ?? 200 }}
          >
            {show && (
              <div className={Classes.emptyWrapper}>
                <EmptyContent />
              </div>
            )}
          </td>
        </tr>
      </tbody>
    </table>
  )
}
