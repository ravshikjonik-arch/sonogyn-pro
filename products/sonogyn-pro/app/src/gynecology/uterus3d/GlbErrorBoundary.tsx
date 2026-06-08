import React from "react";

type Props = { children: React.ReactNode; fallback: React.ReactNode };

type State = { failed: boolean };

/** Ловит сетевые/парсинг ошибки `useGLTF` и откатывается на процедурную модель. */
export default class GlbErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError(): Partial<State> {
    return { failed: true };
  }

  override componentDidCatch(): void {
    /* образовательный режим: тихий fallback */
  }

  override render(): React.ReactNode {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}
