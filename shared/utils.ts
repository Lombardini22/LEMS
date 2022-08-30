export function constVoid(): void {
  return
}

export function constant<A>(a: A): () => A {
  return () => a
}
