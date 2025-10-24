/**
 * 无障碍访问工具
 */

// 键盘导航管理器
export class KeyboardNavigationManager {
  private focusableElements: HTMLElement[] = []
  private currentIndex = -1
  private container: HTMLElement | null = null
  private isActive = false

  constructor(container?: HTMLElement) {
    this.container = container || document.body
    this.updateFocusableElements()
  }

  // 更新可聚焦元素列表
  updateFocusableElements() {
    if (!this.container) return

    const selector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')

    this.focusableElements = Array.from(
      this.container.querySelectorAll(selector)
    ).filter(el => {
      const element = el as HTMLElement
      return element.offsetParent !== null && // 元素可见
             !element.hasAttribute('aria-hidden') &&
             element.tabIndex !== -1
    }) as HTMLElement[]
  }

  // 激活键盘导航
  activate() {
    if (this.isActive) return

    this.isActive = true
    this.updateFocusableElements()
    
    document.addEventListener('keydown', this.handleKeyDown)
    document.addEventListener('focusin', this.handleFocusIn)
  }

  // 停用键盘导航
  deactivate() {
    if (!this.isActive) return

    this.isActive = false
    document.removeEventListener('keydown', this.handleKeyDown)
    document.removeEventListener('focusin', this.handleFocusIn)
  }

  // 处理键盘事件
  private handleKeyDown = (event: KeyboardEvent) => {
    if (!this.isActive) return

    switch (event.key) {
      case 'Tab':
        this.handleTabNavigation(event)
        break
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault()
        this.focusNext()
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault()
        this.focusPrevious()
        break
      case 'Home':
        event.preventDefault()
        this.focusFirst()
        break
      case 'End':
        event.preventDefault()
        this.focusLast()
        break
      case 'Escape':
        this.handleEscape()
        break
      case 'Enter':
      case ' ':
        this.handleActivation(event)
        break
    }
  }

  // 处理Tab导航
  private handleTabNavigation(event: KeyboardEvent) {
    this.updateFocusableElements()
    
    if (this.focusableElements.length === 0) return

    const activeElement = document.activeElement as HTMLElement
    const currentIndex = this.focusableElements.indexOf(activeElement)

    if (event.shiftKey) {
      // Shift + Tab: 向前导航
      const nextIndex = currentIndex <= 0 ? 
        this.focusableElements.length - 1 : currentIndex - 1
      this.focusableElements[nextIndex]?.focus()
    } else {
      // Tab: 向后导航
      const nextIndex = currentIndex >= this.focusableElements.length - 1 ? 
        0 : currentIndex + 1
      this.focusableElements[nextIndex]?.focus()
    }

    event.preventDefault()
  }

  // 处理焦点进入事件
  private handleFocusIn = (event: FocusEvent) => {
    const target = event.target as HTMLElement
    this.currentIndex = this.focusableElements.indexOf(target)
  }

  // 聚焦下一个元素
  focusNext() {
    this.updateFocusableElements()
    if (this.focusableElements.length === 0) return

    this.currentIndex = (this.currentIndex + 1) % this.focusableElements.length
    this.focusableElements[this.currentIndex]?.focus()
  }

  // 聚焦上一个元素
  focusPrevious() {
    this.updateFocusableElements()
    if (this.focusableElements.length === 0) return

    this.currentIndex = this.currentIndex <= 0 ? 
      this.focusableElements.length - 1 : this.currentIndex - 1
    this.focusableElements[this.currentIndex]?.focus()
  }

  // 聚焦第一个元素
  focusFirst() {
    this.updateFocusableElements()
    if (this.focusableElements.length === 0) return

    this.currentIndex = 0
    this.focusableElements[0]?.focus()
  }

  // 聚焦最后一个元素
  focusLast() {
    this.updateFocusableElements()
    if (this.focusableElements.length === 0) return

    this.currentIndex = this.focusableElements.length - 1
    this.focusableElements[this.currentIndex]?.focus()
  }

  // 处理Escape键
  private handleEscape() {
    // 可以在子类中重写此方法
    const activeElement = document.activeElement as HTMLElement
    activeElement?.blur()
  }

  // 处理激活事件（Enter/Space）
  private handleActivation(event: KeyboardEvent) {
    const activeElement = document.activeElement as HTMLElement
    
    if (activeElement.tagName === 'BUTTON' || 
        activeElement.tagName === 'A' ||
        activeElement.hasAttribute('role')) {
      // 对于按钮和链接，触发点击事件
      activeElement.click()
      event.preventDefault()
    }
  }
}

// 屏幕阅读器支持
export class ScreenReaderSupport {
  private announceElement: HTMLElement | null = null

  constructor() {
    this.createAnnounceElement()
  }

  // 创建用于屏幕阅读器公告的元素
  private createAnnounceElement() {
    this.announceElement = document.createElement('div')
    this.announceElement.setAttribute('aria-live', 'polite')
    this.announceElement.setAttribute('aria-atomic', 'true')
    this.announceElement.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `
    document.body.appendChild(this.announceElement)
  }

  // 向屏幕阅读器公告消息
  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (!this.announceElement) return

    this.announceElement.setAttribute('aria-live', priority)
    this.announceElement.textContent = message

    // 清空内容，以便下次公告
    setTimeout(() => {
      if (this.announceElement) {
        this.announceElement.textContent = ''
      }
    }, 1000)
  }

  // 公告页面变化
  announcePageChange(pageName: string) {
    this.announce(`已导航到${pageName}页面`, 'assertive')
  }

  // 公告操作结果
  announceAction(action: string, result: 'success' | 'error' | 'info') {
    const resultText = {
      success: '成功',
      error: '失败',
      info: '完成'
    }[result]

    this.announce(`${action}${resultText}`, result === 'error' ? 'assertive' : 'polite')
  }

  // 公告表单验证错误
  announceFormError(fieldName: string, errorMessage: string) {
    this.announce(`${fieldName}字段错误：${errorMessage}`, 'assertive')
  }

  // 销毁公告元素
  destroy() {
    if (this.announceElement) {
      document.body.removeChild(this.announceElement)
      this.announceElement = null
    }
  }
}

// 焦点陷阱（用于模态框等）
export class FocusTrap {
  private container: HTMLElement
  private previousActiveElement: HTMLElement | null = null
  private isActive = false

  constructor(container: HTMLElement) {
    this.container = container
  }

  // 激活焦点陷阱
  activate() {
    if (this.isActive) return

    this.previousActiveElement = document.activeElement as HTMLElement
    this.isActive = true

    // 聚焦到容器内的第一个可聚焦元素
    const firstFocusable = this.getFirstFocusableElement()
    if (firstFocusable) {
      firstFocusable.focus()
    }

    document.addEventListener('keydown', this.handleKeyDown)
  }

  // 停用焦点陷阱
  deactivate() {
    if (!this.isActive) return

    this.isActive = false
    document.removeEventListener('keydown', this.handleKeyDown)

    // 恢复之前的焦点
    if (this.previousActiveElement) {
      this.previousActiveElement.focus()
    }
  }

  // 处理键盘事件
  private handleKeyDown = (event: KeyboardEvent) => {
    if (!this.isActive || event.key !== 'Tab') return

    const focusableElements = this.getFocusableElements()
    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    const activeElement = document.activeElement

    if (event.shiftKey) {
      // Shift + Tab
      if (activeElement === firstElement) {
        lastElement.focus()
        event.preventDefault()
      }
    } else {
      // Tab
      if (activeElement === lastElement) {
        firstElement.focus()
        event.preventDefault()
      }
    }
  }

  // 获取容器内的可聚焦元素
  private getFocusableElements(): HTMLElement[] {
    const selector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')

    return Array.from(this.container.querySelectorAll(selector))
      .filter(el => {
        const element = el as HTMLElement
        return element.offsetParent !== null &&
               !element.hasAttribute('aria-hidden')
      }) as HTMLElement[]
  }

  // 获取第一个可聚焦元素
  private getFirstFocusableElement(): HTMLElement | null {
    const elements = this.getFocusableElements()
    return elements.length > 0 ? elements[0] : null
  }
}

// 无障碍访问工具函数
export const a11yUtils = {
  // 设置元素的ARIA标签
  setAriaLabel(element: HTMLElement, label: string) {
    element.setAttribute('aria-label', label)
  },

  // 设置元素的ARIA描述
  setAriaDescription(element: HTMLElement, description: string) {
    const descId = `desc-${Math.random().toString(36).substr(2, 9)}`
    
    let descElement = document.getElementById(descId)
    if (!descElement) {
      descElement = document.createElement('div')
      descElement.id = descId
      descElement.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `
      document.body.appendChild(descElement)
    }
    
    descElement.textContent = description
    element.setAttribute('aria-describedby', descId)
  },

  // 设置元素的可访问性状态
  setAriaState(element: HTMLElement, state: Record<string, string | boolean>) {
    Object.entries(state).forEach(([key, value]) => {
      element.setAttribute(`aria-${key}`, String(value))
    })
  },

  // 检查元素是否可访问
  isAccessible(element: HTMLElement): boolean {
    // 检查基本的可访问性要求
    const hasLabel = element.hasAttribute('aria-label') ||
                    element.hasAttribute('aria-labelledby') ||
                    (element as HTMLInputElement).labels?.length > 0

    const isVisible = element.offsetParent !== null &&
                     !element.hasAttribute('aria-hidden')

    const isFocusable = element.tabIndex >= 0 ||
                       ['button', 'input', 'select', 'textarea', 'a'].includes(element.tagName.toLowerCase())

    return hasLabel && isVisible && (isFocusable || element.hasAttribute('role'))
  },

  // 创建可访问的按钮
  createAccessibleButton(text: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button')
    button.textContent = text
    button.setAttribute('aria-label', text)
    button.addEventListener('click', onClick)
    return button
  },

  // 创建可访问的输入框
  createAccessibleInput(label: string, type = 'text'): { input: HTMLInputElement, label: HTMLLabelElement } {
    const input = document.createElement('input')
    const labelElement = document.createElement('label')
    const id = `input-${Math.random().toString(36).substr(2, 9)}`

    input.type = type
    input.id = id
    labelElement.textContent = label
    labelElement.setAttribute('for', id)

    return { input, label: labelElement }
  }
}

// 全局键盘导航管理器实例
export const globalKeyboardNav = new KeyboardNavigationManager()

// 全局屏幕阅读器支持实例
export const globalScreenReader = new ScreenReaderSupport()

// 初始化无障碍访问功能
export function initAccessibility() {
  // 检测用户是否使用键盘导航
  let isUsingKeyboard = false

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      isUsingKeyboard = true
      document.body.classList.add('using-keyboard')
    }
  })

  document.addEventListener('mousedown', () => {
    isUsingKeyboard = false
    document.body.classList.remove('using-keyboard')
  })

  // 添加跳转到主内容的链接
  const skipLink = document.createElement('a')
  skipLink.href = '#main-content'
  skipLink.textContent = '跳转到主内容'
  skipLink.className = 'skip-link'
  skipLink.style.cssText = `
    position: absolute;
    top: -40px;
    left: 6px;
    background: #000;
    color: #fff;
    padding: 8px;
    text-decoration: none;
    z-index: 10000;
    border-radius: 4px;
  `

  skipLink.addEventListener('focus', () => {
    skipLink.style.top = '6px'
  })

  skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px'
  })

  document.body.insertBefore(skipLink, document.body.firstChild)

  // 确保主内容区域有正确的ID
  const mainContent = document.querySelector('main') || 
                     document.querySelector('#app') ||
                     document.querySelector('.main-content')
  
  if (mainContent && !mainContent.id) {
    mainContent.id = 'main-content'
  }
}