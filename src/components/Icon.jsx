const PATHS = {
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  close: 'M6 6l12 12M18 6 6 18',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
  bag: 'M5 8h14l-1 12H6L5 8zM9 8V6a3 3 0 0 1 6 0v2',
  clock: 'M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
  bike: 'M5 17a3 3 0 1 0 0-.01M19 17a3 3 0 1 0 0-.01M5 17l4-8h5l3 8M9 9 8 6H6M14 9l2-3h2',
  store: 'M4 10h16v10H4zM3 10l2-6h14l2 6M10 20v-5h4v5',
  table: 'M4 9h16M6 9v10M18 9v10M8 5h8',
  card: 'M3 6h18v12H3zM3 10h18M7 15h3',
  cash: 'M3 7h18v10H3zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM6 10v4M18 10v4',
  pix: 'M12 3l4 4-4 4-4-4 4-4zM12 13l4 4-4 4-4-4 4-4zM3 12l4-4 4 4-4 4-4-4zM13 12l4-4 4 4-4 4-4-4z',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  check: 'M5 12l5 5L20 7',
  chat: 'M4 20l1.5-4A8 8 0 1 1 9 19.5L4 20z',
  pin: 'M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12zM12 7a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  back: 'M15 5l-7 7 7 7',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2zM10 20a2 2 0 0 0 4 0',
  bellOff: 'M6 16V11a6 6 0 0 1 9-5.2M18 11v5l2 2H4l2-2M10 20a2 2 0 0 0 4 0M3 3l18 18',
  print: 'M7 9V3h10v6M7 17H4V9h16v8h-3M7 14h10v7H7z',
  lock: 'M6 11h12v10H6zM8 11V8a4 4 0 0 1 8 0v3',
  logout: 'M10 4H5v16h5M14 8l4 4-4 4M18 12H9',
  receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2V3zM9 8h6M9 12h6',
  fire: 'M12 21a6 6 0 0 0 6-6c0-4-3-6-3-10-2 1-4 3-4 6-1-1-2-2-2-4-2 2-3 5-3 8a6 6 0 0 0 6 6z',
}

export default function Icon({ name, size = 20, stroke = 2, className }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}

export function WhatsAppIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3.9 2.5 1 2.7.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z" />
    </svg>
  )
}

export function Logo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="#141210" />
      <path d="M32 8a24 24 0 1 0 23.4 29.3" fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" />
      <circle cx="32" cy="32" r="9" fill="var(--accent)" />
      <path d="M44 13 58 4M47 17 60 9" stroke="var(--text)" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  )
}
