import { html } from "hono/html";
import { HOST_URL } from "../config/env";

export function crawlTemplate() {
	return html`
		<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8" />
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1.0"
				/>
				<title>Crawl URL</title>
				<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
				<script src="https://unpkg.com/petite-vue" defer init></script>
				<style>
					[v-cloak] {
						display: none;
					}

					/* Animation for loading button */
					@keyframes spin {
						from {
							transform: rotate(0deg);
						}
						to {
							transform: rotate(360deg);
						}
					}

					.animate-spin {
						animation: spin 1s linear infinite;
					}

					/* Dark mode support */
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
						background-color: #1a1a1a !important;
					}

					/* Bottom safe area for mobile devices */
					.bottom-safe-area {
						padding-bottom: env(safe-area-inset-bottom, 20px);
					}
				</style>
			</head>
			<body
				class="bg-gray-100 min-h-screen"
				v-scope="{ 
    url: '', 
    loading: false, 
    error: null,
    darkMode: false,
    recentUrls: [],
    
    async submitUrl() {
      if (!this.url.trim()) {
        this.error = 'Please enter a URL';
        return;
      }
      
      // Check if URL includes http:// or https://
      if (!this.url.startsWith('http://') && !this.url.startsWith('https://')) {
        this.url = 'https://' + this.url;
      }
      
      this.loading = true;
      this.error = null;
      
      try {
        const response = await fetch('${HOST_URL}/api/process/crawl', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: this.url
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to process the URL');
        }
        
        const data = await response.json();
        
        // Save to recent URLs in local storage
        this.saveToRecent(this.url);
        
        // Redirect to gallery page with the ID
        window.location.href = '${HOST_URL}/api/gallery?id=' + data.id;
      } catch (err) {
        this.error = err.message || 'An error occurred while processing the URL';
        this.loading = false;
      }
    },
    
    saveToRecent(url) {
      // Get existing URLs from local storage
      const storedUrls = localStorage.getItem('recentUrls');
      let recentUrls = storedUrls ? JSON.parse(storedUrls) : [];
      
      // Add current URL to the beginning 
      recentUrls.unshift({
        url: url,
        timestamp: new Date().toISOString()
      });
      
      // Limit to 10 most recent
      recentUrls = recentUrls.slice(0, 10);
      
      // Save back to local storage
      localStorage.setItem('recentUrls', JSON.stringify(recentUrls));
    },
    
    getRecentUrls() {
      const storedUrls = localStorage.getItem('recentUrls');
      this.recentUrls = storedUrls ? JSON.parse(storedUrls) : [];
    },
    
    loadUrl(url) {
      this.url = url;
      this.submitUrl();
    },
    
    clearRecentUrls() {
      localStorage.removeItem('recentUrls');
      this.recentUrls = [];
    },
    
    formatTimestamp(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleString();
    },
    
    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      if (this.darkMode) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'true');
      } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'false');
      }
    },
    
    checkDarkMode() {
      const savedMode = localStorage.getItem('darkMode');
      if (savedMode === 'true') {
        this.darkMode = true;
        document.body.classList.add('dark-mode');
      }
    },
    
    mounted() {
      this.checkDarkMode();
      this.getRecentUrls();
      
      // Check if URL is passed as query parameter
      const urlParams = new URLSearchParams(window.location.search);
      const urlParam = urlParams.get('url');
      
      if (urlParam) {
        this.url = decodeURIComponent(urlParam);
        // Optional: Auto-submit if URL is provided
        // this.submitUrl();
      }
    }
  }"
				v-cloak
			>
				<div class="container mx-auto px-4 py-8 bottom-safe-area">
					<div
						class="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden"
					>
						<div class="p-6">
							<div class="flex justify-between items-center mb-6">
								<h1 class="text-2xl font-bold text-gray-800">
									URL Crawler
								</h1>

								<button
									@click="toggleDarkMode"
									class="text-gray-500 hover:text-gray-700"
								>
									<svg
										v-if="!darkMode"
										xmlns="http://www.w3.org/2000/svg"
										class="h-6 w-6"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
										/>
									</svg>
									<svg
										v-else
										xmlns="http://www.w3.org/2000/svg"
										class="h-6 w-6"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
										/>
									</svg>
								</button>
							</div>

							<div class="mb-6">
								<p class="text-gray-600 mb-2">
									Enter the URL of the content you'd like to
									crawl:
								</p>

								<div class="flex gap-2">
									<input
										type="text"
										v-model="url"
										@keyup.enter="submitUrl"
										placeholder="https://example.com/page"
										class="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
									/>
									<button
										@click="submitUrl"
										class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
										:disabled="loading"
									>
										<span v-if="!loading">Submit</span>
										<span
											v-else
											class="flex items-center justify-center"
										>
											<svg
												class="animate-spin h-5 w-5 mr-2"
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
											>
												<circle
													class="opacity-25"
													cx="12"
													cy="12"
													r="10"
													stroke="currentColor"
													stroke-width="4"
												></circle>
												<path
													class="opacity-75"
													fill="currentColor"
													d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
												></path>
											</svg>
											Processing...
										</span>
									</button>
								</div>
							</div>

							<!-- Error message -->
							<div
								v-if="error"
								class="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded"
							>
								<p class="font-medium">Error</p>
								<p>{{ error }}</p>
							</div>

							<!-- Info message -->
							<div
								class="mb-6 bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 rounded"
							>
								<p class="font-medium">Information</p>
								<p>
									This tool will crawl the provided URL and
									process the content. Once completed, you'll
									be redirected to the gallery where you can
									view the results.
								</p>
							</div>

							<!-- Recent URLs -->
							<div v-if="recentUrls.length > 0" class="mt-8">
								<div
									class="flex justify-between items-center mb-3"
								>
									<h2
										class="text-lg font-medium text-gray-800"
									>
										Recent URLs
									</h2>
									<button
										@click="clearRecentUrls"
										class="text-sm text-red-600 hover:text-red-800"
									>
										Clear History
									</button>
								</div>

								<div
									class="bg-gray-50 rounded-lg border border-gray-200"
								>
									<ul class="divide-y divide-gray-200">
										<li
											v-for="(item, index) in recentUrls"
											:key="index"
											class="p-3 hover:bg-gray-100 transition"
										>
											<div
												class="flex justify-between items-center"
											>
												<div class="flex-1 truncate">
													<button
														@click="loadUrl(item.url)"
														class="text-indigo-600 hover:text-indigo-800 truncate"
													>
														{{ item.url }}
													</button>
													<p
														class="text-xs text-gray-500"
													>
														{{
														formatTimestamp(item.timestamp)
														}}
													</p>
												</div>
												<button
													@click="loadUrl(item.url)"
													class="ml-2 bg-indigo-100 text-indigo-700 p-1 rounded hover:bg-indigo-200"
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														class="h-5 w-5"
														fill="none"
														viewBox="0 0 24 24"
														stroke="currentColor"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
														/>
													</svg>
												</button>
											</div>
										</li>
									</ul>
								</div>
							</div>
						</div>
					</div>

					<footer class="mt-8 text-center text-gray-500 text-sm">
						<p>
							<a
								href="${HOST_URL}/gallery"
								class="text-indigo-600 hover:text-indigo-800"
								>Go to Gallery</a
							>
						</p>
					</footer>
				</div>
			</body>
		</html>
	`;
}
