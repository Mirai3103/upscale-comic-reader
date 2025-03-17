import { html } from "hono/html";
import { HOST_URL } from "../config/env";

export function combinedTemplate() {
	return html`
		<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8" />
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1.0"
				/>
				<title>URL Crawler & Processes</title>
				<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
				<script src="https://unpkg.com/petite-vue" defer init></script>
				<style>
					[v-cloak] {
						display: none;
					}

					/* Animation for loading */
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

					.dark-mode .bg-gray-100,
					.dark-mode .hover:bg-gray-100:hover {
						background-color: #1a1a1a !important;
					}

					.dark-mode .bg-gray-50 {
						background-color: #161616 !important;
					}

					.dark-mode thead {
						background-color: #1a1a1a;
					}

					.dark-mode .shadow {
						box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.4);
					}

					/* Status badges */
					.status-badge {
						display: inline-block;
						padding: 0.25rem 0.75rem;
						border-radius: 9999px;
						font-size: 0.75rem;
						font-weight: 500;
					}

					.status-completed {
						background-color: #def7ec;
						color: #046c4e;
					}

					.status-running {
						background-color: #e1effe;
						color: #1e429f;
					}

					.status-pending {
						background-color: #fef3c7;
						color: #92400e;
					}

					.status-failed {
						background-color: #fee2e2;
						color: #b91c1c;
					}

					.dark-mode .status-completed {
						background-color: rgba(6, 78, 59, 0.5);
						color: #34d399;
					}

					.dark-mode .status-running {
						background-color: rgba(30, 58, 138, 0.5);
						color: #60a5fa;
					}

					.dark-mode .status-pending {
						background-color: rgba(120, 53, 15, 0.5);
						color: #fbbf24;
					}

					.dark-mode .status-failed {
						background-color: rgba(153, 27, 27, 0.5);
						color: #f87171;
					}

					/* Responsive table styles */
					@media (max-width: 640px) {
						.responsive-table thead {
							display: none;
						}

						.responsive-table tbody tr {
							display: block;
							margin-bottom: 1rem;
							border: 1px solid #e2e8f0;
							border-radius: 0.5rem;
							padding: 0.5rem;
							box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
						}

						.responsive-table tbody td {
							display: flex;
							justify-content: space-between;
							padding: 0.5rem;
							text-align: right;
							border-bottom: 1px solid #e2e8f0;
						}

						.responsive-table tbody td:last-child {
							border-bottom: none;
						}

						.responsive-table tbody td:before {
							content: attr(data-label);
							font-weight: 600;
							text-align: left;
						}

						.responsive-table td.row-actions {
							display: flex;
							justify-content: flex-end;
							gap: 0.5rem;
						}
					}

					/* Bottom safe area for mobile devices */
					.bottom-safe-area {
						padding-bottom: env(safe-area-inset-bottom, 20px);
					}
				</style>
			</head>
			<body
				class="bg-gray-100 min-h-screen"
				@vue:mounted="mounted"
				v-scope="{ 
    // URL crawler variables
    url: '', 
    loading: false, 
    error: null,
    recentUrls: [],
    
    // Process list variables
    processes: [],
    loadingProcesses: true,
    processError: null,
    darkMode: false,
    searchQuery: '',
    selectedStatus: '',
    sortField: 'id',
    sortDirection: 'desc',
    confirmDelete: null,
    
    // URL crawler methods
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
        
        // Fetch processes after creating a new one
        this.fetchProcesses();
        
        // Clear the input and reset loading state
        this.url = '';
        this.loading = false;
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
      
      // Limit to 5 most recent
      recentUrls = recentUrls.slice(0, 5);
      
      // Save back to local storage
      localStorage.setItem('recentUrls', JSON.stringify(recentUrls));
      
      // Update the recentUrls array
      this.recentUrls = recentUrls;
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
    
    // Process list methods
    async fetchProcesses() {
      this.loadingProcesses = true;
      this.processError = null;
      
      try {
        const response = await fetch('${HOST_URL}/api/process');
        if (!response.ok) {
          throw new Error('Failed to fetch processes');
        }
        this.processes = await response.json();
        this.applySort(); // Apply initial sorting
      } catch (err) {
        this.processError = 'Error loading processes: ' + err.message;
        this.processes = [];
      } finally {
        this.loadingProcesses = false;
      }
    },
    
    deleteProcess(id) {
      // Set the ID for confirmation
      this.confirmDelete = id;
    },
    
    async confirmDeleteProcess() {
      if (!this.confirmDelete) return;
      
      try {
        const response = await fetch('${HOST_URL}/api/process/' + this.confirmDelete, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete process');
        }
        
        // Remove from the list
        this.processes = this.processes.filter(p => p.id !== this.confirmDelete);
        this.confirmDelete = null;
      } catch (err) {
        this.processError = 'Error deleting process: ' + err.message;
      }
    },
    
    cancelDelete() {
      this.confirmDelete = null;
    },
    
    goToGallery(id) {
      const href= '${HOST_URL}/api/gallery?id=' + id;
        window.open(href, '_blank');
    },
    
    getStatusClass(status) {
      status = status.toLowerCase();
      if (status === 'completed') return 'status-completed';
      if (status === 'running') return 'status-running';
      if (status === 'pending') return 'status-pending';
      if (status === 'failed') return 'status-failed';
      return 'bg-gray-100 text-gray-800';
    },
    
    // Filtering methods
    get filteredProcesses() {
      return this.processes.filter(process => {
        // Text search
        const searchMatch = !this.searchQuery || 
          process.id.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          (process.title && process.title.toLowerCase().includes(this.searchQuery.toLowerCase()));
          
        // Status filter
        const statusMatch = !this.selectedStatus || 
          process.status.toLowerCase() === this.selectedStatus.toLowerCase();
          
        return searchMatch && statusMatch;
      });
    },
    
    // Sorting methods
    sortBy(field) {
      if (this.sortField === field) {
        // Toggle direction if clicking the same field
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortField = field;
        this.sortDirection = 'asc';
      }
      
      this.applySort();
    },
    
    applySort() {
      this.processes.sort((a, b) => {
        let valueA = a[this.sortField] || '';
        let valueB = b[this.sortField] || '';
        
        // Handle string comparison
        if (typeof valueA === 'string') {
          valueA = valueA.toLowerCase();
          valueB = valueB.toLowerCase();
        }
        
        if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
        if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    },
    
    getSortIndicator(field) {
      if (this.sortField !== field) return '';
      return this.sortDirection === 'asc' ? '↑' : '↓';
    },
    
    // Format date (assuming ID might contain timestamp)
    formatDate(id) {
      try {
        // This is just an example assuming the ID might contain a timestamp
        // Adjust based on your actual ID format
        const dateStr = id.split('-')[0];
        return new Date(parseInt(dateStr)).toLocaleString();
      } catch (e) {
        return 'Unknown';
      }
    },
    
    // Truncate long strings
    truncate(str, length = 30) {
      if (!str) return '';
      return str.length > length ? str.substring(0, length) + '...' : str;
    },
    
    refreshList() {
      this.fetchProcesses();
    },
    
    // Shared methods
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
      this.fetchProcesses();
      
      // Check if URL is passed as query parameter
      const urlParams = new URLSearchParams(window.location.search);
      const urlParam = urlParams.get('url');
      
      if (urlParam) {
        this.url = decodeURIComponent(urlParam);
      }
    }
  }"
				v-cloak
			>
				<!-- Delete Confirmation Modal -->
				<div
					v-if="confirmDelete"
					class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
				>
					<div
						class="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full"
					>
						<h3 class="text-lg font-medium text-gray-900 mb-4">
							Confirm Deletion
						</h3>
						<p class="text-gray-600 mb-6">
							Are you sure you want to delete this process? This
							action cannot be undone.
						</p>
						<div class="flex justify-end gap-3">
							<button
								@click="cancelDelete"
								class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-800"
							>
								Cancel
							</button>
							<button
								@click="confirmDeleteProcess"
								class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white"
							>
								Delete
							</button>
						</div>
					</div>
				</div>

				<div class="container mx-auto px-4 py-8 bottom-safe-area">
					<!-- Header with dark mode toggle -->
					<div class="flex justify-between items-center mb-6">
						<h1 class="text-2xl font-bold text-gray-800">
							URL Crawler & Processes
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

					<!-- URL Crawler Section -->
					<div
						class="bg-white rounded-xl shadow-md overflow-hidden mb-8"
					>
						<div class="p-6">
							<h2
								class="text-xl font-semibold text-gray-800 mb-4"
							>
								Crawl URL
							</h2>

							<div class="mb-4">
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
								class="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded"
							>
								<p class="font-medium">Error</p>
								<p>{{ error }}</p>
							</div>

							<!-- Recent URLs -->
							<div v-if="recentUrls.length > 0" class="mt-4">
								<div
									class="flex justify-between items-center mb-2"
								>
									<h3
										class="text-md font-medium text-gray-800"
									>
										Recent URLs
									</h3>
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
											class="p-2 hover:bg-gray-100 transition"
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

					<!-- Process List Section -->
					<div
						class="bg-white rounded-xl shadow-md overflow-hidden mb-6"
					>
						<div class="p-6">
							<div class="flex justify-between items-center mb-6">
								<h2 class="text-xl font-semibold text-gray-800">
									Process List
								</h2>

								<button
									@click="refreshList"
									class="text-indigo-600 hover:text-indigo-800"
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

							<!-- Search and filter bar -->
							<div class="flex flex-col md:flex-row gap-4 mb-6">
								<div class="flex-1">
									<div class="relative">
										<input
											type="text"
											v-model="searchQuery"
											placeholder="Search by ID or title..."
											class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
										/>
										<div
											class="absolute left-3 top-2.5 text-gray-400"
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
													d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
												/>
											</svg>
										</div>
									</div>
								</div>

								<div class="w-full md:w-48">
									<select
										v-model="selectedStatus"
										class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
									>
										<option value="">All Statuses</option>
										<option value="completed">
											Completed
										</option>
										<option value="running">Running</option>
										<option value="pending">Pending</option>
										<option value="failed">Failed</option>
									</select>
								</div>
							</div>

							<!-- Loading state -->
							<div
								v-if="loadingProcesses"
								class="flex justify-center items-center py-16"
							>
								<svg
									class="animate-spin h-8 w-8 text-indigo-600"
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
							</div>

							<!-- Error message -->
							<div
								v-else-if="processError"
								class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6"
							>
								<p class="font-medium">Error</p>
								<p>{{ processError }}</p>
								<button
									@click="fetchProcesses"
									class="mt-2 text-sm px-3 py-1 bg-red-200 rounded hover:bg-red-300"
								>
									Try Again
								</button>
							</div>

							<!-- Empty state -->
							<div
								v-else-if="processes.length === 0"
								class="text-center py-12"
							>
								<svg
									class="mx-auto h-12 w-12 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
									></path>
								</svg>
								<h3
									class="mt-2 text-lg font-medium text-gray-900"
								>
									No processes found
								</h3>
								<p class="mt-1 text-gray-500">
									Start by entering a URL above to create a
									new process.
								</p>
							</div>

							<!-- No results after filtering -->
							<div
								v-else-if="filteredProcesses.length === 0"
								class="text-center py-12"
							>
								<svg
									class="mx-auto h-12 w-12 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
									></path>
								</svg>
								<h3
									class="mt-2 text-lg font-medium text-gray-900"
								>
									No matching processes
								</h3>
								<p class="mt-1 text-gray-500">
									Try adjusting your search or filter
									criteria.
								</p>
								<button
									@click="searchQuery = ''; selectedStatus = ''"
									class="mt-4 text-indigo-600 hover:text-indigo-800"
								>
									Clear filters
								</button>
							</div>

							<!-- Table view -->
							<div v-else class="overflow-x-auto">
								<table class="min-w-full responsive-table">
									<thead class="bg-gray-50">
										<tr>
											<th
												class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
												@click="sortBy('id')"
											>
												ID {{ getSortIndicator('id') }}
											</th>
											<th
												class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
												@click="sortBy('title')"
											>
												Title {{
												getSortIndicator('title') }}
											</th>
											<th
												class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
												@click="sortBy('status')"
											>
												Status {{
												getSortIndicator('status') }}
											</th>
											<th
												class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
											>
												Images
											</th>
											<th
												class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
											>
												Actions
											</th>
										</tr>
									</thead>
									<tbody
										class="bg-white divide-y divide-gray-200"
									>
										<tr
											v-for="process in filteredProcesses"
											:key="process.id"
											class="hover:bg-gray-100 cursor-pointer"
											@click="goToGallery(process.id)"
										>
											<td
												class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
												data-label="ID"
											>
												{{ truncate(process.id, 15) }}
											</td>
											<td
												class="px-4 py-4 text-sm text-gray-600"
												data-label="Title"
											>
												{{ process.title || 'Untitled'
												}}
											</td>
											<td
												class="px-4 py-4 whitespace-nowrap text-sm text-gray-500"
												data-label="Status"
											>
												<span
													:class="getStatusClass(process.status)"
													class="status-badge"
												>
													{{ process.status }}
												</span>
											</td>
											<td
												class="px-4 py-4 whitespace-nowrap text-sm text-gray-500"
												data-label="Images"
											>
												{{ process.images ?
												(Array.isArray(process.images) ?
												process.images.length : '1') :
												'0' }}
											</td>
											<td
												class="px-4 py-4 whitespace-nowrap text-right text-sm font-medium row-actions"
												@click.stop
											>
												<button
													@click="goToGallery(process.id)"
													class="text-indigo-600 hover:text-indigo-900 mr-4"
												>
													View
												</button>
												<button
													@click="deleteProcess(process.id)"
													class="text-red-600 hover:text-red-900"
												>
													Delete
												</button>
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
					</div>

					<footer class="text-center text-gray-500 text-sm">
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
