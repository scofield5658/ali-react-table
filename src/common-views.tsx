import React from 'react'
import styled from 'styled-components'

type DivStyledProps = React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>

export const InlineFlexCell = styled.div<DivStyledProps>`
  display: inline-flex;
  align-items: center;
`

export const ExpansionCell = styled(InlineFlexCell)<DivStyledProps>`
  &.leaf {
    cursor: default;
  }

  .expansion-icon {
    fill: #999;
    flex: 0 0 16px;
    transition: transform 200ms;

    &.expanded {
      transform-origin: center center;
      transform: rotate(90deg);
    }
  }
`

interface IconProps extends React.SVGProps<SVGElement> {
  height?: number
  preserveAspectRatio?: string
  title?: string
  viewBox?: string
  width?: number
  xmlns?: string
  ref?: any
}

function CaretDownIcon(props: IconProps) {
  return (
    <svg
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      fill="currentColor"
      width="16"
      height="16"
      viewBox="0 0 32 32"
      {...props}
    >
      <path d="M24 12L16 22 8 12z" />
    </svg>
  )
}

function InfoIcon(props: IconProps) {
  return (
    <svg
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      fill="currentColor"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      {...props}
    >
      <path d="M8.5 11L8.5 6.5 6.5 6.5 6.5 7.5 7.5 7.5 7.5 11 6 11 6 12 10 12 10 11zM8 3.5c-.4 0-.8.3-.8.8S7.6 5 8 5c.4 0 .8-.3.8-.8S8.4 3.5 8 3.5z" />
      <path d="M8,15c-3.9,0-7-3.1-7-7s3.1-7,7-7s7,3.1,7,7S11.9,15,8,15z M8,2C4.7,2,2,4.7,2,8s2.7,6,6,6s6-2.7,6-6S11.3,2,8,2z" />
    </svg>
  )
}

function FilterIcon(props: IconProps) {
  return (
    <svg
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      fill="currentColor"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      {...props}
    >
      <path d="M2 3.25c0-.69.56-1.25 1.25-1.25h9.5c.69 0 1.25.56 1.25 1.25 0 .31-.12.61-.33.84L9.5 8.58V12a1 1 0 0 1-.45.83l-1.8 1.2A.75.75 0 0 1 6 13.4V8.58L2.33 4.09A1.25 1.25 0 0 1 2 3.25zm1.53.25L7.2 8v4.01l.8-.54V8l3.67-4.5H3.53z" />
    </svg>
  )
}

function CaretRightIcon(props: IconProps) {
  return (
    <svg
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      fill="currentColor"
      width="16"
      height="16"
      viewBox="0 0 32 32"
      {...props}
    >
      <path d="M12 8L22 16 12 24z" />
    </svg>
  )
}

function LoadingIcon(props: IconProps) {
  return (
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 1024 1024" {...props}>
      <path d="M512 74.667c-17.067 0-32 14.933-32 32V256c0 17.067 14.933 32 32 32s32-14.933 32-32V106.667c0-17.067-14.933-32-32-32zm181.333 288c8.534 0 17.067-2.134 23.467-8.534L821.333 249.6c12.8-12.8 12.8-32 0-44.8-12.8-12.8-32-12.8-44.8 0L672 309.333c-12.8 12.8-12.8 32 0 44.8 4.267 6.4 12.8 8.534 21.333 8.534zm224 117.333H768c-17.067 0-32 14.933-32 32s14.933 32 32 32h149.333c17.067 0 32-14.933 32-32s-14.933-32-32-32zM714.667 669.867c-12.8-12.8-32-12.8-44.8 0s-12.8 32 0 44.8L774.4 819.2c6.4 6.4 14.933 8.533 23.467 8.533s17.066-2.133 23.466-8.533c12.8-12.8 12.8-32 0-44.8L714.667 669.867zM512 736c-17.067 0-32 14.933-32 32v149.333c0 17.067 14.933 32 32 32s32-14.933 32-32V768c0-17.067-14.933-32-32-32zm-202.667-66.133L204.8 774.4c-12.8 12.8-12.8 32 0 44.8 6.4 6.4 14.933 8.533 23.467 8.533s17.066-2.133 23.466-8.533l104.534-104.533c12.8-12.8 12.8-32 0-44.8s-36.267-12.8-46.934 0zM288 512c0-17.067-14.933-32-32-32H106.667c-17.067 0-32 14.933-32 32s14.933 32 32 32H256c17.067 0 32-14.933 32-32zm-40.533-309.333c-12.8-12.8-32-12.8-44.8 0-12.8 12.8-12.8 32 0 44.8L307.2 352c6.4 6.4 14.933 8.533 23.467 8.533s17.066-2.133 23.466-8.533c12.8-12.8 12.8-32 0-44.8L247.467 202.667z" />
    </svg>
  )
}

export const icons = {
  Loading: LoadingIcon,
  CaretDown: CaretDownIcon,
  CaretRight: CaretRightIcon,
  Filter: FilterIcon,
  Info: InfoIcon,
}
