// 性能监控和优化工具

/**
 * 防抖函数
 * @param func 要防抖的函数
 * @param wait 等待时间（毫秒）
 * @param immediate 是否立即执行
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }
    
    const callNow = immediate && !timeout
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    
    if (callNow) func(...args)
  }
}

/**
 * 节流函数
 * @param func 要节流的函数
 * @param limit 时间间隔（毫秒）
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 懒加载图片工具
export const lazyImageLoader = {
  observer: null as IntersectionObserver | null,
  loadedImages: new Set<string>(),

  init() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            const src = img.dataset.src
            if (src && !this.loadedImages.has(src)) {
              this.loadImage(img, src)
              this.observer?.unobserve(img)
            }
          }
        })
      }, {
        rootMargin: '50px'
      })
    }
  },

  loadImage(img: HTMLImageElement, src: string) {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => {
        img.src = src
        img.classList.add('loaded')
        this.loadedImages.add(src)
        resolve(image)
      }
      image.onerror = reject
      image.src = src
    })
  },

  observe(img: HTMLImageElement) {
    if (this.observer) {
      this.observer.observe(img)
    } else {
      // 降级处理
      const src = img.dataset.src
      if (src) {
        this.loadImage(img, src)
      }
    }
  },

  disconnect() {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
  },

  // 预加载关键图片
  preloadImages(urls: string[]) {
    urls.forEach(url => {
      if (!this.loadedImages.has(url)) {
        const img = new Image()
        img.src = url
      }
    })
  }
}

/**
 * 虚拟滚动类
 */
export class VirtualScroller {
  private container: HTMLElement
  private items: any[]
  private itemHeight: number
  private visibleCount: number
  private startIndex = 0
  private endIndex = 0
  private scrollTop = 0
  private cleanupScrollListener: (() => void) | null = null

  constructor(
    container: HTMLElement,
    items: any[],
    itemHeight: number,
    visibleCount: number
  ) {
    this.container = container
    this.items = items
    this.itemHeight = itemHeight
    this.visibleCount = visibleCount
    
    this.init()
  }

  private init() {
    this.container.style.height = `${this.items.length * this.itemHeight}px`
    this.cleanupScrollListener = addPassiveEventListener(
      this.container,
      'scroll',
      this.handleScroll.bind(this)
    )
    this.updateVisibleItems()
  }

  private handleScroll = throttle(() => {
    this.scrollTop = this.container.scrollTop
    this.updateVisibleItems()
  }, 16) // 60fps

  private updateVisibleItems() {
    this.startIndex = Math.floor(this.scrollTop / this.itemHeight)
    this.endIndex = Math.min(
      this.startIndex + this.visibleCount + 1,
      this.items.length
    )
    
    // 触发更新事件
    this.container.dispatchEvent(new CustomEvent('virtualUpdate', {
      detail: {
        startIndex: this.startIndex,
        endIndex: this.endIndex,
        visibleItems: this.items.slice(this.startIndex, this.endIndex)
      }
    }))
  }

  updateItems(items: any[]) {
    this.items = items
    this.container.style.height = `${this.items.length * this.itemHeight}px`
    this.updateVisibleItems()
  }

  destroy() {
    if (this.cleanupScrollListener) {
      this.cleanupScrollListener()
      this.cleanupScrollListener = null
    }
  }
}

/**
 * 资源预加载
 */
export class ResourcePreloader {
  private cache = new Map<string, Promise<any>>()

  /**
   * 预加载图片
   */
  preloadImage(src: string): Promise<HTMLImageElement> {
    if (this.cache.has(src)) {
      return this.cache.get(src)!
    }

    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })

    this.cache.set(src, promise)
    return promise
  }

  /**
   * 预加载多个图片
   */
  preloadImages(srcs: string[]): Promise<HTMLImageElement[]> {
    return Promise.all(srcs.map(src => this.preloadImage(src)))
  }

  /**
   * 预加载组件
   */
  preloadComponent(importFn: () => Promise<any>): Promise<any> {
    const key = importFn.toString()
    if (this.cache.has(key)) {
      return this.cache.get(key)!
    }

    const promise = importFn()
    this.cache.set(key, promise)
    return promise
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear()
  }
}

/**
 * 性能监控
 */
export class PerformanceMonitor {
  private marks = new Map<string, number>()
  private measures = new Map<string, number>()

  /**
   * 标记时间点
   */
  mark(name: string) {
    const time = performance.now()
    this.marks.set(name, time)
    
    if ('performance' in window && 'mark' in performance) {
      performance.mark(name)
    }
  }

  /**
   * 测量时间间隔
   */
  measure(name: string, startMark: string, endMark?: string) {
    const startTime = this.marks.get(startMark)
    const endTime = endMark ? this.marks.get(endMark) : performance.now()
    
    if (startTime && endTime) {
      const duration = endTime - startTime
      this.measures.set(name, duration)
      
      if ('performance' in window && 'measure' in performance) {
        performance.measure(name, startMark, endMark)
      }
      
      return duration
    }
    
    return 0
  }

  /**
   * 获取测量结果
   */
  getMeasure(name: string): number | undefined {
    return this.measures.get(name)
  }

  /**
   * 获取所有测量结果
   */
  getAllMeasures(): Record<string, number> {
    return Object.fromEntries(this.measures)
  }

  /**
   * 清除标记和测量
   */
  clear() {
    this.marks.clear()
    this.measures.clear()
    
    if ('performance' in window && 'clearMarks' in performance) {
      performance.clearMarks()
      performance.clearMeasures()
    }
  }

  /**
   * 监控页面加载性能
   */
  getPageLoadMetrics() {
    if (!('performance' in window) || !performance.timing) {
      return null
    }

    const timing = performance.timing
    const navigation = performance.navigation

    return {
      // DNS 查询时间
      dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
      // TCP 连接时间
      tcpConnect: timing.connectEnd - timing.connectStart,
      // 请求响应时间
      request: timing.responseEnd - timing.requestStart,
      // DOM 解析时间
      domParse: timing.domContentLoadedEventEnd - timing.domLoading,
      // 页面完全加载时间
      pageLoad: timing.loadEventEnd - timing.navigationStart,
      // 首次内容绘制时间
      firstContentfulPaint: this.getFirstContentfulPaint(),
      // 导航类型
      navigationType: navigation.type,
      // 重定向次数
      redirectCount: navigation.redirectCount
    }
  }

  private getFirstContentfulPaint(): number | null {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const paintEntries = performance.getEntriesByType('paint')
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint')
      return fcpEntry ? fcpEntry.startTime : null
    }
    return null
  }
}

// 创建全局实例
export const resourcePreloader = new ResourcePreloader()
export const performanceMonitor = new PerformanceMonitor()

// 页面可见性 API
export function onVisibilityChange(callback: (isVisible: boolean) => void) {
  const handleVisibilityChange = () => {
    callback(!document.hidden)
  }

  const cleanup = addPassiveEventListener(document, 'visibilitychange', handleVisibilityChange)
  
  return cleanup
}

// 网络状态监控
export function onNetworkChange(callback: (isOnline: boolean) => void) {
  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)

  const cleanup = addMultiplePassiveListeners(window, [
    { type: 'online', listener: handleOnline },
    { type: 'offline', listener: handleOffline }
  ])

  return cleanup
}

/**
 * 被动事件监听器工具
 */
export interface PassiveEventOptions {
  passive?: boolean
  capture?: boolean
  once?: boolean
}

/**
 * 添加被动事件监听器
 * 自动为滚动相关事件设置 passive: true 以提升性能
 */
export function addPassiveEventListener(
  element: Element | Window | Document,
  type: string,
  listener: EventListener,
  options: PassiveEventOptions = {}
): () => void {
  // 滚动相关事件默认使用 passive
  const scrollEvents = ['scroll', 'wheel', 'mousewheel', 'touchstart', 'touchmove']
  const shouldBePassive = scrollEvents.includes(type) && options.passive !== false
  
  const finalOptions: AddEventListenerOptions = {
    ...options,
    passive: shouldBePassive || options.passive
  }

  element.addEventListener(type, listener, finalOptions)

  // 返回清理函数
  return () => {
    element.removeEventListener(type, listener, finalOptions)
  }
}

/**
 * 批量添加被动事件监听器
 */
export function addMultiplePassiveListeners(
  element: Element | Window | Document,
  events: Array<{
    type: string
    listener: EventListener
    options?: PassiveEventOptions
  }>
): () => void {
  const cleanupFunctions = events.map(({ type, listener, options }) =>
    addPassiveEventListener(element, type, listener, options)
  )

  return () => {
    cleanupFunctions.forEach(cleanup => cleanup())
  }
}