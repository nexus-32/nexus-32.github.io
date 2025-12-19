// Mobile Enhancement Script for MindWeaver
class MobileEnhancer {
  constructor() {
    this.isMobile = window.innerWidth <= 767;
    this.touchStartY = 0;
    this.touchStartX = 0;
    this.isMenuOpen = false;
    
    this.init();
  }
  
  init() {
    this.setupViewport();
    this.setupTouchGestures();
    this.setupMobileUI();
    this.setupOrientationHandler();
    this.setupKeyboardHandling();
    
    // Re-check on resize
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 767;
      this.updateMobileUI();
    });
  }
  
  setupViewport() {
    // Prevent zoom on input focus
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
  }
  
  setupTouchGestures() {
    let touchStartY = 0;
    let touchStartX = 0;
    
    document.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    
    document.addEventListener('touchmove', (e) => {
      const touchY = e.touches[0].clientY;
      const touchX = e.touches[0].clientX;
      const deltaY = touchStartY - touchY;
      const deltaX = touchX - touchStartX;
      
      // Swipe right to open menu
      if (deltaX > 50 && Math.abs(deltaY) < 50) {
        this.openSidebar();
      }
      
      // Swipe left to close menu
      if (deltaX < -50 && Math.abs(deltaY) < 50) {
        this.closeSidebar();
      }
    }, { passive: true });
  }
  
  setupMobileUI() {
    if (!this.isMobile) return;
    
    this.createMobileMenu();
    this.optimizeChatArea();
    this.setupVirtualScrolling();
    this.addHapticFeedback();
  }
  
  createMobileMenu() {
    // Check if menu already exists
    if (document.querySelector('.mobile-menu')) return;
    
    const menu = document.createElement('div');
    menu.className = 'mobile-menu';
    menu.innerHTML = `
      <button class="mobile-menu-btn" data-action="new-chat">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v14M5 12h14"/>
        </svg>
      </button>
      <button class="mobile-menu-btn" data-action="settings">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="3"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 1v6m0 6v6m4.22-13.22l4.24 4.24M1.54 9.54l4.24 4.24M1 12h6m6 0h6"/>
        </svg>
      </button>
      <button class="mobile-menu-btn" data-action="voice">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4"/>
        </svg>
      </button>
    `;
    
    menu.style.cssText = `
      position: fixed;
      bottom: 90px;
      right: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 1000;
    `;
    
    document.body.appendChild(menu);
    
    // Add event listeners
    menu.addEventListener('click', (e) => {
      const action = e.target.closest('.mobile-menu-btn')?.dataset.action;
      this.handleMenuAction(action);
    });
  }
  
  handleMenuAction(action) {
    switch (action) {
      case 'new-chat':
        this.triggerNewChat();
        break;
      case 'settings':
        this.openSettings();
        break;
      case 'voice':
        this.toggleVoiceInput();
        break;
    }
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }
  
  triggerNewChat() {
    // Find and click new conversation button
    const newChatBtn = document.querySelector('[class*="new"], button[aria-label*="new"]');
    if (newChatBtn) {
      newChatBtn.click();
    }
  }
  
  openSettings() {
    // Navigate to settings
    const settingsBtn = document.querySelector('[class*="settings"], [href*="settings"]');
    if (settingsBtn) {
      settingsBtn.click();
    }
  }
  
  toggleVoiceInput() {
    // Toggle voice input
    const voiceBtn = document.querySelector('[class*="voice"], [class*="microphone"]');
    if (voiceBtn) {
      voiceBtn.click();
    }
  }
  
  optimizeChatArea() {
    const chatArea = document.querySelector('[class*="conversation"], [class*="chat"], main');
    if (chatArea) {
      // Optimize scrolling performance
      chatArea.style.webkitOverflowScrolling = 'touch';
      chatArea.style.overflowScrolling = 'touch';
      
      // Add pull-to-refresh
      this.addPullToRefresh(chatArea);
    }
  }
  
  addPullToRefresh(element) {
    let startY = 0;
    let isPulling = false;
    
    element.addEventListener('touchstart', (e) => {
      if (element.scrollTop === 0) {
        startY = e.touches[0].clientY;
        isPulling = true;
      }
    }, { passive: true });
    
    element.addEventListener('touchmove', (e) => {
      if (!isPulling) return;
      
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY;
      
      if (diff > 0 && diff < 100) {
        element.style.transform = `translateY(${diff}px)`;
      }
    }, { passive: true });
    
    element.addEventListener('touchend', () => {
      if (isPulling) {
        element.style.transform = '';
        element.style.transition = 'transform 0.3s ease';
        
        setTimeout(() => {
          element.style.transition = '';
        }, 300);
        
        isPulling = false;
      }
    }, { passive: true });
  }
  
  setupVirtualScrolling() {
    // Implement virtual scrolling for long conversations
    const messages = document.querySelectorAll('[class*="message"], [class*="chat-message"]');
    if (messages.length > 50) {
      this.implementVirtualScroll(messages);
    }
  }
  
  implementVirtualScroll(messages) {
    // Simple virtual scrolling - show only visible messages
    const container = messages[0].parentElement;
    const messageHeight = 80; // Approximate height
    const visibleCount = Math.ceil(window.innerHeight / messageHeight);
    
    // Hide messages outside viewport
    messages.forEach((msg, index) => {
      if (index < visibleCount - 5 || index > visibleCount + 5) {
        msg.style.display = 'none';
      } else {
        msg.style.display = '';
      }
    });
  }
  
  addHapticFeedback() {
    // Add haptic feedback to all buttons
    document.addEventListener('click', (e) => {
      if (e.target.matches('button, [role="button"], a')) {
        if (navigator.vibrate) {
          navigator.vibrate(25);
        }
      }
    });
  }
  
  setupOrientationHandler() {
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.adjustForOrientation();
      }, 100);
    });
    
    this.adjustForOrientation();
  }
  
  adjustForOrientation() {
    const isLandscape = window.innerWidth > window.innerHeight;
    const body = document.body;
    
    if (isLandscape) {
      body.classList.add('landscape');
    } else {
      body.classList.remove('landscape');
    }
  }
  
  setupKeyboardHandling() {
    // Handle keyboard show/hide on mobile
    let initialHeight = window.innerHeight;
    
    window.addEventListener('resize', () => {
      const currentHeight = window.innerHeight;
      const heightDiff = initialHeight - currentHeight;
      
      if (heightDiff > 150) {
        // Keyboard is shown
        document.body.classList.add('keyboard-open');
      } else {
        // Keyboard is hidden
        document.body.classList.remove('keyboard-open');
      }
    });
  }
  
  openSidebar() {
    const sidebar = document.querySelector('aside, [class*="sidebar"], [class*="drawer"]');
    if (sidebar) {
      sidebar.classList.add('open');
      this.isMenuOpen = true;
    }
  }
  
  closeSidebar() {
    const sidebar = document.querySelector('aside, [class*="sidebar"], [class*="drawer"]');
    if (sidebar) {
      sidebar.classList.remove('open');
      this.isMenuOpen = false;
    }
  }
  
  updateMobileUI() {
    if (this.isMobile) {
      this.setupMobileUI();
    } else {
      // Clean up mobile-specific elements
      const mobileMenu = document.querySelector('.mobile-menu');
      if (mobileMenu) {
        mobileMenu.remove();
      }
    }
  }
  
  // Public methods
  destroy() {
    const mobileMenu = document.querySelector('.mobile-menu');
    if (mobileMenu) {
      mobileMenu.remove();
    }
    
    // Remove event listeners
    window.removeEventListener('resize', this.updateMobileUI);
    window.removeEventListener('orientationchange', this.adjustForOrientation);
  }
}

// Initialize mobile enhancements
let mobileEnhancer;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    mobileEnhancer = new MobileEnhancer();
  });
} else {
  mobileEnhancer = new MobileEnhancer();
}

// Make it globally available
window.mobileEnhancer = mobileEnhancer;
