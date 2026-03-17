import { useState, useEffect, useCallback } from 'react';

/**
 * 移动端手势操作 Hook
 * 支持：左滑返回、右滑翻页、上下滑动
 */
export function useSwipeGesture({
  onSwipeLeft,      // 左滑回调
  onSwipeRight,     // 右滑回调
  onSwipeUp,        // 上滑回调
  onSwipeDown,      // 下滑回调
  threshold = 50,   // 触发滑动的最小距离
  preventDefault = true // 是否阻止默认滚动
} = {}) {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isSwiping, setIsSwiping] = useState(false);

  const onTouchStart = useCallback((e) => {
    // 只记录单指触摸
    if (e.touches.length === 1) {
      setTouchEnd(null);
      setTouchStart(e.touches[0].clientX);
      setIsSwiping(true);
    }
  }, []);

  const onTouchMove = useCallback((e) => {
    if (preventDefault && e.touches.length === 1) {
      // 允许垂直滚动，阻止水平滑动触发页面返回
    }
    if (e.touches.length === 1) {
      setTouchEnd(e.touches[0].clientX);
    }
  }, [preventDefault]);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd || !isSwiping) return;

    const distance = touchStart - touchEnd;
    const absDistance = Math.abs(distance);

    // 只有滑动距离超过阈值才触发
    if (absDistance > threshold) {
      if (distance > 0) {
        // 左滑 (手指从右向左)
        onSwipeLeft?.();
      } else {
        // 右滑 (手指从左向右)
        onSwipeRight?.();
      }
    }

    setIsSwiping(false);
    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, threshold, onSwipeLeft, onSwipeRight, isSwiping]);

  // 垂直滑动检测
  const [touchStartY, setTouchStartY] = useState(null);
  const [touchEndY, setTouchEndY] = useState(null);

  const onTouchStartY = useCallback((e) => {
    if (e.touches.length === 1) {
      setTouchStartY(e.touches[0].clientY);
      setTouchEndY(null);
    }
  }, []);

  const onTouchMoveY = useCallback((e) => {
    if (e.touches.length === 1) {
      setTouchEndY(e.touches[0].clientY);
    }
  }, []);

  const onTouchEndY = useCallback(() => {
    if (!touchStartY || !touchEndY) return;

    const distance = touchStartY - touchEndY;
    const absDistance = Math.abs(distance);

    if (absDistance > threshold) {
      if (distance > 0) {
        onSwipeUp?.();
      } else {
        onSwipeDown?.();
      }
    }

    setTouchStartY(null);
    setTouchEndY(null);
  }, [touchStartY, touchEndY, threshold, onSwipeUp, onSwipeDown]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchStartY,
    onTouchMoveY,
    onTouchEndY,
    isSwiping
  };
}

/**
 * 判断是否为移动设备
 */
export function isMobile() {
  return window.innerWidth <= 768 || 
    'ontouchstart' in window || 
    navigator.maxTouchPoints > 0;
}

/**
 * 防止触摸延迟 (300ms)
 * 在 CSS 中添加 touch-action: manipulation
 */
export function addTouchOptimizations() {
  // 在 body 上添加触摸优化类
  if (typeof document !== 'undefined') {
    document.body.classList.add('touch-optimized');
  }
}
