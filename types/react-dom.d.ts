// This file is no longer needed as we've installed @types/react-dom
// You can safely delete this file after installing @types/react-dom

declare module 'react-dom' {
  export function createPortal(
    children: React.ReactNode,
    container: Element | DocumentFragment,
    key?: null | string
  ): React.ReactPortal;
}
