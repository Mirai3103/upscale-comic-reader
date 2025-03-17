import { html } from "hono/html";
import { HOST_URL } from "../config/env";

export function galleryTemplate() {
	return html`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Process Image Gallery</title>
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <style>
    [v-cloak] { display: none; }
    
    /* Custom scrollbar - only on desktop */
    @media (min-width: 768px) {
      ::-webkit-scrollbar {
        width: 8px;
      }
      ::-webkit-scrollbar-track {
        background: #f1f1f1;
      }
      ::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 5px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: #555;
      }
    }
    
    /* Reader settings */
    .reader-img {
      width: 100%;
      height: auto;
      margin: 0 auto;
      display: block;
    }
    
    /* Image loading effect */
    .image-placeholder {
      width: 100%;
      height: 300px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
    }
    
    @keyframes loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    
    /* Dark mode */
    body.dark-mode {
      background-color: #121212;
      color: #e0e0e0;
    }
    
    .dark-mode .bg-white {
      background-color: #1e1e1e !important;
    }
    
    .dark-mode .text-gray-800 {
      color: #e0e0e0 !important;
    }
    
    .dark-mode .text-gray-600, 
    .dark-mode .text-gray-500 {
      color: #b0b0b0 !important;
    }
    
    .dark-mode .border-gray-200 {
      border-color: #333 !important;
    }
    
    .dark-mode .bg-gray-100 {
      background-color: #121212 !important;
    }
    
    /* Fullscreen reading optimizations */
    .fullscreen-mode .reader-header,
    .fullscreen-mode .reader-footer,
    .fullscreen-mode .control-panel,
    .fullscreen-mode .mini-control {
      display: none !important;
    }
    
    .fullscreen-mode .reader-{
      margin-top: 0 !important;
      padding-top: 0 !important;
    }
    
    .fullscreen-tap-area {
      position: fixed;
      height: 100vh;
      width: 33.333%;
      top: 0;
      z-index: 40;
    }
    
    .fullscreen-tap-left {
      left: 0;
    }
    
    .fullscreen-tap-center {
      left: 33.333%;
    }
    
    .fullscreen-tap-right {
      right: 0;
    }
    
    /* Bottom safe area for mobile devices */
    .bottom-safe-area {
      padding-bottom: env(safe-area-inset-bottom, 20px);
    }
    
    /* Optimized reader UI for mobile */
    @media (max-width: 640px) {
      .reader-> div {
        margin-bottom: 1rem !important;
        border-radius: 0.5rem !important;
      }
      
      .floating-controls {
        bottom: env(safe-area-inset-bottom, 16px);
      }
    }
  </style>
</head>
<body class="bg-gray-100 min-h-screen"

 @vue:mounted="mounted"
v-scope="{ 
    process: null, 
    loading: false, 
    error: null,
    autoRefresh: true,
    refreshInterval: null,
    darkMode: false,
    showControls: true,
    inputVisible: true,
    fullscreenMode: false,
    currentImageIndex: 0,
    
    async fetchProcess() {
      if (!this.processId.trim()) {
        this.error = 'Please enter a process ID';
        return;
      }
      
      this.loading = true;
      this.error = null;
      
      try {
        const response = await fetch('${HOST_URL}/api/process/' + this.processId.trim());
        if (!response.ok) {
          throw new Error('Process not found');
        }
        this.process = await response.json();
        
        // Sort images by filename
        if (this.process.images && this.process.images.length > 0) {
          this.process.images.sort((a, b) => {
            const aName = a.split('/').pop();
            const bName = b.split('/').pop();
            return aName.localeCompare(bName, undefined, {numeric: true});
          });
        }
        
        // Hide input area after successful fetch
        this.inputVisible = false;
        
        // Set up auto-refresh if the process is still running or pending
        if (this.autoRefresh && 
            (this.process.status === 'running' || this.process.status === 'pending')) {
          if (!this.refreshInterval) {
            this.refreshInterval = setInterval(() => this.refreshProcess(), 5000);
          }
        } else if (this.refreshInterval) {
          clearInterval(this.refreshInterval);
          this.refreshInterval = null;
        }
      } catch (err) {
        this.error = err.message;
        this.process = null;
      } finally {
        this.loading = false;
      }
    },
    
    async refreshProcess() {
      if (!this.processId.trim()) return;
      
      try {
        const response = await fetch('${HOST_URL}/api/process/' + this.processId);
        if (!response.ok) {
          throw new Error('Process not found');
        }
        const updatedProcess = await response.json();
        
        // Sort images by filename
        if (updatedProcess.images && updatedProcess.images.length > 0) {
          updatedProcess.images.sort((a, b) => {
            const aName = a.split('/').pop();
            const bName = b.split('/').pop();
            return aName.localeCompare(bName, undefined, {numeric: true});
          });
        }
        
        this.process = updatedProcess;
        
        // Clear refresh interval if no longer needed
        if (updatedProcess.status !== 'running' && updatedProcess.status !== 'pending') {
          clearInterval(this.refreshInterval);
          this.refreshInterval = null;
        }
      } catch (err) {
        console.error('Error refreshing process:', err);
        // Don't change the UI on refresh error
      }
    },
    
    getStatusColor() {
      const status = this.process?.status?.toLowerCase();
      if (status === 'completed') return 'bg-green-100 text-green-800';
      if (status === 'running') return 'bg-blue-100 text-blue-800';
      if (status === 'pending') return 'bg-yellow-100 text-yellow-800';
      if (status === 'failed') return 'bg-red-100 text-red-800';
      return 'bg-gray-100 text-gray-800';
    },
    deleteChap() {
     fetch('${HOST_URL}/api/process/' + this.processId, {
             method: 'DELETE'
         })
         .then(() => {
             alert('Process deleted successfully');
         })
         .catch((err) => {
             console.error('Error deleting process:', err);
             this.error = 'Failed to delete process';
         });
    },
    
    resetView() {
      this.process = null;
      this.error = null;
      this.inputVisible = true;
      this.fullscreenMode = false;
      
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
        this.refreshInterval = null;
      }
    },
    
    toggleAutoRefresh() {
      this.autoRefresh = !this.autoRefresh;
      if (this.autoRefresh && 
          (this.process?.status === 'running' || this.process?.status === 'pending')) {
        this.refreshInterval = setInterval(() => this.refreshProcess(), 5000);
      } else if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
        this.refreshInterval = null;
      }
    },
    
    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      if (this.darkMode) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    },
    
    toggleControls() {
      this.showControls = !this.showControls;
    },
    
    toggleFullscreen() {
      this.fullscreenMode = !this.fullscreenMode;
      if (this.fullscreenMode) {
        document.body.classList.add('fullscreen-mode');
      } else {
        document.body.classList.remove('fullscreen-mode');
      }
    },
    
    scrollToTop() {
      window.scrollTo({top: 0, behavior: 'smooth'});
    },
    
    scrollToBottom() {
      window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'});
    },
    
    scrollToImage(index) {
      if (this.process?.images && index >= 0 && index < this.process.images.length) {
        const images = document.querySelectorAll('.reader-> div');
        if (images[index]) {
          images[index].scrollIntoView({behavior: 'smooth'});
          this.currentImageIndex = index;
        }
      }
    },
    
    nextImage() {
      if (this.process?.images && this.currentImageIndex < this.process.images.length - 1) {
        this.scrollToImage(this.currentImageIndex + 1);
      }
    },
    
    prevImage() {
      if (this.process?.images && this.currentImageIndex > 0) {
        this.scrollToImage(this.currentImageIndex - 1);
      }
    },
    
    handleTapArea(area) {
      if (!this.fullscreenMode) return;
      
      if (area === 'left') {
        this.prevImage();
      } else if (area === 'right') {
        this.nextImage();
      } else {
        this.toggleFullscreen();
      }
    },
    
    handleKeydown(e) {
      if (e.target.tagName === 'INPUT') return; // Don't handle shortcuts when typing in input
      
      // Toggle controls with 'c'
      if (e.key === 'c') this.toggleControls();
      
      // Toggle dark mode with 'd'
      if (e.key === 'd') this.toggleDarkMode();
      
      // Toggle fullscreen with 'f'
      if (e.key === 'f') this.toggleFullscreen();
      
      // Navigation with arrows
      if (e.key === 'ArrowRight' || e.key === ' ') this.nextImage();
      if (e.key === 'ArrowLeft') this.prevImage();
      
      // Top and bottom with Home and End
      if (e.key === 'Home') this.scrollToTop();
      if (e.key === 'End') this.scrollToBottom();
    },
    
    // Check for process ID in URL query parameters
    checkUrlParams() {
      const urlParams = new URLSearchParams(window.location.search);
      const idParam = urlParams.get('id');
      
      if (idParam) {
        this.processId = idParam;
        this.fetchProcess(); // Automatically fetch process when ID is in URL
      }
    },
    
    mounted() {
      // Check URL parameters on page load
      setTimeout(() => this.checkUrlParams(), 1000);
      
      // Listen for keyboard shortcuts
      window.addEventListener('keydown', this.handleKeydown);
      
      // Handle visibility changes to pause/resume auto-refresh
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
          }
        } else if (this.autoRefresh && this.process &&
                 (this.process.status === 'running' || this.process.status === 'pending')) {
          this.refreshInterval = setInterval(() => this.refreshProcess(), 5000);
        }
      });
    }
  }" v-cloak>
  
    <!-- Fullscreen Mode Tap Areas -->
    <div v-if="fullscreenMode && process?.images?.length > 0" class="fullscreen-tap-area fullscreen-tap-left" @click="handleTapArea('left')"></div>
    <div v-if="fullscreenMode && process?.images?.length > 0" class="fullscreen-tap-area fullscreen-tap-center" @click="handleTapArea('center')"></div>
    <div v-if="fullscreenMode && process?.images?.length > 0" class="fullscreen-tap-area fullscreen-tap-right" @click="handleTapArea('right')"></div>
  
    <!-- Fixed Controls -->
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 floating-controls" v-if="showControls && process && !fullscreenMode">
      <button @click="scrollToTop" class="bg-indigo-500 hover:bg-indigo-600 text-white p-2 rounded-full shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
      
      <button @click="toggleFullscreen" class="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-full shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
        </svg>
      </button>
      
      <button @click="toggleControls" class="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-full shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
      
    
    </div>
  
    <!-- Reader Controls Panel -->
    <div class="sticky top-0 z-40 bg-white shadow-md transition-all duration-300 control-panel" v-if="process && !inputVisible" :class="{'py-1': !showControls, 'py-3': showControls}">
      <div class="mx-auto px-4" :class="{'opacity-0 h-0 overflow-hidden': !showControls, 'opacity-100': showControls}">
        <div class="flex flex-wrap items-center justify-between gap-4 reader-header">
          <div>
            <h1 class="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span @click="toggleControls" class="cursor-pointer hover:text-indigo-600">
                Process: {{ processId }}
              </span>
              
              <span v-if="process" :class="getStatusColor()" class="text-xs px-2 py-1 rounded-full">
                {{ process.status }}
              </span>
            </h1>
          </div>
          
          <div class="flex flex-wrap items-center gap-3">
        
            <button @click="toggleFullscreen" class="border border-purple-200 bg-purple-100 text-purple-700 text-sm py-1 px-3 rounded transition">
              Fullscreen
            </button>
            
            <a 
            href="/"
            class="bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm py-1 px-3 rounded transition">
              New
            </a>
            <button @click="deleteChap" class="bg-red-200 hover:bg-red-300 text-red-800 text-sm py-1 px-3 rounded transition">
              Delete
            </button>
          </div>
        </div>
      </div>
      
      <!-- Mini Control -->
      <div v-if="!showControls" class=" mx-auto px-4 flex justify-between items-center mini-control">
        <button @click="toggleControls" class="text-gray-500 hover:text-indigo-600">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
        
        <div class="flex items-center gap-2">
          <div v-if="process?.images" class="text-xs text-gray-500">
            {{ currentImageIndex + 1 }}/{{ process.images.length }}
          </div>
          
          <div v-if="process" :class="getStatusColor()" class="text-xs px-2 py-1 rounded-full">
            {{ process.status }}
          </div>
          
          <button @click="toggleFullscreen" class="text-xs bg-purple-100 text-purple-700 py-1 px-2 rounded">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
    
    <div class="mx-auto pt-4 pb-20 bottom-safe-area">
      <!-- Input Form -->
      <div v-if="inputVisible" class="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md mb-8">
        <h1 class="text-2xl font-bold text-gray-800 mb-6">Process Image Gallery</h1>
        
        <div class="mb-4">
          <label for="processId" class="block text-sm font-medium text-gray-700 mb-1">Process ID</label>
          <div class="flex gap-2">
            <input 
              type="text" 
              id="processId" 
              v-model="processId" 
              @keyup.enter="fetchProcess"
              placeholder="Enter process ID" 
              class="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
            <button 
              @click="fetchProcess" 
              class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
              :disabled="loading"
            >
              <span v-if="!loading">Fetch</span>
              <span v-else class="flex items-center justify-center">
                <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
            </button>
          </div>
        </div>
        
        <!-- Error message -->
        <div v-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p>{{ error }}</p>
        </div>
      </div>
      
      <!-- Loading State -->
      <div v-if="loading && !inputVisible" class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
      
      <!-- Error State (when not in input mode) -->
      <div v-else-if="error && !inputVisible" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6">
        <p class="font-medium">Error:</p>
        <p>{{ error }}</p>
        <button @click="resetView" class="mt-3 bg-red-200 hover:bg-red-300 text-red-800 px-3 py-1 rounded text-sm">
          Try Again
        </button>
      </div>
      
      <!-- Content -->
      <div v-else-if="process && !inputVisible">
        <!-- Status Messages -->
        <div v-if="process.status === 'pending'" class="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <p class="text-yellow-800">Process is queued and waiting to start. Please wait...</p>
        </div>
        
        <div v-if="process.status === 'running'" class="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <p class="text-blue-800">Process is currently running. Images will appear here when ready. Remaining: {{ process.remaining }}</p>
        </div>
        
        <div v-if="process.status === 'failed'" class="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <p class="text-red-800">Process failed. No images were generated.</p>
        </div>
        
        <!-- Image Navigator (Mobile Optimized) -->
        
        <!-- Image Reader (Mobile Optimized) -->
        <div v-if="process.images && process.images.length > 0" class="reader-container">
          <div v-for="(image, index) in process.images" :key="index" class="mb-6 bg-white rounded-lg shadow-md overflow-hidden">
            <img :src="image" :alt="'Image ' + (index + 1)" class="w-full h-auto" loading="lazy" 
                 @load="$el.previousSibling?.classList?.add('hidden')"
                 @error="$el.previousSibling?.classList?.add('hidden')">
          </div>
        </div>
        
        <!-- No Images -->
        <div v-else-if="process.status === 'completed'" class="bg-white rounded-lg shadow p-6 text-center max-w-lg mx-auto">
          <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          <p class="text-gray-600">Process completed but no images were found.</p>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Add this script tag to make the URL parameter feature work immediately -->
  <script src="https://unpkg.com/petite-vue"></script>
  <script>
      const urlParams = new URLSearchParams(window.location.search);
      const idParam = urlParams.get('id');
       PetiteVue.createApp({
        processId: idParam || ''
       }).mount()
  </script>
</body>
</html>
  `;
}
