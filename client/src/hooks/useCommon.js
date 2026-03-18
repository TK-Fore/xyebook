// 通用 React Hooks - 代码复用
import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useLocalStorage - 本地存储 hook
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

/**
 * useDebounce - 防抖 hook
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useMediaQuery - 媒体查询 hook
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (event) => setMatches(event.matches);

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * useIntersectionObserver - IntersectionObserver hook
 */
export function useIntersectionObserver(options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const targetRef = useRef(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        rootMargin: options.rootMargin || '100px',
        threshold: options.threshold || 0.1,
        ...options
      }
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [options.rootMargin, options.threshold, hasIntersected]);

  return { targetRef, isIntersecting, hasIntersected };
}

/**
 * useClickOutside - 点击外部 hook
 */
export function useClickOutside(callback) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback(event);
      }
    };

    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);

    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [callback]);

  return ref;
}

/**
 * useTheme - 主题管理 hook
 */
export function useTheme() {
  const themes = [
    { id: 'default', icon: '🐑', name: '清新蓝', class: '' },
    { id: 'pink', icon: '🌸', name: '少女粉', class: 'theme-pink' },
    { id: 'purple', icon: '💜', name: '梦幻紫', class: 'theme-purple' },
    { id: 'green', icon: '🌿', name: '森系绿', class: 'theme-green' },
    { id: 'orange', icon: '🍊', name: '活力橙', class: 'theme-orange' },
    { id: 'dark', icon: '🌙', name: '夜间模式', class: 'theme-dark' },
    { id: 'sepia', icon: '📖', name: '护眼模式', class: 'theme-sepia' },
  ];

  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('xyebook_theme') || 'default';
  });

  useEffect(() => {
    const theme = themes.find(t => t.id === currentTheme);
    if (theme) {
      document.body.className = theme.class;
      localStorage.setItem('xyebook_theme', currentTheme);
    }
  }, [currentTheme, themes]);

  const switchTheme = useCallback((themeId) => {
    setCurrentTheme(themeId);
  }, []);

  return { currentTheme, switchTheme, themes };
}

/**
 * useScroll - 滚动位置 hook
 */
export function useScroll() {
  const [scrollPosition, setScrollPosition] = useState({
    x: 0,
    y: 0,
    direction: 'none'
  });

  const lastY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      const direction = y > lastY.current ? 'down' : 'up';
      lastY.current = y;
      
      setScrollPosition({
        x: window.scrollX,
        y,
        direction
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return scrollPosition;
}

/**
 * useToggle - 开关状态 hook
 */
export function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);
  
  const toggle = useCallback(() => {
    setValue(v => !v);
  }, []);

  return [value, toggle, setValue];
}
