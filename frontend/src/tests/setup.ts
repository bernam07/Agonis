;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

// jsdom doesn't implement IntersectionObserver, which infinite-scroll triggers rely on.
if (typeof (globalThis as any).IntersectionObserver === 'undefined') {
  class MockIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  }
  ;(globalThis as any).IntersectionObserver = MockIntersectionObserver
}
