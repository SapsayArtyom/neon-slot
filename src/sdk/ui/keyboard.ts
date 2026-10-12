/**
 * Горячая клавиша. Возвращает функцию, снимающую подписку: её вызывают
 * в Scene.onExit, иначе обработчик переживёт сцену.
 *
 * Клавиша определяется по `event.code`, а не по `event.key`: код не зависит
 * от раскладки и не меняется при переключении языка.
 *
 * Автоповтор при удержании игнорируется — иначе зажатый пробел отправлял бы
 * действие десятки раз в секунду.
 */
export function onKeyPress(code: string, handler: () => void): () => void {
  const listener = (event: KeyboardEvent): void => {
    if (event.code !== code || event.repeat) return

    // Пробел и стрелки иначе прокручивают страницу или «нажимают» фокус.
    event.preventDefault()
    handler()
  }

  window.addEventListener('keydown', listener)
  return () => window.removeEventListener('keydown', listener)
}
