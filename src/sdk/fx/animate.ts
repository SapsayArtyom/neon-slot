import gsap from 'gsap'

/**
 * Твин GSAP, которого можно дождаться.
 *
 * Обычный `gsap.to(...).then()` не разрешается, если твин перебили новым —
 * а с `overwrite: true` это происходит постоянно. Здесь промис закрывается
 * и по завершении, и по прерыванию, поэтому ожидающий код не зависает.
 *
 * Свои `onComplete` и `onInterrupt` передавать не нужно: они заняты.
 */
export function tweenTo(target: object, vars: gsap.TweenVars): Promise<void> {
  return new Promise((resolve) => {
    gsap.to(target, { ...vars, onComplete: resolve, onInterrupt: resolve })
  })
}
