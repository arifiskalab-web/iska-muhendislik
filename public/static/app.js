// Global state
let currentUser = null;
let authToken = null;
let currentView = 'login';
let projects = [];
let selectedProject = null;

// Turkish cities and districts
const ilIlceData = {
  'İstanbul': ['Adalar', 'Arnavutköy', 'Ataşehir', 'Avcılar', 'Bağcılar', 'Bahçelievler', 'Bakırköy', 'Başakşehir', 'Bayrampaşa', 'Beşiktaş', 'Beykoz', 'Beylikdüzü', 'Beyoğlu', 'Büyükçekmece', 'Çatalca', 'Çekmeköy', 'Esenler', 'Esenyurt', 'Eyüpsultan', 'Fatih', 'Gaziosmanpaşa', 'Güngören', 'Kadıköy', 'Kağıthane', 'Kartal', 'Küçükçekmece', 'Maltepe', 'Pendik', 'Sancaktepe', 'Sarıyer', 'Silivri', 'Sultanbeyli', 'Sultangazi', 'Şile', 'Şişli', 'Tuzla', 'Ümraniye', 'Üsküdar', 'Zeytinburnu'],
  'Ankara': ['Akyurt', 'Altındağ', 'Ayaş', 'Bala', 'Beypazarı', 'Çamlıdere', 'Çankaya', 'Çubuk', 'Elmadağ', 'Etimesgut', 'Evren', 'Gölbaşı', 'Güdül', 'Haymana', 'Kahramankazan', 'Kalecik', 'Keçiören', 'Kızılcahamam', 'Mamak', 'Nallıhan', 'Polatlı', 'Pursaklar', 'Sincan', 'Şereflikoçhisar', 'Yenimahalle'],
  'İzmir': ['Aliağa', 'Balçova', 'Bayındır', 'Bayraklı', 'Bergama', 'Beydağ', 'Bornova', 'Buca', 'Çeşme', 'Çiğli', 'Dikili', 'Foça', 'Gaziemir', 'Güzelbahçe', 'Karabağlar', 'Karaburun', 'Karşıyaka', 'Kemalpaşa', 'Kınık', 'Kiraz', 'Konak', 'Menderes', 'Menemen', 'Narlıdere', 'Ödemiş', 'Seferihisar', 'Selçuk', 'Tire', 'Torbalı', 'Urla']
};

// API utilities
const api = {
  baseURL: '/api',
  
  async call(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    try {
      const response = await fetch(this.baseURL + endpoint, {
        method: options.method || 'GET',
        headers,
        body: options.data ? JSON.stringify(options.data) : undefined
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      if (error.response?.status === 401) {
        logout();
      }
      throw error;
    }
  },
  
  login: (username, password) => api.call('/auth/login', {
    method: 'POST',
    data: { username, password }
  }),
  
  getMe: () => api.call('/auth/me'),
  
  getProjects: () => api.call('/projects'),
  
  getProject: (id) => api.call(`/projects/${id}`),
  
  createProject: (data) => api.call('/projects', {
    method: 'POST',
    data
  }),
  
  updateProject: (id, data) => api.call(`/projects/${id}`, {
    method: 'PUT',
    data
  }),
  
  getFieldTeams: () => api.call('/users/field-teams'),
  
  getAgenda: (startDate, endDate) => api.call(`/agenda?start_date=${startDate}&end_date=${endDate}`),
  
  getFieldData: (type, projectId) => api.call(`/field/${type}/${projectId}`),
  
  createFieldData: (type, projectId, data) => api.call(`/field/${type}/${projectId}`, {
    method: 'POST',
    data
  }),
  
  getNotifications: () => api.call('/notifications'),
  
  markNotificationRead: (id) => api.call(`/notifications/${id}/read`, {
    method: 'PUT'
  }),
  
  // Rölöve APIs
  getRoloove: (projectId) => api.call(`/roloove/${projectId}`),
  
  createRoloove: (projectId, data) => api.call(`/roloove/${projectId}`, {
    method: 'POST',
    data
  }),
  
  updateKolon: (kolonId, data) => api.call(`/roloove/kolon/${kolonId}`, {
    method: 'PUT',
    data
  }),
  
  getReporters: () => api.call('/users/reporters'),
  
  // Photo APIs
  uploadPhoto: (data) => api.call('/photos', {
    method: 'POST',
    data
  }),
  
  getPhotos: (projectId, elemanKodu) => api.call(`/photos/${projectId}/${elemanKodu}`),
  
  getAllPhotos: (projectId) => api.call(`/photos/project/${projectId}`),
  
  deletePhoto: (id) => api.call(`/photos/${id}`, {
    method: 'DELETE'
  })
};

// Initialize app
async function init() {
  const token = localStorage.getItem('authToken');
  if (token) {
    authToken = token;
    try {
      const { user } = await api.getMe();
      currentUser = user;
      loadDashboard();
    } catch (error) {
      showLogin();
    }
  } else {
    showLogin();
  }
}

// Authentication
async function login(username, password) {
  try {
    const response = await api.login(username, password);
    currentUser = response.user;
    authToken = response.token;
    localStorage.setItem('authToken', authToken);
    loadDashboard();
  } catch (error) {
    alert('Giriş başarısız! Kullanıcı adı veya şifre hatalı.');
  }
}

function logout() {
  currentUser = null;
  authToken = null;
  localStorage.removeItem('authToken');
  showLogin();
}

// Views
function showLogin() {
  currentView = 'login';
  document.getElementById('app').innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700">
      <div class="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
        <div class="text-center mb-8">
          <i class="fas fa-building text-5xl text-blue-600 mb-4"></i>
          <h1 class="text-2xl font-bold text-gray-800">Yapı Risk Analizi</h1>
          <p class="text-gray-600">Yönetim Sistemi</p>
        </div>
        
        <form id="loginForm" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-user mr-2"></i>Kullanıcı Adı
            </label>
            <input 
              type="text" 
              id="username" 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-lock mr-2"></i>Şifre
            </label>
            <input 
              type="password" 
              id="password" 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <button 
            type="submit"
            class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-200 font-semibold"
          >
            <i class="fas fa-sign-in-alt mr-2"></i>Giriş Yap
          </button>
        </form>
        
        <div class="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-gray-700">
          <p class="font-semibold mb-2">Test Kullanıcıları:</p>
          <p>Koordinatör: <code class="bg-white px-2 py-1 rounded">koordinator / koord123</code></p>
          <p>Saha: <code class="bg-white px-2 py-1 rounded">ozkan / ozkan123</code></p>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    await login(username, password);
  });
}

async function loadDashboard() {
  // Load projects
  const { projects: projectsList } = await api.getProjects();
  projects = projectsList;
  
  // Show dashboard based on role
  if (currentUser.role === 'coordinator') {
    showCoordinatorDashboard();
  } else if (currentUser.role === 'field_team') {
    showFieldTeamDashboard();
  } else if (currentUser.role === 'lab') {
    showLabDashboard();
  } else if (currentUser.role === 'reporter') {
    showReporterDashboard();
  } else if (currentUser.role === 'accounting') {
    showAccountingDashboard();
  } else {
    showGenericDashboard();
  }
}

function showCoordinatorDashboard() {
  currentView = 'coordinator';
  
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="min-h-screen bg-gray-100">
      <!-- Header -->
      <div class="bg-blue-600 text-white p-4 shadow-lg">
        <div class="container mx-auto flex justify-between items-center">
          <div class="flex items-center">
            <i class="fas fa-building text-2xl mr-3"></i>
            <div>
              <h1 class="text-xl font-bold">Yapı Risk Analizi Sistemi</h1>
              <p class="text-sm text-blue-200">${currentUser.full_name} - Koordinatör</p>
            </div>
          </div>
          <button onclick="logout()" class="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg transition">
            <i class="fas fa-sign-out-alt mr-2"></i>Çıkış
          </button>
        </div>
      </div>
      
      <!-- Navigation Tabs -->
      <div class="bg-white border-b">
        <div class="container mx-auto">
          <div class="flex space-x-1">
            <button onclick="showTab('binalar')" id="tab-binalar" class="px-6 py-3 font-semibold border-b-2 border-blue-600 text-blue-600">
              <i class="fas fa-building mr-2"></i>Binalar
            </button>
            <button onclick="showTab('ajanda')" id="tab-ajanda" class="px-6 py-3 font-semibold text-gray-600 hover:text-blue-600">
              <i class="fas fa-calendar mr-2"></i>Ajanda
            </button>
            <button onclick="showTab('yeni-is')" id="tab-yeni-is" class="px-6 py-3 font-semibold text-gray-600 hover:text-blue-600">
              <i class="fas fa-plus mr-2"></i>Yeni İş
            </button>
          </div>
        </div>
      </div>
      
      <!-- Content -->
      <div class="container mx-auto p-6">
        <div id="tab-content"></div>
      </div>
    </div>
  `;
  
  showTab('binalar');
}

function showFieldTeamDashboard() {
  currentView = 'field_team';
  
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="min-h-screen bg-gray-100">
      <!-- Header -->
      <div class="bg-green-600 text-white p-4 shadow-lg">
        <div class="container mx-auto flex justify-between items-center">
          <div class="flex items-center">
            <i class="fas fa-hard-hat text-2xl mr-3"></i>
            <div>
              <h1 class="text-xl font-bold">Saha Ekibi Paneli</h1>
              <p class="text-sm text-green-200">${currentUser.full_name}</p>
            </div>
          </div>
          <button onclick="logout()" class="bg-green-700 hover:bg-green-800 px-4 py-2 rounded-lg transition">
            <i class="fas fa-sign-out-alt mr-2"></i>Çıkış
          </button>
        </div>
      </div>
      
      <!-- Navigation Tabs -->
      <div class="bg-white border-b">
        <div class="container mx-auto">
          <div class="flex space-x-1 overflow-x-auto">
            <button onclick="showFieldTab('gorevler')" id="field-tab-gorevler" class="px-6 py-3 font-semibold border-b-2 border-green-600 text-green-600 whitespace-nowrap">
              <i class="fas fa-tasks mr-2"></i>Görevlerim
            </button>
            <button onclick="showFieldTab('roloove')" id="field-tab-roloove" class="px-6 py-3 font-semibold text-gray-600 hover:text-green-600 whitespace-nowrap">
              <i class="fas fa-drafting-compass mr-2"></i>Rölöve
            </button>
            <button onclick="showFieldTab('siyirma')" id="field-tab-siyirma" class="px-6 py-3 font-semibold text-gray-600 hover:text-green-600 whitespace-nowrap">
              <i class="fas fa-columns mr-2"></i>Sıyırma
            </button>
            <button onclick="showFieldTab('rontgen')" id="field-tab-rontgen" class="px-6 py-3 font-semibold text-gray-600 hover:text-green-600 whitespace-nowrap">
              <i class="fas fa-x-ray mr-2"></i>Röntgen
            </button>
            <button onclick="showFieldTab('karot')" id="field-tab-karot" class="px-6 py-3 font-semibold text-gray-600 hover:text-green-600 whitespace-nowrap">
              <i class="fas fa-vial mr-2"></i>Karot
            </button>
            <button onclick="showFieldTab('schmidt')" id="field-tab-schmidt" class="px-6 py-3 font-semibold text-gray-600 hover:text-green-600 whitespace-nowrap">
              <i class="fas fa-hammer mr-2"></i>Schmidt
            </button>
          </div>
        </div>
      </div>
      
      <!-- Content -->
      <div class="container mx-auto p-6">
        <div id="field-tab-content"></div>
      </div>
    </div>
  `;
  
  showFieldTab('gorevler');
}

function showLabDashboard() {
  currentView = 'lab';
  
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="min-h-screen bg-gray-100">
      <!-- Header -->
      <div class="bg-purple-600 text-white p-4 shadow-lg">
        <div class="container mx-auto flex justify-between items-center">
          <div class="flex items-center">
            <i class="fas fa-flask text-2xl mr-3"></i>
            <div>
              <h1 class="text-xl font-bold">Laboratuvar Paneli</h1>
              <p class="text-sm text-purple-200">${currentUser.full_name}</p>
            </div>
          </div>
          <button onclick="logout()" class="bg-purple-700 hover:bg-purple-800 px-4 py-2 rounded-lg transition">
            <i class="fas fa-sign-out-alt mr-2"></i>Çıkış
          </button>
        </div>
      </div>
      
      <!-- Navigation Tabs -->
      <div class="bg-white border-b">
        <div class="container mx-auto">
          <div class="flex space-x-1">
            <button onclick="showLabTab('karot')" id="lab-tab-karot" class="px-6 py-3 font-semibold border-b-2 border-purple-600 text-purple-600">
              <i class="fas fa-vial mr-2"></i>Karot Sonuçları
            </button>
            <button onclick="showLabTab('schmidt')" id="lab-tab-schmidt" class="px-6 py-3 font-semibold text-gray-600 hover:text-purple-600">
              <i class="fas fa-hammer mr-2"></i>Schmidt Sonuçları
            </button>
            <button onclick="showLabTab('isler')" id="lab-tab-isler" class="px-6 py-3 font-semibold text-gray-600 hover:text-purple-600">
              <i class="fas fa-list mr-2"></i>Tüm İşler
            </button>
          </div>
        </div>
      </div>
      
      <!-- Content -->
      <div class="container mx-auto p-6">
        <div id="lab-tab-content"></div>
      </div>
    </div>
  `;
  
  showLabTab('karot');
}

function showLabTab(tabName) {
  // Update tab styling
  document.querySelectorAll('[id^="lab-tab-"]').forEach(tab => {
    tab.classList.remove('border-purple-600', 'text-purple-600', 'border-b-2');
    tab.classList.add('text-gray-600');
  });
  document.getElementById(`lab-tab-${tabName}`).classList.add('border-purple-600', 'text-purple-600', 'border-b-2');
  document.getElementById(`lab-tab-${tabName}`).classList.remove('text-gray-600');
  
  const content = document.getElementById('lab-tab-content');
  
  if (tabName === 'karot') {
    showLabKarotTab(content);
  } else if (tabName === 'schmidt') {
    showLabSchmidtTab(content);
  } else if (tabName === 'isler') {
    showLabIslerTab(content);
  }
}

async function showLabKarotTab(content) {
  // Tüm karot verilerini getir
  const allKarotData = [];
  for (const project of projects) {
    const karotData = await api.getFieldData('karot', project.id);
    if (karotData.data && karotData.data.length > 0) {
      allKarotData.push({
        project: project,
        data: karotData.data
      });
    }
  }
  
  content.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">
          <i class="fas fa-vial text-purple-600 mr-2"></i>Karot Deney Sonuçları
        </h2>
        <div class="text-sm text-gray-600">
          <i class="fas fa-info-circle mr-1"></i>Toplam ${allKarotData.length} iş
        </div>
      </div>
      
      ${allKarotData.length > 0 ? allKarotData.map(item => `
        <div class="mb-6 border rounded-lg overflow-hidden">
          <div class="bg-purple-50 border-b p-4">
            <h3 class="font-bold text-lg">İş No: ${item.project.is_no}</h3>
            <p class="text-sm text-gray-600">${item.project.adres}</p>
            <p class="text-sm text-gray-600">Durum: <span class="${getDurumColor(item.project.durum)}">${item.project.durum}</span></p>
          </div>
          
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-100">
                <tr>
                  <th class="px-3 py-2 text-left">Karot No</th>
                  <th class="px-3 py-2 text-left">Eleman</th>
                  <th class="px-3 py-2 text-left">Kat</th>
                  <th class="px-3 py-2 text-left">Çap (mm)</th>
                  <th class="px-3 py-2 text-left">Boy (mm)</th>
                  <th class="px-3 py-2 text-left">Yük (kN)</th>
                  <th class="px-3 py-2 text-left font-bold">fb (MPa)</th>
                  <th class="px-3 py-2 text-left font-bold">fck (MPa)</th>
                  <th class="px-3 py-2 text-left">Test Tarihi</th>
                  <th class="px-3 py-2 text-left">Karot</th>
                </tr>
              </thead>
              <tbody>
                ${item.data.map(d => `
                  <tr class="border-t hover:bg-gray-50">
                    <td class="px-3 py-2 font-semibold">${d.karot_no || d.numune_no || '-'}</td>
                    <td class="px-3 py-2">${d.eleman_kodu || d.lokasyon || '-'}</td>
                    <td class="px-3 py-2">${d.kat || '-'}</td>
                    <td class="px-3 py-2">${d.cap_mm || d.cap || '-'}</td>
                    <td class="px-3 py-2">${d.boy_mm || d.uzunluk || '-'}</td>
                    <td class="px-3 py-2">${d.kirilma_yuku_kn || '-'}</td>
                    <td class="px-3 py-2 font-bold text-orange-600">${d.fb_mpa || d.basınc_dayanimi || '-'}</td>
                    <td class="px-3 py-2 font-bold text-red-600">${d.fck_mpa || '-'}</td>
                    <td class="px-3 py-2">${d.test_tarihi || '-'}</td>
                    <td class="px-3 py-2">
                      <span class="${d.karot_var === 'var' ? 'text-green-600' : 'text-red-600'} font-semibold">
                        ${d.karot_var || '-'}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `).join('') : `
        <div class="text-center py-12 text-gray-500">
          <i class="fas fa-flask text-4xl mb-4"></i>
          <p>Henüz karot verisi yok</p>
        </div>
      `}
    </div>
  `;
}

async function showLabSchmidtTab(content) {
  // Tüm schmidt verilerini getir
  const allSchmidtData = [];
  for (const project of projects) {
    const schmidtData = await api.getFieldData('schmidt', project.id);
    if (schmidtData.data && schmidtData.data.length > 0) {
      allSchmidtData.push({
        project: project,
        data: schmidtData.data
      });
    }
  }
  
  content.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">
          <i class="fas fa-hammer text-purple-600 mr-2"></i>Schmidt Çekici Deney Sonuçları
        </h2>
        <div class="text-sm text-gray-600">
          <i class="fas fa-info-circle mr-1"></i>Toplam ${allSchmidtData.length} iş
        </div>
      </div>
      
      ${allSchmidtData.length > 0 ? allSchmidtData.map(item => `
        <div class="mb-6 border rounded-lg overflow-hidden">
          <div class="bg-purple-50 border-b p-4">
            <h3 class="font-bold text-lg">İş No: ${item.project.is_no}</h3>
            <p class="text-sm text-gray-600">${item.project.adres}</p>
            <p class="text-sm text-gray-600">Durum: <span class="${getDurumColor(item.project.durum)}">${item.project.durum}</span></p>
          </div>
          
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-100">
                <tr>
                  <th class="px-3 py-2 text-left">Test No</th>
                  <th class="px-3 py-2 text-left">Eleman</th>
                  <th class="px-3 py-2 text-left">Lokasyon</th>
                  <th class="px-3 py-2 text-left">Kat</th>
                  <th class="px-3 py-2 text-left font-bold">Ortalama</th>
                  <th class="px-3 py-2 text-left">Tahmini Dayanım</th>
                  <th class="px-3 py-2 text-left">Test Tarihi</th>
                  <th class="px-3 py-2 text-left">Notlar</th>
                </tr>
              </thead>
              <tbody>
                ${item.data.map(d => `
                  <tr class="border-t hover:bg-gray-50">
                    <td class="px-3 py-2 font-semibold">${d.test_no || '-'}</td>
                    <td class="px-3 py-2">${d.eleman_tipi || '-'}</td>
                    <td class="px-3 py-2">${d.lokasyon || '-'}</td>
                    <td class="px-3 py-2">${d.kat || '-'}</td>
                    <td class="px-3 py-2 font-bold text-blue-600">${d.ortalama || '-'}</td>
                    <td class="px-3 py-2">${d.tahmini_dayanim || '-'} MPa</td>
                    <td class="px-3 py-2">${d.test_tarihi || '-'}</td>
                    <td class="px-3 py-2">${d.notlar || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `).join('') : `
        <div class="text-center py-12 text-gray-500">
          <i class="fas fa-hammer text-4xl mb-4"></i>
          <p>Henüz Schmidt verisi yok</p>
        </div>
      `}
    </div>
  `;
}

async function showLabIslerTab(content) {
  content.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg p-6">
      <h2 class="text-2xl font-bold mb-6">
        <i class="fas fa-list text-purple-600 mr-2"></i>Tüm İşler
      </h2>
      
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-100">
            <tr>
              <th class="px-4 py-2 text-left">İş No</th>
              <th class="px-4 py-2 text-left">İş Veren</th>
              <th class="px-4 py-2 text-left">Adres</th>
              <th class="px-4 py-2 text-left">Durum</th>
              <th class="px-4 py-2 text-left">Saha Tarihi</th>
              <th class="px-4 py-2 text-left">Raportör</th>
            </tr>
          </thead>
          <tbody>
            ${projects.map(p => `
              <tr class="border-t hover:bg-gray-50">
                <td class="px-4 py-2 font-semibold">${p.is_no || '-'}</td>
                <td class="px-4 py-2">${p.is_veren || '-'}</td>
                <td class="px-4 py-2">${p.adres || '-'}</td>
                <td class="px-4 py-2">
                  <span class="${getDurumColor(p.durum)}">${p.durum || '-'}</span>
                </td>
                <td class="px-4 py-2">${p.saha_tarihi || '-'}</td>
                <td class="px-4 py-2">${p.raportoru_hazirlayan || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function showReporterDashboard() {
  currentView = 'reporter';
  
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="min-h-screen bg-gray-100">
      <!-- Header -->
      <div class="bg-indigo-600 text-white p-4 shadow-lg">
        <div class="container mx-auto flex justify-between items-center">
          <div class="flex items-center">
            <i class="fas fa-file-alt text-2xl mr-3"></i>
            <div>
              <h1 class="text-xl font-bold">Raportör Paneli</h1>
              <p class="text-sm text-indigo-200">${currentUser.full_name}</p>
            </div>
          </div>
          <button onclick="logout()" class="bg-indigo-700 hover:bg-indigo-800 px-4 py-2 rounded-lg transition">
            <i class="fas fa-sign-out-alt mr-2"></i>Çıkış
          </button>
        </div>
      </div>
      
      <!-- Navigation Tabs -->
      <div class="bg-white border-b">
        <div class="container mx-auto">
          <div class="flex space-x-1 overflow-x-auto">
            <button onclick="showReporterTab('isler')" id="reporter-tab-isler" class="px-6 py-3 font-semibold border-b-2 border-indigo-600 text-indigo-600 whitespace-nowrap">
              <i class="fas fa-list mr-2"></i>İşlerim
            </button>
            <button onclick="showReporterTab('tum-veriler')" id="reporter-tab-tum-veriler" class="px-6 py-3 font-semibold text-gray-600 hover:text-indigo-600 whitespace-nowrap">
              <i class="fas fa-database mr-2"></i>Tüm Veriler
            </button>
            <button onclick="showReporterTab('fotograflar')" id="reporter-tab-fotograflar" class="px-6 py-3 font-semibold text-gray-600 hover:text-indigo-600 whitespace-nowrap">
              <i class="fas fa-images mr-2"></i>Fotoğraflar
            </button>
          </div>
        </div>
      </div>
      
      <!-- Content -->
      <div class="container mx-auto p-6">
        <div id="reporter-tab-content"></div>
      </div>
    </div>
  `;
  
  showReporterTab('isler');
}

function showReporterTab(tabName) {
  // Update tab styling
  document.querySelectorAll('[id^="reporter-tab-"]').forEach(tab => {
    tab.classList.remove('border-indigo-600', 'text-indigo-600', 'border-b-2');
    tab.classList.add('text-gray-600');
  });
  document.getElementById(`reporter-tab-${tabName}`).classList.add('border-indigo-600', 'text-indigo-600', 'border-b-2');
  document.getElementById(`reporter-tab-${tabName}`).classList.remove('text-gray-600');
  
  const content = document.getElementById('reporter-tab-content');
  
  if (tabName === 'isler') {
    showReporterIslerTab(content);
  } else if (tabName === 'tum-veriler') {
    showReporterTumVerilerTab(content);
  } else if (tabName === 'fotograflar') {
    showReporterFotograflarTab(content);
  }
}

async function showReporterIslerTab(content) {
  // Raportöre atanan işleri filtrele
  const myProjects = projects.filter(p => 
    p.raportoru_hazirlayan === currentUser.full_name || 
    p.durum === 'Lab Bekliyor' || 
    p.durum === 'Analizde'
  );
  
  content.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg p-6">
      <h2 class="text-2xl font-bold mb-6">
        <i class="fas fa-list text-indigo-600 mr-2"></i>Bana Atanan İşler
      </h2>
      
      ${myProjects.length > 0 ? `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${myProjects.map(p => `
            <div class="border rounded-lg p-4 hover:shadow-lg transition cursor-pointer" onclick="selectProjectForReporter(${p.id})">
              <div class="flex justify-between items-start mb-2">
                <h3 class="font-bold text-lg">${p.is_no}</h3>
                <span class="${getDurumColor(p.durum)} text-xs px-2 py-1 rounded">${p.durum}</span>
              </div>
              <p class="text-sm text-gray-600 mb-2">${p.is_veren}</p>
              <p class="text-sm text-gray-500 mb-2">${p.adres}</p>
              <div class="flex justify-between items-center text-xs text-gray-500 mt-3 pt-3 border-t">
                <span><i class="fas fa-calendar mr-1"></i>${p.saha_tarihi || '-'}</span>
                <button class="bg-indigo-600 text-white px-3 py-1 rounded text-xs hover:bg-indigo-700">
                  <i class="fas fa-eye mr-1"></i>Detay
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="text-center py-12 text-gray-500">
          <i class="fas fa-inbox text-4xl mb-4"></i>
          <p>Henüz atanan iş yok</p>
        </div>
      `}
    </div>
  `;
}

async function showReporterTumVerilerTab(content) {
  if (!selectedProject) {
    content.innerHTML = `
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <i class="fas fa-info-circle text-yellow-600 text-3xl mb-3"></i>
        <p class="text-yellow-800">Lütfen önce "İşlerim" sekmesinden bir iş seçin</p>
      </div>
    `;
    return;
  }
  
  // Tüm verileri getir
  const roloove = await api.getRoloove(selectedProject.id);
  const kolonSiyirma = await api.getFieldData('kolon-siyirma', selectedProject.id);
  const kolonRontgen = await api.getFieldData('kolon-rontgen', selectedProject.id);
  const schmidt = await api.getFieldData('schmidt', selectedProject.id);
  const karot = await api.getFieldData('karot', selectedProject.id);
  
  content.innerHTML = `
    <div class="space-y-6">
      <!-- Proje Bilgileri -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-2xl font-bold mb-4">
          <i class="fas fa-building text-indigo-600 mr-2"></i>${selectedProject.is_no} - Tüm Veriler
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div class="bg-gray-50 p-3 rounded">
            <p class="text-xs text-gray-600">İş Veren</p>
            <p class="font-semibold">${selectedProject.is_veren}</p>
          </div>
          <div class="bg-gray-50 p-3 rounded">
            <p class="text-xs text-gray-600">Adres</p>
            <p class="font-semibold">${selectedProject.adres}</p>
          </div>
          <div class="bg-gray-50 p-3 rounded">
            <p class="text-xs text-gray-600">Yönetmelik</p>
            <p class="font-semibold">${selectedProject.yonetmelik || '-'}</p>
          </div>
          <div class="bg-gray-50 p-3 rounded">
            <p class="text-xs text-gray-600">Durum</p>
            <p class="${getDurumColor(selectedProject.durum)}">${selectedProject.durum}</p>
          </div>
        </div>
        
        <button onclick="downloadAllPhotos(${selectedProject.id})" 
                class="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:from-indigo-600 hover:to-purple-600 font-semibold">
          <i class="fas fa-download mr-2"></i>Tüm Fotoğrafları İndir (ZIP)
        </button>
      </div>
      
      <!-- Rölöve -->
      ${roloove.data ? `
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h3 class="text-xl font-bold mb-4">
            <i class="fas fa-drafting-compass text-indigo-600 mr-2"></i>Rölöve Bilgileri
          </h3>
          ${roloove.data.roloove_image ? `
            <img src="${roloove.data.roloove_image}" class="w-full max-w-md rounded border mb-4" />
          ` : ''}
          <div class="grid grid-cols-4 gap-4">
            <div class="bg-gray-50 p-3 rounded">
              <p class="text-xs text-gray-600">İnceleme Katı</p>
              <p class="font-semibold">${roloove.data.inceleme_kati}</p>
            </div>
            <div class="bg-gray-50 p-3 rounded">
              <p class="text-xs text-gray-600">Kat Sayısı</p>
              <p class="font-semibold">${roloove.data.kat_sayisi}</p>
            </div>
            <div class="bg-gray-50 p-3 rounded">
              <p class="text-xs text-gray-600">Kolon Sayısı</p>
              <p class="font-semibold">${roloove.data.kolon_sayisi}</p>
            </div>
            <div class="bg-gray-50 p-3 rounded">
              <p class="text-xs text-gray-600">Perde Sayısı</p>
              <p class="font-semibold">${roloove.data.perde_sayisi || 0}</p>
            </div>
          </div>
        </div>
      ` : ''}
      
      <!-- Sıyırma Verileri -->
      ${kolonSiyirma.data?.length > 0 ? `
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h3 class="text-xl font-bold mb-4">
            <i class="fas fa-ruler text-indigo-600 mr-2"></i>Kolon Sıyırma Verileri (${kolonSiyirma.data.length})
          </h3>
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-100">
                <tr>
                  <th class="px-3 py-2 text-left">Kolon</th>
                  <th class="px-3 py-2 text-left">Boyutlar</th>
                  <th class="px-3 py-2 text-left">Donatı</th>
                  <th class="px-3 py-2 text-left">Etriye</th>
                  <th class="px-3 py-2 text-left">Fotoğraflar</th>
                </tr>
              </thead>
              <tbody>
                ${kolonSiyirma.data.map(d => `
                  <tr class="border-t">
                    <td class="px-3 py-2 font-bold">${d.kolon_kodu}</td>
                    <td class="px-3 py-2">${d.genis_yuzey}x${d.dar_yuzey} cm</td>
                    <td class="px-3 py-2">Ø${d.donati_capi}</td>
                    <td class="px-3 py-2">Ø${d.etriye_capi} / ${d.etriye_araligi}cm</td>
                    <td class="px-3 py-2">
                      <button onclick="viewKolonPhotos('${d.kolon_kodu}')" 
                              class="text-indigo-600 hover:text-indigo-800 text-sm">
                        <i class="fas fa-images mr-1"></i>Görüntüle
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}
      
      <!-- Röntgen Verileri -->
      ${kolonRontgen.data?.length > 0 ? `
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h3 class="text-xl font-bold mb-4">
            <i class="fas fa-x-ray text-indigo-600 mr-2"></i>Röntgen Verileri (${kolonRontgen.data.length})
          </h3>
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-100">
                <tr>
                  <th class="px-3 py-2 text-left">Kolon</th>
                  <th class="px-3 py-2 text-left">Kat</th>
                  <th class="px-3 py-2 text-left">Donatı Sayısı</th>
                  <th class="px-3 py-2 text-left">Donatı Çapı</th>
                  <th class="px-3 py-2 text-left">Fotoğraflar</th>
                </tr>
              </thead>
              <tbody>
                ${kolonRontgen.data.map(d => `
                  <tr class="border-t">
                    <td class="px-3 py-2 font-bold">${d.kolon_kodu}</td>
                    <td class="px-3 py-2">${d.kat || '-'}</td>
                    <td class="px-3 py-2">${d.donati_sayisi}</td>
                    <td class="px-3 py-2">Ø${d.donati_capi}</td>
                    <td class="px-3 py-2">
                      <button onclick="viewKolonRontgenPhotos('${d.kolon_kodu}')" 
                              class="text-indigo-600 hover:text-indigo-800 text-sm">
                        <i class="fas fa-images mr-1"></i>Görüntüle
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}
      
      <!-- Schmidt & Karot -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${schmidt.data?.length > 0 ? `
          <div class="bg-white rounded-lg shadow-lg p-6">
            <h3 class="text-xl font-bold mb-4">
              <i class="fas fa-hammer text-indigo-600 mr-2"></i>Schmidt (${schmidt.data.length})
            </h3>
            <div class="space-y-2">
              ${schmidt.data.slice(0, 5).map(d => `
                <div class="bg-gray-50 p-3 rounded flex justify-between">
                  <span>${d.test_no} - ${d.eleman_tipi || d.lokasyon}</span>
                  <span class="font-bold text-blue-600">Ort: ${d.ortalama}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        ${karot.data?.length > 0 ? `
          <div class="bg-white rounded-lg shadow-lg p-6">
            <h3 class="text-xl font-bold mb-4">
              <i class="fas fa-vial text-indigo-600 mr-2"></i>Karot (${karot.data.length})
            </h3>
            <div class="space-y-2">
              ${karot.data.slice(0, 5).map(d => `
                <div class="bg-gray-50 p-3 rounded">
                  <div class="flex justify-between">
                    <span>${d.karot_no || d.numune_no}</span>
                    <span class="text-xs text-gray-600">${d.eleman_kodu || '-'}</span>
                  </div>
                  <div class="flex gap-4 mt-1 text-sm">
                    <span class="text-orange-600 font-bold">fb: ${d.fb_mpa || '-'}</span>
                    <span class="text-red-600 font-bold">fck: ${d.fck_mpa || '-'}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

async function showReporterFotograflarTab(content) {
  if (!selectedProject) {
    content.innerHTML = `
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <i class="fas fa-info-circle text-yellow-600 text-3xl mb-3"></i>
        <p class="text-yellow-800">Lütfen önce "İşlerim" sekmesinden bir iş seçin</p>
      </div>
    `;
    return;
  }
  
  const { photos } = await api.getProjectPhotos(selectedProject.id);
  
  content.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">
          <i class="fas fa-images text-indigo-600 mr-2"></i>${selectedProject.is_no} - Fotoğraflar
        </h2>
        <button onclick="downloadAllPhotos(${selectedProject.id})" 
                class="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:from-indigo-600 hover:to-purple-600">
          <i class="fas fa-download mr-2"></i>Tümünü İndir
        </button>
      </div>
      
      ${photos.length > 0 ? `
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          ${photos.map(p => `
            <div class="border rounded-lg overflow-hidden hover:shadow-lg transition">
              <img src="${p.foto_data}" class="w-full h-48 object-cover" />
              <div class="p-3">
                <p class="text-sm font-semibold truncate">${p.foto_adi}</p>
                <p class="text-xs text-gray-600">${p.eleman_kodu}</p>
                <p class="text-xs text-gray-500">${(p.dosya_boyutu / 1024).toFixed(0)} KB</p>
                <button onclick="downloadPhoto('${p.foto_data}', '${p.foto_adi}')" 
                        class="w-full mt-2 bg-indigo-600 text-white py-1 rounded text-xs hover:bg-indigo-700">
                  <i class="fas fa-download mr-1"></i>İndir
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="text-center py-12 text-gray-500">
          <i class="fas fa-images text-4xl mb-4"></i>
          <p>Henüz fotoğraf yok</p>
        </div>
      `}
    </div>
  `;
}

function showAccountingDashboard() {
  currentView = 'accounting';
  
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="min-h-screen bg-gray-100">
      <!-- Header -->
      <div class="bg-teal-600 text-white p-4 shadow-lg">
        <div class="container mx-auto flex justify-between items-center">
          <div class="flex items-center">
            <i class="fas fa-calculator text-2xl mr-3"></i>
            <div>
              <h1 class="text-xl font-bold">Muhasebe Paneli</h1>
              <p class="text-sm text-teal-200">${currentUser.full_name}</p>
            </div>
          </div>
          <button onclick="logout()" class="bg-teal-700 hover:bg-teal-800 px-4 py-2 rounded-lg transition">
            <i class="fas fa-sign-out-alt mr-2"></i>Çıkış
          </button>
        </div>
      </div>
      
      <!-- Content -->
      <div class="container mx-auto p-6">
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h2 class="text-2xl font-bold mb-6">
            <i class="fas fa-file-invoice-dollar text-teal-600 mr-2"></i>Mali İşlemler
          </h2>
          
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-100">
                <tr>
                  <th class="px-4 py-2 text-left">İş No</th>
                  <th class="px-4 py-2 text-left">İş Veren</th>
                  <th class="px-4 py-2 text-left">Adres</th>
                  <th class="px-4 py-2 text-left">Durum</th>
                  <th class="px-4 py-2 text-left">Fiyat</th>
                  <th class="px-4 py-2 text-left">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                ${projects.map(p => `
                  <tr class="border-t hover:bg-gray-50">
                    <td class="px-4 py-2 font-semibold">${p.is_no || '-'}</td>
                    <td class="px-4 py-2">${p.is_veren || '-'}</td>
                    <td class="px-4 py-2">${p.adres || '-'}</td>
                    <td class="px-4 py-2">
                      <span class="${getDurumColor(p.durum)}">${p.durum || '-'}</span>
                    </td>
                    <td class="px-4 py-2 font-bold text-green-600">${p.fiyat || '-'} ₺</td>
                    <td class="px-4 py-2">
                      <button class="bg-teal-600 text-white px-3 py-1 rounded text-xs hover:bg-teal-700">
                        <i class="fas fa-edit mr-1"></i>Düzenle
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

window.selectProjectForReporter = function(projectId) {
  selectedProject = projects.find(p => p.id === projectId);
  showReporterTab('tum-veriler');
}

function showGenericDashboard() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="min-h-screen bg-gray-100 p-8">
      <div class="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 class="text-2xl font-bold mb-4">Hoş Geldiniz, ${currentUser.full_name}</h1>
        <p class="text-gray-600">Rol: ${currentUser.role}</p>
        <button onclick="logout()" class="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
          Çıkış Yap
        </button>
      </div>
    </div>
  `;
}

// Coordinator Tabs
function showTab(tabName) {
  // Update tab styling
  document.querySelectorAll('[id^="tab-"]').forEach(tab => {
    tab.classList.remove('border-blue-600', 'text-blue-600', 'border-b-2');
    tab.classList.add('text-gray-600');
  });
  document.getElementById(`tab-${tabName}`).classList.add('border-blue-600', 'text-blue-600', 'border-b-2');
  document.getElementById(`tab-${tabName}`).classList.remove('text-gray-600');
  
  const content = document.getElementById('tab-content');
  
  if (tabName === 'binalar') {
    showBinalarTab(content);
  } else if (tabName === 'ajanda') {
    showAjandaTab(content);
  } else if (tabName === 'yeni-is') {
    showYeniIsTab(content);
  }
}

function showBinalarTab(content) {
  const tableRows = projects.map(p => `
    <tr class="hover:bg-gray-50">
      <td class="px-4 py-2 border sticky left-0 bg-white">${p.is_no || '-'}</td>
      <td class="px-4 py-2 border sticky left-16 bg-white">${p.is_veren || '-'}</td>
      <td class="px-4 py-2 border">${p.malik || '-'}</td>
      <td class="px-4 py-2 border">${p.il || '-'}</td>
      <td class="px-4 py-2 border">${p.ilce || '-'}</td>
      <td class="px-4 py-2 border">${p.adres || '-'}</td>
      <td class="px-4 py-2 border">${p.ada || '-'}</td>
      <td class="px-4 py-2 border">${p.parsel || '-'}</td>
      <td class="px-4 py-2 border">${p.yonetmelik || '-'}</td>
      <td class="px-4 py-2 border">${p.din_cinsi || '-'}</td>
      <td class="px-4 py-2 border">${p.sahaya_gidilen_tarih || '-'}</td>
      <td class="px-4 py-2 border">${p.saha_ekibi || '-'}</td>
      <td class="px-4 py-2 border">
        <span class="px-2 py-1 rounded text-xs font-semibold ${getDurumColor(p.durum)}">
          ${p.durum || 'Beklemede'}
        </span>
      </td>
      <td class="px-4 py-2 border">${p.raporu_hazirlayan || '-'}</td>
      <td class="px-4 py-2 border">${p.yapi_kimlik_no || '-'}</td>
      <td class="px-4 py-2 border">${p.onay_durumu || '-'}</td>
      <td class="px-4 py-2 border">${p.fiyat ? p.fiyat + ' ₺' : '-'}</td>
      <td class="px-4 py-2 border">
        <button onclick="editProject(${p.id})" class="text-blue-600 hover:text-blue-800">
          <i class="fas fa-edit"></i>
        </button>
      </td>
    </tr>
  `).join('');
  
  content.innerHTML = `
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <div class="p-4 bg-gray-50 border-b">
        <h2 class="text-xl font-bold text-gray-800">
          <i class="fas fa-list mr-2"></i>Tüm Binalar (${projects.length})
        </h2>
      </div>
      
      <div class="overflow-x-auto" style="max-height: 600px;">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-100 sticky top-0">
            <tr>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700 border sticky left-0 bg-gray-100">İş No</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700 border sticky left-16 bg-gray-100">İşveren</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700 border">Malik</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700 border">İl</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700 border">İlçe</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700 border">Adres</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700 border">Ada</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700 border">Parsel</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700 border">Yönetmelik</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700 border">Yapı Cinsi</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700 border">Saha Tarihi</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700 border">Saha Ekibi</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700 border">Durum</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700 border">Raportör</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700 border">YKN</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700 border">Onay</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700 border">Fiyat</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-700 border">İşlem</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            ${tableRows || '<tr><td colspan="18" class="text-center py-8 text-gray-500">Henüz iş kaydı yok</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function showAjandaTab(content) {
  // Get current month's agenda
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  
  const { agenda } = await api.getAgenda(startDate, endDate);
  
  // Group by date
  const agendaByDate = {};
  agenda.forEach(item => {
    if (!agendaByDate[item.tarih]) {
      agendaByDate[item.tarih] = [];
    }
    agendaByDate[item.tarih].push(item);
  });
  
  const agendaRows = Object.keys(agendaByDate).sort().map(date => {
    const items = agendaByDate[date];
    const ozkanItems = items.filter(i => i.team_name === 'ÖZKAN ŞERAFETTİN BAYRAM');
    const kenanItems = items.filter(i => i.team_name === 'KENAN HÜSEYİN ZAFER');
    const husnuItems = items.filter(i => i.team_name === 'HÜSNÜ');
    
    return `
      <tr>
        <td class="px-4 py-3 border font-semibold bg-orange-50">${formatDate(date)}</td>
        <td class="px-4 py-3 border">
          ${ozkanItems.map(i => `
            <div class="mb-2 p-2 bg-blue-50 rounded text-sm">
              <strong>${i.is_no}</strong> - ${i.adres || i.is_veren}
            </div>
          `).join('') || '<div class="text-gray-400">-</div>'}
        </td>
        <td class="px-4 py-3 border">
          ${kenanItems.map(i => `
            <div class="mb-2 p-2 bg-red-50 rounded text-sm">
              <strong>${i.is_no}</strong> - ${i.adres || i.is_veren}
            </div>
          `).join('') || '<div class="text-gray-400">-</div>'}
        </td>
        <td class="px-4 py-3 border">
          ${husnuItems.map(i => `
            <div class="mb-2 p-2 bg-purple-50 rounded text-sm">
              <strong>${i.is_no}</strong> - ${i.adres || i.is_veren}
            </div>
          `).join('') || '<div class="text-gray-400">-</div>'}
        </td>
      </tr>
    `;
  }).join('');
  
  content.innerHTML = `
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <div class="p-4 bg-gray-50 border-b">
        <h2 class="text-xl font-bold text-gray-800">
          <i class="fas fa-calendar-alt mr-2"></i>Saha Ajandası - ${today.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
        </h2>
      </div>
      
      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead class="bg-gray-100">
            <tr>
              <th class="px-4 py-3 text-left font-semibold border">TARİH</th>
              <th class="px-4 py-3 text-center font-semibold border bg-blue-100">
                ÖZKAN ŞERAFETTİN BAYRAM
              </th>
              <th class="px-4 py-3 text-center font-semibold border bg-red-100">
                KENAN HÜSEYİN ZAFER
              </th>
              <th class="px-4 py-3 text-center font-semibold border bg-purple-100">
                HÜSNÜ
              </th>
            </tr>
          </thead>
          <tbody>
            ${agendaRows || '<tr><td colspan="4" class="text-center py-8 text-gray-500">Bu ay için planlanmış iş yok</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function showYeniIsTab(content) {
  const { field_teams } = await api.getFieldTeams();
  
  content.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">
        <i class="fas fa-plus-circle mr-2"></i>Yeni İş Kaydı
      </h2>
      
      <form id="newProjectForm" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">İşveren *</label>
            <input type="text" name="is_veren" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Malik</label>
            <input type="text" name="malik" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">İl *</label>
            <select name="il" id="ilSelect" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required>
              <option value="İstanbul">İstanbul</option>
              <option value="Ankara">Ankara</option>
              <option value="İzmir">İzmir</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">İlçe *</label>
            <select name="ilce" id="ilceSelect" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required>
            </select>
          </div>
          
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Adres *</label>
            <input type="text" name="adres" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Ada</label>
            <input type="text" name="ada" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Parsel</label>
            <input type="text" name="parsel" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Yönetmelik *</label>
            <select name="yonetmelik" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required>
              <option value="">Seçiniz</option>
              <option value="RBTY 2019">RBTY 2019</option>
              <option value="TBDY 2018">TBDY 2018</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Yapı Cinsi *</label>
            <select name="din_cinsi" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required>
              <option value="">Seçiniz</option>
              <option value="Betonarme">Betonarme</option>
              <option value="Çelik">Çelik</option>
              <option value="Yığma">Yığma</option>
              <option value="Ahşap">Ahşap</option>
              <option value="Karma">Karma</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Saha Tarihi *</label>
            <input type="date" name="sahaya_gidilen_tarih" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Saha Ekibi *</label>
            <select name="saha_ekibi_id" id="sahaEkibiSelect" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required>
              <option value="">Seçiniz</option>
              ${field_teams.map(t => `<option value="${t.id}">${t.team_name}</option>`).join('')}
            </select>
          </div>
        </div>
        
        <div class="flex justify-end space-x-4 mt-6">
          <button type="button" onclick="showTab('binalar')" class="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">
            İptal
          </button>
          <button type="submit" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <i class="fas fa-save mr-2"></i>Kaydet
          </button>
        </div>
      </form>
    </div>
  `;
  
  // Setup il/ilce cascade
  updateIlceOptions('İstanbul');
  document.getElementById('ilSelect').addEventListener('change', (e) => {
    updateIlceOptions(e.target.value);
  });
  
  document.getElementById('newProjectForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });
    
    // Add saha_ekibi name
    const ekipSelect = document.getElementById('sahaEkibiSelect');
    data.saha_ekibi = ekipSelect.options[ekipSelect.selectedIndex].text;
    
    try {
      await api.createProject(data);
      alert('İş başarıyla kaydedildi!');
      await loadDashboard();
      showTab('binalar');
    } catch (error) {
      alert('Hata oluştu!');
    }
  });
}

// Field Team Tabs
function showFieldTab(tabName) {
  // Update tab styling
  document.querySelectorAll('[id^="field-tab-"]').forEach(tab => {
    tab.classList.remove('border-green-600', 'text-green-600', 'border-b-2');
    tab.classList.add('text-gray-600');
  });
  document.getElementById(`field-tab-${tabName}`).classList.add('border-green-600', 'text-green-600', 'border-b-2');
  document.getElementById(`field-tab-${tabName}`).classList.remove('text-gray-600');
  
  const content = document.getElementById('field-tab-content');
  
  if (tabName === 'gorevler') {
    showGorevlerTab(content);
  } else if (tabName === 'roloove') {
    showRolooveTab(content);
  } else {
    showFieldDataTab(content, tabName);
  }
}

function showGorevlerTab(content) {
  const myProjects = projects.filter(p => p.saha_ekibi_id === currentUser.id);
  
  const projectCards = myProjects.map(p => `
    <div class="bg-white border rounded-lg p-4 hover:shadow-lg transition">
      <div class="flex justify-between items-start mb-3">
        <div>
          <h3 class="text-lg font-bold text-gray-800">İş No: ${p.is_no}</h3>
          <p class="text-sm text-gray-600">${p.is_veren}</p>
        </div>
        <span class="px-3 py-1 rounded-full text-xs font-semibold ${getDurumColor(p.durum)}">
          ${p.durum}
        </span>
      </div>
      
      <div class="space-y-1 text-sm">
        <p><i class="fas fa-map-marker-alt text-gray-400 w-5"></i> ${p.adres || '-'}</p>
        <p><i class="fas fa-calendar text-gray-400 w-5"></i> Saha Tarihi: ${p.sahaya_gidilen_tarih || '-'}</p>
        <p><i class="fas fa-building text-gray-400 w-5"></i> ${p.din_cinsi || '-'} - ${p.yonetmelik || '-'}</p>
      </div>
      
      <div class="mt-4 flex gap-2">
        <button onclick="selectProjectForFieldWork(${p.id})" class="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700">
          <i class="fas fa-edit mr-2"></i>Veri Gir
        </button>
      </div>
    </div>
  `).join('');
  
  content.innerHTML = `
    <div>
      <h2 class="text-2xl font-bold text-gray-800 mb-6">
        <i class="fas fa-clipboard-list mr-2"></i>Görevlerim (${myProjects.length})
      </h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${projectCards || '<p class="text-gray-500 col-span-3 text-center py-8">Henüz atanmış görev yok</p>'}
      </div>
    </div>
  `;
}

function selectProjectForFieldWork(projectId) {
  selectedProject = projects.find(p => p.id === projectId);
  showFieldTab('siyirma');
}

async function showFieldDataTab(content, dataType) {
  if (!selectedProject) {
    content.innerHTML = `
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <i class="fas fa-exclamation-triangle text-yellow-600 text-3xl mb-3"></i>
        <p class="text-gray-700">Lütfen önce "Görevlerim" sekmesinden bir iş seçiniz.</p>
        <button onclick="showFieldTab('gorevler')" class="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
          Görevlere Dön
        </button>
      </div>
    `;
    return;
  }
  
  // Show appropriate form based on data type
  if (dataType === 'siyirma') {
    await showSiyirmaForm(content);
  } else if (dataType === 'rontgen') {
    await showRontgenForm(content);
  } else if (dataType === 'karot') {
    await showKarotForm(content);
  } else if (dataType === 'schmidt') {
    await showSchmidtForm(content);
  }
}

async function showSiyirmaForm(content) {
  // Load rölöve to get kolon kodları
  const rolooveData = await api.getRoloove(selectedProject.id);
  const kolonKodlari = rolooveData.kolon_tanimlari || [];
  const perdeKodlari = rolooveData.perde_tanimlari || [];
  
  const kolonData = await api.getFieldData('kolon-siyirma', selectedProject.id);
  const perdeData = await api.getFieldData('perde-siyirma', selectedProject.id);
  
  content.innerHTML = `
    <div class="space-y-6">
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 class="font-bold text-lg">Seçili İş: ${selectedProject.is_no}</h3>
        <p class="text-sm text-gray-600">${selectedProject.adres}</p>
      </div>
      
      <!-- Alt Sekmeler -->
      <div class="bg-white rounded-lg shadow">
        <div class="flex border-b">
          <button onclick="showSiyirmaSubTab('kolon')" id="siyirma-sub-kolon" 
                  class="flex-1 px-6 py-3 font-semibold border-b-2 border-blue-600 text-blue-600">
            <i class="fas fa-columns mr-2"></i>Kolon Sıyırma
          </button>
          <button onclick="showSiyirmaSubTab('perde')" id="siyirma-sub-perde" 
                  class="flex-1 px-6 py-3 font-semibold text-gray-600 hover:text-blue-600">
            <i class="fas fa-th-large mr-2"></i>Perde Sıyırma
          </button>
        </div>
        <div id="siyirma-sub-content" class="p-6"></div>
      </div>
    </div>
  `;
  
  // Store data globally for sub tabs
  window.siyirmaKolonKodlari = kolonKodlari;
  window.siyirmaPerdeKodlari = perdeKodlari;
  window.siyirmaKolonData = kolonData;
  window.siyirmaPerdeData = perdeData;
  
  showSiyirmaSubTab('kolon');
}

window.showSiyirmaSubTab = function(subTab) {
  // Update tab styling
  document.querySelectorAll('[id^="siyirma-sub-"]').forEach(tab => {
    tab.classList.remove('border-blue-600', 'text-blue-600', 'border-b-2');
    tab.classList.add('text-gray-600');
  });
  document.getElementById(`siyirma-sub-${subTab}`).classList.add('border-blue-600', 'text-blue-600', 'border-b-2');
  document.getElementById(`siyirma-sub-${subTab}`).classList.remove('text-gray-600');
  
  const content = document.getElementById('siyirma-sub-content');
  
  if (subTab === 'kolon') {
    showKolonSiyirmaForm(content);
  } else {
    showPerdeSiyirmaForm(content);
  }
};

function showKolonSiyirmaForm(content) {
  const kolonKodlari = window.siyirmaKolonKodlari || [];
  const kolonData = window.siyirmaKolonData || { data: [] };
  
  const kolonOptions = kolonKodlari.map(k => 
    `<option value="${k.kolon_kodu}">${k.kolon_kodu} (${k.genis_yuzey}x${k.dar_yuzey} cm)</option>`
  ).join('');
  
  content.innerHTML = `
    <div class="space-y-4">
      <h4 class="text-lg font-bold">Yeni Kolon Sıyırma Ekle</h4>
      
      <form id="kolonSiyirmaForm" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Kolon Kodu *</label>
            <select name="kolon_kodu" id="kolonKoduSelect" class="w-full px-3 py-2 border rounded" required>
              <option value="">Seçiniz</option>
              ${kolonOptions}
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Geniş Yüzey (cm)</label>
            <input type="number" step="0.01" name="genis_yuzey" id="kolonGenisYuzey" class="w-full px-3 py-2 border rounded" readonly />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Dar Yüzey (cm)</label>
            <input type="number" step="0.01" name="dar_yuzey" id="kolonDarYuzey" class="w-full px-3 py-2 border rounded" readonly />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Donatı Çapı</label>
            <input type="text" name="donati_capi" placeholder="Ø14, Ø16..." class="w-full px-3 py-2 border rounded" />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Etriye Çapı</label>
            <input type="text" name="etriye_capi" placeholder="Ø8, Ø10..." class="w-full px-3 py-2 border rounded" />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Etriye Aralığı (cm)</label>
            <input type="number" step="0.01" name="etriye_aralik" class="w-full px-3 py-2 border rounded" />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Pas Payı (cm)</label>
            <input type="number" step="0.01" name="pas_payi" class="w-full px-3 py-2 border rounded" />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Okunan Çap (Korozyon)</label>
            <input type="text" name="okunan_cap" placeholder="Ø12..." class="w-full px-3 py-2 border rounded" />
          </div>
          
          <div class="md:col-span-2 lg:col-span-3">
            <label class="block text-sm font-medium mb-1">Notlar</label>
            <input type="text" name="notlar" class="w-full px-3 py-2 border rounded" />
          </div>
        </div>
        
        <!-- Fotoğraflar -->
        <div class="border-t pt-4 mt-4">
          <h5 class="font-semibold mb-3">Fotoğraflar</h5>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${generatePhotoUploadSection('gorunum', 'Kolon Görünümü')}
            ${generatePhotoUploadSection('donati_capi', 'Donatı Çapı')}
            ${generatePhotoUploadSection('etriye_capi', 'Etriye Çapı')}
            ${generatePhotoUploadSection('korozyon', 'Korozyon')}
            ${generatePhotoUploadSection('etriye_araligi', 'Etriye Aralığı')}
          </div>
        </div>
        
        <button type="submit" class="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          <i class="fas fa-plus mr-2"></i>Kaydet
        </button>
      </form>
      
      <!-- Kaydedilmiş Kolonlar -->
      <div class="mt-6">
        <h4 class="text-lg font-bold mb-3">Kaydedilmiş Kolonlar</h4>
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-100">
              <tr>
                <th class="px-3 py-2 text-left">Kolon Kodu</th>
                <th class="px-3 py-2 text-left">Boyutlar</th>
                <th class="px-3 py-2 text-left">Donatı</th>
                <th class="px-3 py-2 text-left">Etriye</th>
                <th class="px-3 py-2 text-left">Fotoğraflar</th>
              </tr>
            </thead>
            <tbody>
              ${kolonData.data?.map(d => `
                <tr class="border-t">
                  <td class="px-3 py-2 font-mono font-bold">${d.kolon_kodu || '-'}</td>
                  <td class="px-3 py-2">${d.genis_yuzey}x${d.dar_yuzey} cm</td>
                  <td class="px-3 py-2">${d.donati_capi || '-'}</td>
                  <td class="px-3 py-2">${d.etriye_capi || '-'} / ${d.etriye_aralik || '-'} cm</td>
                  <td class="px-3 py-2">
                    <button onclick="viewKolonPhotos('${d.kolon_kodu}')" class="text-blue-600 hover:underline">
                      <i class="fas fa-images"></i> Görüntüle
                    </button>
                  </td>
                </tr>
              `).join('') || '<tr><td colspan="5" class="text-center py-4 text-gray-500">Henüz veri yok</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  
  // Auto-fill boyutlar when kolon selected
  document.getElementById('kolonKoduSelect').addEventListener('change', (e) => {
    const selectedKolon = kolonKodlari.find(k => k.kolon_kodu === e.target.value);
    if (selectedKolon) {
      document.getElementById('kolonGenisYuzey').value = selectedKolon.genis_yuzey || '';
      document.getElementById('kolonDarYuzey').value = selectedKolon.dar_yuzey || '';
    }
  });
  
  // Form submit
  document.getElementById('kolonSiyirmaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveKolonSiyirma(e.target);
  });
}

function generatePhotoUploadSection(fotoTipi, label) {
  const fotoTipiSafe = fotoTipi.replace(/_/g, '-');
  return `
    <div class="border rounded p-3">
      <label class="block text-xs font-semibold mb-2">${label}</label>
      <div class="flex gap-1 mb-2">
        <button type="button" onclick="capturePhotoForForm('${fotoTipi}')" 
                class="flex-1 bg-green-600 text-white text-xs py-1 px-2 rounded">
          <i class="fas fa-camera"></i>
        </button>
        <button type="button" onclick="selectPhotoForForm('${fotoTipi}')" 
                class="flex-1 bg-blue-600 text-white text-xs py-1 px-2 rounded">
          <i class="fas fa-images"></i>
        </button>
      </div>
      <div id="photo-preview-${fotoTipiSafe}" class="text-xs text-gray-500"></div>
      <input type="hidden" id="photo-data-${fotoTipiSafe}" name="foto_${fotoTipi}" />
    </div>
  `;
}

window.capturePhotoForForm = async function(fotoTipi) {
  const kolonKodu = document.getElementById('kolonKoduSelect').value;
  if (!kolonKodu) {
    alert('Lütfen önce kolon kodu seçiniz');
    return;
  }
  
  try {
    const photo = await capturePhoto(kolonKodu, fotoTipi);
    const fotoTipiSafe = fotoTipi.replace(/_/g, '-');
    document.getElementById(`photo-data-${fotoTipiSafe}`).value = JSON.stringify(photo);
    document.getElementById(`photo-preview-${fotoTipiSafe}`).innerHTML = 
      `<i class="fas fa-check text-green-600"></i> ${(photo.size / 1024).toFixed(0)} KB`;
  } catch (error) {
    console.error('Fotoğraf çekme hatası:', error);
  }
};

window.selectPhotoForForm = async function(fotoTipi) {
  const kolonKodu = document.getElementById('kolonKoduSelect').value;
  if (!kolonKodu) {
    alert('Lütfen önce kolon kodu seçiniz');
    return;
  }
  
  try {
    const photo = await selectPhotoFromGallery(kolonKodu, fotoTipi);
    const fotoTipiSafe = fotoTipi.replace(/_/g, '-');
    document.getElementById(`photo-data-${fotoTipiSafe}`).value = JSON.stringify(photo);
    document.getElementById(`photo-preview-${fotoTipiSafe}`).innerHTML = 
      `<i class="fas fa-check text-green-600"></i> ${(photo.size / 1024).toFixed(0)} KB`;
  } catch (error) {
    console.error('Fotoğraf seçme hatası:', error);
  }
};

async function saveKolonSiyirma(form) {
  const formData = new FormData(form);
  const data = {};
  formData.forEach((value, key) => {
    if (!key.startsWith('foto_')) {
      data[key] = value;
    }
  });
  
  try {
    // Save kolon siyirma
    const result = await api.createFieldData('kolon-siyirma', selectedProject.id, data);
    
    // Upload photos
    const fotoTipleri = ['gorunum', 'donati_capi', 'etriye_capi', 'korozyon', 'etriye_araligi'];
    for (const fotoTipi of fotoTipleri) {
      const fotoTipiSafe = fotoTipi.replace(/_/g, '-');
      const photoDataStr = document.getElementById(`photo-data-${fotoTipiSafe}`).value;
      if (photoDataStr) {
        const photoData = JSON.parse(photoDataStr);
        await uploadPhotoToServer(selectedProject.id, 'kolon_siyirma', result.id, photoData);
      }
    }
    
    alert('Kolon sıyırma başarıyla kaydedildi!');
    showFieldTab('siyirma');
  } catch (error) {
    alert('Hata: ' + error.message);
  }
}

function showPerdeSiyirmaForm(content) {
  const perdeKodlari = window.siyirmaPerdeKodlari || [];
  const perdeData = window.siyirmaPerdeData || { data: [] };
  
  const perdeOptions = perdeKodlari.map(p => 
    `<option value="${p.perde_kodu}">${p.perde_kodu} (${p.genis_yuzey}x${p.dar_yuzey} cm)</option>`
  ).join('');
  
  content.innerHTML = `
    <div class="space-y-4">
      <h4 class="text-lg font-bold">Yeni Perde Sıyırma Ekle</h4>
      
      <form id="perdeSiyirmaForm" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Perde Kodu *</label>
            <select name="perde_kodu" id="perdeKoduSelect" class="w-full px-3 py-2 border rounded" required>
              <option value="">Seçiniz</option>
              ${perdeOptions}
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Geniş Yüzey (cm)</label>
            <input type="number" step="0.01" name="genis_yuzey" id="perdeGenisYuzey" class="w-full px-3 py-2 border rounded" readonly />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Dar Yüzey (cm)</label>
            <input type="number" step="0.01" name="dar_yuzey" id="perdeDarYuzey" class="w-full px-3 py-2 border rounded" readonly />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Donatı Çapı</label>
            <input type="text" name="donati_capi" placeholder="Ø14, Ø16..." class="w-full px-3 py-2 border rounded" />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Etriye Çapı</label>
            <input type="text" name="etriye_capi" placeholder="Ø8, Ø10..." class="w-full px-3 py-2 border rounded" />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Etriye Aralığı (cm)</label>
            <input type="number" step="0.01" name="etriye_aralik" class="w-full px-3 py-2 border rounded" />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Pas Payı (cm)</label>
            <input type="number" step="0.01" name="pas_payi" class="w-full px-3 py-2 border rounded" />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Okunan Çap (Korozyon)</label>
            <input type="text" name="okunan_cap" placeholder="Ø12..." class="w-full px-3 py-2 border rounded" />
          </div>
          
          <div class="md:col-span-2 lg:col-span-3">
            <label class="block text-sm font-medium mb-1">Notlar</label>
            <input type="text" name="notlar" class="w-full px-3 py-2 border rounded" />
          </div>
        </div>
        
        <!-- Fotoğraflar -->
        <div class="border-t pt-4 mt-4">
          <h5 class="font-semibold mb-3">Fotoğraflar</h5>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${generatePerdePhotoUploadSection('gorunum', 'Perde Görünümü')}
            ${generatePerdePhotoUploadSection('donati_capi', 'Donatı Çapı')}
            ${generatePerdePhotoUploadSection('etriye_capi', 'Etriye Çapı')}
            ${generatePerdePhotoUploadSection('korozyon', 'Korozyon')}
            ${generatePerdePhotoUploadSection('etriye_araligi', 'Etriye Aralığı')}
          </div>
        </div>
        
        <button type="submit" class="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
          <i class="fas fa-plus mr-2"></i>Kaydet
        </button>
      </form>
      
      <!-- Kaydedilmiş Perdeler -->
      <div class="mt-6">
        <h4 class="text-lg font-bold mb-3">Kaydedilmiş Perdeler</h4>
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-100">
              <tr>
                <th class="px-3 py-2 text-left">Perde Kodu</th>
                <th class="px-3 py-2 text-left">Boyutlar</th>
                <th class="px-3 py-2 text-left">Donatı</th>
                <th class="px-3 py-2 text-left">Etriye</th>
                <th class="px-3 py-2 text-left">Fotoğraflar</th>
              </tr>
            </thead>
            <tbody>
              ${perdeData.data?.map(d => `
                <tr class="border-t">
                  <td class="px-3 py-2 font-mono font-bold">${d.perde_kodu || '-'}</td>
                  <td class="px-3 py-2">${d.genis_yuzey}x${d.dar_yuzey} cm</td>
                  <td class="px-3 py-2">${d.donati_capi || '-'}</td>
                  <td class="px-3 py-2">${d.etriye_capi || '-'} / ${d.etriye_aralik || '-'} cm</td>
                  <td class="px-3 py-2">
                    <button onclick="viewPerdePhotos('${d.perde_kodu}')" class="text-purple-600 hover:underline">
                      <i class="fas fa-images"></i> Görüntüle
                    </button>
                  </td>
                </tr>
              `).join('') || '<tr><td colspan="5" class="text-center py-4 text-gray-500">Henüz veri yok</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  
  // Auto-fill boyutlar when perde selected
  document.getElementById('perdeKoduSelect').addEventListener('change', (e) => {
    const selectedPerde = perdeKodlari.find(p => p.perde_kodu === e.target.value);
    if (selectedPerde) {
      document.getElementById('perdeGenisYuzey').value = selectedPerde.genis_yuzey || '';
      document.getElementById('perdeDarYuzey').value = selectedPerde.dar_yuzey || '';
    }
  });
  
  // Form submit
  document.getElementById('perdeSiyirmaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await savePerdeSiyirma(e.target);
  });
}

function generatePerdePhotoUploadSection(fotoTipi, label) {
  const fotoTipiSafe = fotoTipi.replace(/_/g, '-');
  return `
    <div class="border rounded p-3">
      <label class="block text-xs font-semibold mb-2">${label}</label>
      <div class="flex gap-1 mb-2">
        <button type="button" onclick="capturePhotoForPerde('${fotoTipi}')" 
                class="flex-1 bg-green-600 text-white text-xs py-1 px-2 rounded">
          <i class="fas fa-camera"></i>
        </button>
        <button type="button" onclick="selectPhotoForPerde('${fotoTipi}')" 
                class="flex-1 bg-purple-600 text-white text-xs py-1 px-2 rounded">
          <i class="fas fa-images"></i>
        </button>
      </div>
      <div id="perde-photo-preview-${fotoTipiSafe}" class="text-xs text-gray-500"></div>
      <input type="hidden" id="perde-photo-data-${fotoTipiSafe}" name="foto_${fotoTipi}" />
    </div>
  `;
}

window.capturePhotoForPerde = async function(fotoTipi) {
  const perdeKodu = document.getElementById('perdeKoduSelect').value;
  if (!perdeKodu) {
    alert('Lütfen önce perde kodu seçiniz');
    return;
  }
  
  try {
    const photo = await capturePhoto(perdeKodu, fotoTipi);
    const fotoTipiSafe = fotoTipi.replace(/_/g, '-');
    document.getElementById(`perde-photo-data-${fotoTipiSafe}`).value = JSON.stringify(photo);
    document.getElementById(`perde-photo-preview-${fotoTipiSafe}`).innerHTML = 
      `<i class="fas fa-check text-green-600"></i> ${(photo.size / 1024).toFixed(0)} KB`;
  } catch (error) {
    console.error('Fotoğraf çekme hatası:', error);
  }
};

window.selectPhotoForPerde = async function(fotoTipi) {
  const perdeKodu = document.getElementById('perdeKoduSelect').value;
  if (!perdeKodu) {
    alert('Lütfen önce perde kodu seçiniz');
    return;
  }
  
  try {
    const photo = await selectPhotoFromGallery(perdeKodu, fotoTipi);
    const fotoTipiSafe = fotoTipi.replace(/_/g, '-');
    document.getElementById(`perde-photo-data-${fotoTipiSafe}`).value = JSON.stringify(photo);
    document.getElementById(`perde-photo-preview-${fotoTipiSafe}`).innerHTML = 
      `<i class="fas fa-check text-green-600"></i> ${(photo.size / 1024).toFixed(0)} KB`;
  } catch (error) {
    console.error('Fotoğraf seçme hatası:', error);
  }
};

async function savePerdeSiyirma(form) {
  const formData = new FormData(form);
  const data = {};
  formData.forEach((value, key) => {
    if (!key.startsWith('foto_')) {
      data[key] = value;
    }
  });
  
  try {
    // Save perde siyirma
    const result = await api.createFieldData('perde-siyirma', selectedProject.id, data);
    
    // Upload photos
    const fotoTipleri = ['gorunum', 'donati_capi', 'etriye_capi', 'korozyon', 'etriye_araligi'];
    for (const fotoTipi of fotoTipleri) {
      const fotoTipiSafe = fotoTipi.replace(/_/g, '-');
      const photoDataStr = document.getElementById(`perde-photo-data-${fotoTipiSafe}`).value;
      if (photoDataStr) {
        const photoData = JSON.parse(photoDataStr);
        await uploadPhotoToServer(selectedProject.id, 'perde_siyirma', result.id, photoData);
      }
    }
    
    alert('Perde sıyırma başarıyla kaydedildi!');
    showFieldTab('siyirma');
  } catch (error) {
    alert('Hata: ' + error.message);
  }
}

window.viewPerdePhotos = async function(perdeKodu) {
  try {
    const { photos } = await api.getPhotos(selectedProject.id, perdeKodu);
    
    if (photos.length === 0) {
      alert('Bu perde için fotoğraf bulunamadı.');
      return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div class="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
          <h3 class="text-lg font-bold">${perdeKodu} Fotoğrafları</h3>
          <button onclick="this.closest('.fixed').remove()" class="text-gray-600 hover:text-gray-900">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          ${photos.map(p => `
            <div class="border rounded p-2">
              <p class="font-semibold text-sm mb-2">${p.foto_adi}</p>
              <img src="${p.foto_data}" class="w-full rounded mb-2" />
              <button onclick="downloadPhoto('${p.foto_data}', '${p.foto_adi}')" 
                      class="w-full bg-purple-600 text-white py-1 rounded text-sm">
                <i class="fas fa-download mr-1"></i>İndir
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  } catch (error) {
    alert('Fotoğraflar yüklenirken hata oluştu.');
  }
}

window.viewKolonPhotos = async function(kolonKodu) {
  try {
    const { photos } = await api.getPhotos(selectedProject.id, kolonKodu);
    
    if (photos.length === 0) {
      alert('Bu kolon için fotoğraf bulunamadı.');
      return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div class="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
          <h3 class="text-lg font-bold">${kolonKodu} Fotoğrafları</h3>
          <button onclick="this.closest('.fixed').remove()" class="text-gray-600 hover:text-gray-900">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          ${photos.map(p => `
            <div class="border rounded p-2">
              <p class="font-semibold text-sm mb-2">${p.foto_adi}</p>
              <img src="${p.foto_data}" class="w-full rounded mb-2" />
              <button onclick="downloadPhoto('${p.foto_data}', '${p.foto_adi}')" 
                      class="w-full bg-blue-600 text-white py-1 rounded text-sm">
                <i class="fas fa-download mr-1"></i>İndir
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  } catch (error) {
    alert('Fotoğraflar yüklenirken hata oluştu.');
  }
}

// Kolon Röntgen fotoğraf görüntüleme
window.viewKolonRontgenPhotos = async function(kolonKodu) {
  try {
    const { photos } = await api.getPhotos(selectedProject.id, kolonKodu);
    const rontgenPhotos = photos.filter(p => p.foto_tipi && p.foto_tipi.includes('rontgen'));
    
    if (rontgenPhotos.length === 0) {
      alert('Bu kolon için röntgen fotoğrafı bulunamadı.');
      return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div class="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
          <h3 class="text-lg font-bold">${kolonKodu} - Röntgen Fotoğrafları</h3>
          <button onclick="this.closest('.fixed').remove()" class="text-gray-600 hover:text-gray-900">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          ${rontgenPhotos.map(p => `
            <div class="border rounded p-2">
              <p class="font-semibold text-sm mb-2">${p.foto_adi}</p>
              <img src="${p.foto_data}" class="w-full rounded mb-2" />
              <button onclick="downloadPhoto('${p.foto_data}', '${p.foto_adi}')" 
                      class="w-full bg-purple-600 text-white py-1 rounded text-sm">
                <i class="fas fa-download mr-1"></i>İndir
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  } catch (error) {
    alert('Fotoğraflar yüklenirken hata oluştu.');
  }
}

// Perde Röntgen fotoğraf görüntüleme
window.viewPerdeRontgenPhotos = async function(perdeKodu) {
  try {
    const { photos } = await api.getPhotos(selectedProject.id, perdeKodu);
    const rontgenPhotos = photos.filter(p => p.foto_tipi && p.foto_tipi.includes('rontgen'));
    
    if (rontgenPhotos.length === 0) {
      alert('Bu perde için röntgen fotoğrafı bulunamadı.');
      return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div class="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
          <h3 class="text-lg font-bold">${perdeKodu} - Röntgen Fotoğrafları</h3>
          <button onclick="this.closest('.fixed').remove()" class="text-gray-600 hover:text-gray-900">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          ${rontgenPhotos.map(p => `
            <div class="border rounded p-2">
              <p class="font-semibold text-sm mb-2">${p.foto_adi}</p>
              <img src="${p.foto_data}" class="w-full rounded mb-2" />
              <button onclick="downloadPhoto('${p.foto_data}', '${p.foto_adi}')" 
                      class="w-full bg-purple-600 text-white py-1 rounded text-sm">
                <i class="fas fa-download mr-1"></i>İndir
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  } catch (error) {
    alert('Fotoğraflar yüklenirken hata oluştu.');
  }
          <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            <i class="fas fa-plus mr-2"></i>Ekle
          </button>
        </form>
        
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-100">
              <tr>
                <th class="px-3 py-2 text-left">Kolon No</th>
                <th class="px-3 py-2 text-left">Boyutlar</th>
                <th class="px-3 py-2 text-left">Donatı Çapı</th>
                <th class="px-3 py-2 text-left">Adet</th>
                <th class="px-3 py-2 text-left">Beton Sınıfı</th>
                <th class="px-3 py-2 text-left">Notlar</th>
              </tr>
            </thead>
            <tbody>
              ${kolonData.data?.map(d => `
                <tr class="border-t">
                  <td class="px-3 py-2">${d.kolon_no || '-'}</td>
                  <td class="px-3 py-2">${d.kolon_boyutlari || '-'}</td>
                  <td class="px-3 py-2">${d.donatı_çapı || '-'}</td>
                  <td class="px-3 py-2">${d.adet || '-'}</td>
                  <td class="px-3 py-2">${d.beton_sinifi || '-'}</td>
                  <td class="px-3 py-2">${d.notlar || '-'}</td>
                </tr>
              `).join('') || '<tr><td colspan="6" class="text-center py-4 text-gray-500">Henüz veri yok</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Perde Sıyırma -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h3 class="text-xl font-bold mb-4">
          <i class="fas fa-th-large mr-2"></i>Perde Sıyırma
        </h3>
        
        <form id="perdeSiyirmaForm" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input type="text" name="perde_no" placeholder="Perde No" class="px-3 py-2 border rounded" required />
          <input type="text" name="perde_boyutlari" placeholder="Boyutlar (örn: 200x20)" class="px-3 py-2 border rounded" />
          <input type="text" name="donatı_çapı" placeholder="Donatı Çapı" class="px-3 py-2 border rounded" />
          <input type="number" name="adet" placeholder="Adet" class="px-3 py-2 border rounded" />
          <input type="text" name="beton_sinifi" placeholder="Beton Sınıfı" class="px-3 py-2 border rounded" />
          <input type="text" name="notlar" placeholder="Notlar" class="px-3 py-2 border rounded" />
          <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            <i class="fas fa-plus mr-2"></i>Ekle
          </button>
        </form>
        
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-100">
              <tr>
                <th class="px-3 py-2 text-left">Perde No</th>
                <th class="px-3 py-2 text-left">Boyutlar</th>
                <th class="px-3 py-2 text-left">Donatı Çapı</th>
                <th class="px-3 py-2 text-left">Adet</th>
                <th class="px-3 py-2 text-left">Beton Sınıfı</th>
                <th class="px-3 py-2 text-left">Notlar</th>
              </tr>
            </thead>
            <tbody>
              ${perdeData.data?.map(d => `
                <tr class="border-t">
                  <td class="px-3 py-2">${d.perde_no || '-'}</td>
                  <td class="px-3 py-2">${d.perde_boyutlari || '-'}</td>
                  <td class="px-3 py-2">${d.donatı_çapı || '-'}</td>
                  <td class="px-3 py-2">${d.adet || '-'}</td>
                  <td class="px-3 py-2">${d.beton_sinifi || '-'}</td>
                  <td class="px-3 py-2">${d.notlar || '-'}</td>
                </tr>
              `).join('') || '<tr><td colspan="6" class="text-center py-4 text-gray-500">Henüz veri yok</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  
  // Form handlers
  document.getElementById('kolonSiyirmaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {};
    formData.forEach((value, key) => data[key] = value);
    
    await api.createFieldData('kolon-siyirma', selectedProject.id, data);
    showFieldTab('siyirma');
  });
  
  document.getElementById('perdeSiyirmaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {};
    formData.forEach((value, key) => data[key] = value);
    
    await api.createFieldData('perde-siyirma', selectedProject.id, data);
    showFieldTab('siyirma');
  });
}

async function showRontgenForm(content) {
  content.innerHTML = `
    <div class="space-y-6">
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 class="font-bold text-lg">Seçili İş: ${selectedProject.is_no}</h3>
        <p class="text-sm text-gray-600">${selectedProject.adres}</p>
      </div>
      
      <!-- Röntgen Alt Sekmeleri -->
      <div class="border-b border-gray-300 mb-4">
        <div class="flex space-x-4">
          <button onclick="showRontgenSubTab('kolon')" 
                  class="rontgen-subtab px-6 py-3 font-semibold transition-colors border-b-4 border-transparent hover:border-purple-500"
                  data-tab="kolon">
            <i class="fas fa-columns mr-2"></i>Kolon Röntgen
          </button>
          <button onclick="showRontgenSubTab('perde')" 
                  class="rontgen-subtab px-6 py-3 font-semibold transition-colors border-b-4 border-transparent hover:border-purple-500"
                  data-tab="perde">
            <i class="fas fa-th-large mr-2"></i>Perde Röntgen
          </button>
        </div>
      </div>
      
      <div id="rontgenSubContent"></div>
    </div>
  `;
  
  showRontgenSubTab('kolon');
}

async function showRontgenSubTab(subtab) {
  // Tab styling
  document.querySelectorAll('.rontgen-subtab').forEach(btn => {
    if (btn.dataset.tab === subtab) {
      btn.classList.add('border-purple-500', 'text-purple-600');
      btn.classList.remove('text-gray-600');
    } else {
      btn.classList.remove('border-purple-500', 'text-purple-600');
      btn.classList.add('text-gray-600');
    }
  });
  
  const content = document.getElementById('rontgenSubContent');
  
  if (subtab === 'kolon') {
    await showKolonRontgenForm(content);
  } else {
    await showPerdeRontgenForm(content);
  }
}

async function showKolonRontgenForm(content) {
  const roloove = await api.getRoloove(selectedProject.id);
  const kolonlar = roloove.data?.kolonlar || [];
  const kolonData = await api.getFieldData('kolon-rontgen', selectedProject.id);
  
  content.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg p-6">
      <h3 class="text-xl font-bold mb-4">
        <i class="fas fa-x-ray mr-2"></i>Kolon Röntgen
      </h3>
      
      <form id="kolonRontgenForm" class="space-y-4 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Kolon Kodu *</label>
            <select name="kolon_kodu" class="w-full px-3 py-2 border rounded" required>
              <option value="">Kolon seçin</option>
              ${kolonlar.map(k => `<option value="${k.kolon_kodu}">${k.kolon_kodu}</option>`).join('')}
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Kat</label>
            <input type="text" name="kat" class="w-full px-3 py-2 border rounded" />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Donatı Sayısı</label>
            <input type="number" name="donati_sayisi" class="w-full px-3 py-2 border rounded" />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Donatı Çapı</label>
            <input type="text" name="donati_capi" class="w-full px-3 py-2 border rounded" />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Sargı Aralığı</label>
            <input type="text" name="sargi_araligi" class="w-full px-3 py-2 border rounded" />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Notlar</label>
            <input type="text" name="notlar" class="w-full px-3 py-2 border rounded" />
          </div>
        </div>
        
        <!-- Fotoğraflar Bölümü -->
        <div class="border-t pt-4 mt-4">
          <h4 class="font-semibold mb-3">Röntgen Fotoğrafları</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${['Röntgen Görüntüsü 1', 'Röntgen Görüntüsü 2'].map((label, idx) => `
              <div class="border rounded p-3">
                <label class="block text-sm font-medium mb-2">${label}</label>
                <div class="flex gap-2 mb-2">
                  <button type="button" onclick="capturePhoto('kolon_rontgen_${idx+1}')" 
                          class="flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600">
                    <i class="fas fa-camera mr-1"></i>Kamera
                  </button>
                  <button type="button" onclick="selectPhotoFromGallery('kolon_rontgen_${idx+1}')" 
                          class="flex-1 bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600">
                    <i class="fas fa-image mr-1"></i>Galeri
                  </button>
                </div>
                <input type="hidden" name="foto_rontgen_${idx+1}" id="foto_rontgen_kolon_${idx+1}" />
                <div id="preview_kolon_rontgen_${idx+1}" class="text-xs text-gray-500"></div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <button type="submit" class="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-semibold">
          <i class="fas fa-save mr-2"></i>Kaydet
        </button>
      </form>
      
      <!-- Kayıtlı Kolonlar -->
      <div class="border-t pt-4">
        <h4 class="font-semibold mb-3">Kayıtlı Kolon Röntgenleri</h4>
        <div class="space-y-2">
          ${kolonData.data?.length > 0 ? 
            kolonData.data.map(d => `
              <div class="border rounded p-3 bg-gray-50">
                <div class="flex justify-between items-start">
                  <div>
                    <span class="font-bold text-purple-600">${d.kolon_kodu || d.kolon_no || '-'}</span>
                    ${d.kat ? `<span class="text-sm text-gray-600 ml-2">Kat: ${d.kat}</span>` : ''}
                  </div>
                  <button onclick="viewKolonRontgenPhotos('${d.kolon_kodu || d.kolon_no}')" 
                          class="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
                    <i class="fas fa-images mr-1"></i>Fotoğraflar
                  </button>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm">
                  <div><span class="text-gray-600">Donatı Sayısı:</span> ${d.donati_sayisi || d.donatı_sayisi || '-'}</div>
                  <div><span class="text-gray-600">Donatı Çapı:</span> ${d.donati_capi || d.donatı_çapı || '-'}</div>
                  <div><span class="text-gray-600">Sargı Aralığı:</span> ${d.sargi_araligi || d.sargı_araligi || '-'}</div>
                  <div><span class="text-gray-600">Notlar:</span> ${d.notlar || '-'}</div>
                </div>
              </div>
            `).join('') 
            : '<p class="text-center text-gray-500 py-4">Henüz röntgen verisi eklenmemiş</p>'
          }
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('kolonRontgenForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Fotoğrafları ekle
    data.foto_rontgen_1 = document.getElementById('foto_rontgen_kolon_1')?.value || '';
    data.foto_rontgen_2 = document.getElementById('foto_rontgen_kolon_2')?.value || '';
    
    await api.createFieldData('kolon-rontgen', selectedProject.id, data);
    showFieldTab('rontgen');
  });
}

async function showPerdeRontgenForm(content) {
  const roloove = await api.getRoloove(selectedProject.id);
  const perdeler = roloove.data?.perdeler || [];
  const perdeData = await api.getFieldData('perde-rontgen', selectedProject.id);
  
  content.innerHTML = `
    <div class="bg-white rounded-lg shadow-lg p-6">
      <h3 class="text-xl font-bold mb-4">
        <i class="fas fa-x-ray mr-2"></i>Perde Röntgen
      </h3>
      
      <form id="perdeRontgenForm" class="space-y-4 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Perde Kodu *</label>
            <select name="perde_kodu" class="w-full px-3 py-2 border rounded" required>
              <option value="">Perde seçin</option>
              ${perdeler.map(p => `<option value="${p.perde_kodu}">${p.perde_kodu}</option>`).join('')}
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Kat</label>
            <input type="text" name="kat" class="w-full px-3 py-2 border rounded" />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Donatı Sayısı</label>
            <input type="number" name="donati_sayisi" class="w-full px-3 py-2 border rounded" />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Donatı Çapı</label>
            <input type="text" name="donati_capi" class="w-full px-3 py-2 border rounded" />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Sargı Aralığı</label>
            <input type="text" name="sargi_araligi" class="w-full px-3 py-2 border rounded" />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Notlar</label>
            <input type="text" name="notlar" class="w-full px-3 py-2 border rounded" />
          </div>
        </div>
        
        <!-- Fotoğraflar Bölümü -->
        <div class="border-t pt-4 mt-4">
          <h4 class="font-semibold mb-3">Röntgen Fotoğrafları</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${['Röntgen Görüntüsü 1', 'Röntgen Görüntüsü 2'].map((label, idx) => `
              <div class="border rounded p-3">
                <label class="block text-sm font-medium mb-2">${label}</label>
                <div class="flex gap-2 mb-2">
                  <button type="button" onclick="capturePhoto('perde_rontgen_${idx+1}')" 
                          class="flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600">
                    <i class="fas fa-camera mr-1"></i>Kamera
                  </button>
                  <button type="button" onclick="selectPhotoFromGallery('perde_rontgen_${idx+1}')" 
                          class="flex-1 bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600">
                    <i class="fas fa-image mr-1"></i>Galeri
                  </button>
                </div>
                <input type="hidden" name="foto_rontgen_${idx+1}" id="foto_rontgen_perde_${idx+1}" />
                <div id="preview_perde_rontgen_${idx+1}" class="text-xs text-gray-500"></div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <button type="submit" class="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-semibold">
          <i class="fas fa-save mr-2"></i>Kaydet
        </button>
      </form>
      
      <!-- Kayıtlı Perdeler -->
      <div class="border-t pt-4">
        <h4 class="font-semibold mb-3">Kayıtlı Perde Röntgenleri</h4>
        <div class="space-y-2">
          ${perdeData.data?.length > 0 ? 
            perdeData.data.map(d => `
              <div class="border rounded p-3 bg-gray-50">
                <div class="flex justify-between items-start">
                  <div>
                    <span class="font-bold text-purple-600">${d.perde_kodu || d.perde_no || '-'}</span>
                    ${d.kat ? `<span class="text-sm text-gray-600 ml-2">Kat: ${d.kat}</span>` : ''}
                  </div>
                  <button onclick="viewPerdeRontgenPhotos('${d.perde_kodu || d.perde_no}')" 
                          class="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
                    <i class="fas fa-images mr-1"></i>Fotoğraflar
                  </button>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm">
                  <div><span class="text-gray-600">Donatı Sayısı:</span> ${d.donati_sayisi || d.donatı_sayisi || '-'}</div>
                  <div><span class="text-gray-600">Donatı Çapı:</span> ${d.donati_capi || d.donatı_çapı || '-'}</div>
                  <div><span class="text-gray-600">Sargı Aralığı:</span> ${d.sargi_araligi || d.sargı_araligi || '-'}</div>
                  <div><span class="text-gray-600">Notlar:</span> ${d.notlar || '-'}</div>
                </div>
              </div>
            `).join('') 
            : '<p class="text-center text-gray-500 py-4">Henüz röntgen verisi eklenmemiş</p>'
          }
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('perdeRontgenForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Fotoğrafları ekle
    data.foto_rontgen_1 = document.getElementById('foto_rontgen_perde_1')?.value || '';
    data.foto_rontgen_2 = document.getElementById('foto_rontgen_perde_2')?.value || '';
    
    await api.createFieldData('perde-rontgen', selectedProject.id, data);
    showFieldTab('rontgen');
  });
        </div>
      </div>
    </div>
  `;
  
  // Form handlers
  document.getElementById('kolonRontgenForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {};
    formData.forEach((value, key) => data[key] = value);
    
    await api.createFieldData('kolon-rontgen', selectedProject.id, data);
    showFieldTab('rontgen');
  });
  
  document.getElementById('perdeRontgenForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {};
    formData.forEach((value, key) => data[key] = value);
    
    await api.createFieldData('perde-rontgen', selectedProject.id, data);
    showFieldTab('rontgen');
  });
}

async function showKarotForm(content) {
  const karotData = await api.getFieldData('karot', selectedProject.id);
  
  content.innerHTML = `
    <div class="space-y-6">
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 class="font-bold text-lg">Seçili İş: ${selectedProject.is_no}</h3>
        <p class="text-sm text-gray-600">${selectedProject.adres}</p>
      </div>
      
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h3 class="text-xl font-bold mb-4">
          <i class="fas fa-vial mr-2"></i>Karot Deneyi
        </h3>
        
        <form id="karotForm" class="space-y-4 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Karot No *</label>
              <input type="text" name="karot_no" placeholder="Ör: KRT-01" class="w-full px-3 py-2 border rounded" required />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Eleman Kodu</label>
              <input type="text" name="eleman_kodu" placeholder="Ör: SZ01" class="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Kat</label>
              <input type="text" name="kat" placeholder="Ör: Zemin" class="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Lokasyon</label>
              <input type="text" name="lokasyon" placeholder="Ör: Salon" class="w-full px-3 py-2 border rounded" />
            </div>
          </div>
          
          <!-- Otomatik Hesaplama Bölümü -->
          <div class="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-300 rounded-lg p-4">
            <h4 class="font-semibold mb-3 text-orange-900">
              <i class="fas fa-calculator mr-2"></i>Otomatik fb & fck Hesaplama
            </h4>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Çap (mm) *</label>
                <input type="number" step="0.01" name="cap_mm" id="karotCap" 
                       placeholder="Ör: 94" class="w-full px-3 py-2 border rounded" 
                       onchange="calculateKarot()" required />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Boy (mm)</label>
                <input type="number" step="0.01" name="boy_mm" 
                       placeholder="Ör: 150" class="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Kırılma Yükü (kN) *</label>
                <input type="number" step="0.01" name="kirilma_yuku_kn" id="karotYuk" 
                       placeholder="Ör: 185.5" class="w-full px-3 py-2 border rounded" 
                       onchange="calculateKarot()" required />
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div class="bg-white rounded-lg p-3 border-2 border-orange-400">
                <label class="block text-sm font-medium mb-1 text-orange-700">fb (MPa) - Otomatik</label>
                <input type="number" step="0.01" name="fb_mpa" id="karotFb" readonly
                       class="w-full px-3 py-2 border rounded bg-gray-100 font-bold text-lg text-orange-600" 
                       placeholder="Otomatik hesaplanacak" />
              </div>
              <div class="bg-white rounded-lg p-3 border-2 border-red-400">
                <label class="block text-sm font-medium mb-1 text-red-700">fck (MPa) - Otomatik</label>
                <input type="number" step="0.01" name="fck_mpa" id="karotFck" readonly
                       class="w-full px-3 py-2 border rounded bg-gray-100 font-bold text-lg text-red-600" 
                       placeholder="Otomatik hesaplanacak" />
              </div>
            </div>
            
            <div class="mt-3 text-xs text-gray-700 bg-white rounded p-2">
              <i class="fas fa-info-circle text-blue-500 mr-1"></i>
              <strong>Formüller:</strong> 
              fb = (Kırılma Yükü × 1000) / (π × (Çap/2)²) | 
              fck ≈ 0.85 × fb
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Test Tarihi</label>
              <input type="date" name="test_tarihi" class="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Karot Var mı?</label>
              <select name="karot_var" class="w-full px-3 py-2 border rounded">
                <option value="var">Var</option>
                <option value="yok">Yok</option>
              </select>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Notlar</label>
            <textarea name="notlar" rows="2" placeholder="Ek notlar..." 
                      class="w-full px-3 py-2 border rounded"></textarea>
          </div>
          
          <button type="submit" class="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:to-red-600 font-semibold">
            <i class="fas fa-save mr-2"></i>Kaydet
          </button>
        </form>
        
        <!-- Karot Listesi -->
        <div class="border-t pt-4">
          <h4 class="font-semibold mb-3">Kayıtlı Karotlar</h4>
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-100">
                <tr>
                  <th class="px-3 py-2 text-left">Karot No</th>
                  <th class="px-3 py-2 text-left">Eleman</th>
                  <th class="px-3 py-2 text-left">Kat</th>
                  <th class="px-3 py-2 text-left">Çap (mm)</th>
                  <th class="px-3 py-2 text-left">Boy (mm)</th>
                  <th class="px-3 py-2 text-left">Yük (kN)</th>
                  <th class="px-3 py-2 text-left">fb (MPa)</th>
                  <th class="px-3 py-2 text-left">fck (MPa)</th>
                  <th class="px-3 py-2 text-left">Test Tarihi</th>
                </tr>
              </thead>
              <tbody>
                ${karotData.data?.map(d => `
                  <tr class="border-t hover:bg-gray-50">
                    <td class="px-3 py-2 font-semibold">${d.karot_no || d.numune_no || '-'}</td>
                    <td class="px-3 py-2">${d.eleman_kodu || d.lokasyon || '-'}</td>
                    <td class="px-3 py-2">${d.kat || '-'}</td>
                    <td class="px-3 py-2">${d.cap_mm || d.cap || '-'}</td>
                    <td class="px-3 py-2">${d.boy_mm || d.uzunluk || '-'}</td>
                    <td class="px-3 py-2">${d.kirilma_yuku_kn || '-'}</td>
                    <td class="px-3 py-2 font-bold text-orange-600">${d.fb_mpa || d.basınc_dayanimi || '-'}</td>
                    <td class="px-3 py-2 font-bold text-red-600">${d.fck_mpa || '-'}</td>
                    <td class="px-3 py-2">${d.test_tarihi || '-'}</td>
                  </tr>
                `).join('') || '<tr><td colspan="9" class="text-center py-4 text-gray-500">Henüz karot verisi eklenmemiş</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('karotForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {};
    formData.forEach((value, key) => data[key] = value);
    
    await api.createFieldData('karot', selectedProject.id, data);
    showFieldTab('karot');
  });
}

// Karot hesaplama fonksiyonu
window.calculateKarot = function() {
  const cap = parseFloat(document.getElementById('karotCap')?.value);
  const yuk = parseFloat(document.getElementById('karotYuk')?.value);
  
  if (!cap || !yuk || cap <= 0 || yuk <= 0) {
    document.getElementById('karotFb').value = '';
    document.getElementById('karotFck').value = '';
    return;
  }
  
  // Çapı metre cinsine çevir
  const cap_m = cap / 1000;
  
  // Kesit alanı (m²)
  const alan = Math.PI * Math.pow(cap_m / 2, 2);
  
  // Yükü Newton'a çevir
  const yuk_n = yuk * 1000;
  
  // fb hesapla (MPa)
  const fb = yuk_n / (alan * 1000000);
  
  // fck tahmin et (yaklaşık 0.85 * fb)
  const fck = fb * 0.85;
  
  document.getElementById('karotFb').value = fb.toFixed(2);
  document.getElementById('karotFck').value = fck.toFixed(2);
}
}

async function showSchmidtForm(content) {
  const schmidtData = await api.getFieldData('schmidt', selectedProject.id);
  
  content.innerHTML = `
    <div class="space-y-6">
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 class="font-bold text-lg">Seçili İş: ${selectedProject.is_no}</h3>
        <p class="text-sm text-gray-600">${selectedProject.adres}</p>
      </div>
      
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h3 class="text-xl font-bold mb-4">
          <i class="fas fa-hammer mr-2"></i>Schmidt Çekici Deneyi
        </h3>
        
        <form id="schmidtForm" class="space-y-4 mb-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input type="text" name="test_no" placeholder="Test No" class="px-3 py-2 border rounded" required />
            <input type="text" name="lokasyon" placeholder="Lokasyon" class="px-3 py-2 border rounded" />
            <input type="text" name="kat" placeholder="Kat" class="px-3 py-2 border rounded" />
            <input type="text" name="eleman_tipi" placeholder="Eleman (Kolon/Perde/Kiriş)" class="px-3 py-2 border rounded" />
          </div>
          
          <!-- Otomatik Değer Üretici -->
          <div class="bg-blue-50 border border-blue-300 rounded-lg p-4">
            <h4 class="font-semibold mb-3 text-blue-900">
              <i class="fas fa-magic mr-2"></i>Otomatik Değer Üretici
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label class="block text-sm font-medium mb-1">Ortalama Değer</label>
                <input type="number" id="autoAvg" placeholder="Ör: 45" class="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Sapma Aralığı (±)</label>
                <input type="number" id="autoRange" value="8" placeholder="Ör: 8" class="w-full px-3 py-2 border rounded" />
              </div>
              <div class="flex items-end">
                <button type="button" onclick="autoGenerateSchmidt()" 
                        class="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded hover:from-blue-600 hover:to-blue-700">
                  <i class="fas fa-bolt mr-2"></i>Otomatik Üret
                </button>
              </div>
            </div>
            <p class="text-xs text-gray-600 mt-2">
              <i class="fas fa-info-circle mr-1"></i>
              Ortalama değer ve sapma aralığı girerek 10 okuma değerini otomatik oluşturabilirsiniz.
            </p>
          </div>
          
          <div class="bg-gray-50 p-4 rounded">
            <div class="flex justify-between items-center mb-3">
              <h4 class="font-semibold">10 Okuma Değeri:</h4>
              <button type="button" onclick="clearSchmidtReadings()" 
                      class="text-sm text-red-600 hover:text-red-700">
                <i class="fas fa-eraser mr-1"></i>Temizle
              </button>
            </div>
            <div class="grid grid-cols-5 gap-3">
              <input type="number" name="okuma_1" id="okuma_1" placeholder="R1" class="px-3 py-2 border rounded" onchange="calculateSchmidtAverage()" />
              <input type="number" name="okuma_2" id="okuma_2" placeholder="R2" class="px-3 py-2 border rounded" onchange="calculateSchmidtAverage()" />
              <input type="number" name="okuma_3" id="okuma_3" placeholder="R3" class="px-3 py-2 border rounded" onchange="calculateSchmidtAverage()" />
              <input type="number" name="okuma_4" id="okuma_4" placeholder="R4" class="px-3 py-2 border rounded" onchange="calculateSchmidtAverage()" />
              <input type="number" name="okuma_5" id="okuma_5" placeholder="R5" class="px-3 py-2 border rounded" onchange="calculateSchmidtAverage()" />
              <input type="number" name="okuma_6" id="okuma_6" placeholder="R6" class="px-3 py-2 border rounded" onchange="calculateSchmidtAverage()" />
              <input type="number" name="okuma_7" id="okuma_7" placeholder="R7" class="px-3 py-2 border rounded" onchange="calculateSchmidtAverage()" />
              <input type="number" name="okuma_8" id="okuma_8" placeholder="R8" class="px-3 py-2 border rounded" onchange="calculateSchmidtAverage()" />
              <input type="number" name="okuma_9" id="okuma_9" placeholder="R9" class="px-3 py-2 border rounded" onchange="calculateSchmidtAverage()" />
              <input type="number" name="okuma_10" id="okuma_10" placeholder="R10" class="px-3 py-2 border rounded" onchange="calculateSchmidtAverage()" />
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Ortalama (Otomatik)</label>
              <input type="number" step="0.01" name="ortalama" id="schmidtAverage" readonly 
                     class="w-full px-3 py-2 border rounded bg-gray-100" placeholder="Otomatik hesaplanacak" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Tahmini Dayanım (MPa)</label>
              <input type="number" step="0.01" name="tahmini_dayanim" 
                     class="w-full px-3 py-2 border rounded" placeholder="Ör: 25.5" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Test Tarihi</label>
              <input type="date" name="test_tarihi" class="w-full px-3 py-2 border rounded" />
            </div>
          </div>
          
          <input type="text" name="notlar" placeholder="Notlar" class="w-full px-3 py-2 border rounded" />
          
          <button type="submit" class="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold">
            <i class="fas fa-save mr-2"></i>Kaydet
          </button>
        </form>
        
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-100">
              <tr>
                <th class="px-3 py-2 text-left">Test No</th>
                <th class="px-3 py-2 text-left">Eleman</th>
                <th class="px-3 py-2 text-left">Lokasyon</th>
                <th class="px-3 py-2 text-left">Kat</th>
                <th class="px-3 py-2 text-left">Ortalama</th>
                <th class="px-3 py-2 text-left">Tahmini Dayanım</th>
                <th class="px-3 py-2 text-left">Test Tarihi</th>
                <th class="px-3 py-2 text-left">Notlar</th>
              </tr>
            </thead>
            <tbody>
              ${schmidtData.data?.map(d => `
                <tr class="border-t">
                  <td class="px-3 py-2">${d.test_no || '-'}</td>
                  <td class="px-3 py-2">${d.eleman_tipi || '-'}</td>
                  <td class="px-3 py-2">${d.lokasyon || '-'}</td>
                  <td class="px-3 py-2">${d.kat || '-'}</td>
                  <td class="px-3 py-2 font-bold">${d.ortalama || '-'}</td>
                  <td class="px-3 py-2">${d.tahmini_dayanim || '-'}</td>
                  <td class="px-3 py-2">${d.test_tarihi || '-'}</td>
                  <td class="px-3 py-2">${d.notlar || '-'}</td>
                </tr>
              `).join('') || '<tr><td colspan="8" class="text-center py-4 text-gray-500">Henüz veri yok</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('schmidtForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {};
    formData.forEach((value, key) => data[key] = value);
    
    await api.createFieldData('schmidt', selectedProject.id, data);
    showFieldTab('schmidt');
  });
}

// Schmidt otomatik değer üretici
window.autoGenerateSchmidt = function() {
  const avg = parseFloat(document.getElementById('autoAvg').value);
  const range = parseFloat(document.getElementById('autoRange').value) || 8;
  
  if (!avg || avg < 10 || avg > 70) {
    alert('Lütfen geçerli bir ortalama değer girin (10-70 arası)');
    return;
  }
  
  const values = generateSchmidtValues(avg, range);
  
  for (let i = 0; i < 10; i++) {
    document.getElementById(`okuma_${i+1}`).value = values[i];
  }
  
  calculateSchmidtAverage();
  
  // Success animation
  const btn = event.target;
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-check mr-2"></i>Başarılı!';
  btn.classList.add('bg-green-500');
  setTimeout(() => {
    btn.innerHTML = originalText;
    btn.classList.remove('bg-green-500');
  }, 1500);
}

// Schmidt okumalarını temizle
window.clearSchmidtReadings = function() {
  for (let i = 1; i <= 10; i++) {
    document.getElementById(`okuma_${i}`).value = '';
  }
  document.getElementById('schmidtAverage').value = '';
}

// Schmidt ortalama hesapla
window.calculateSchmidtAverage = function() {
  const values = [];
  for (let i = 1; i <= 10; i++) {
    const val = parseFloat(document.getElementById(`okuma_${i}`)?.value);
    if (!isNaN(val)) values.push(val);
  }
  
  if (values.length > 0) {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    document.getElementById('schmidtAverage').value = avg.toFixed(2);
  } else {
    document.getElementById('schmidtAverage').value = '';
  }
}
                </tr>
              `).join('') || '<tr><td colspan="7" class="text-center py-4 text-gray-500">Henüz veri yok</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('schmidtForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {};
    formData.forEach((value, key) => data[key] = value);
    
    await api.createFieldData('schmidt', selectedProject.id, data);
    showFieldTab('schmidt');
  });
}

// Utility functions
function updateIlceOptions(il) {
  const ilceSelect = document.getElementById('ilceSelect');
  const ilceler = ilIlceData[il] || [];
  
  ilceSelect.innerHTML = ilceler.map(ilce => 
    `<option value="${ilce}">${ilce}</option>`
  ).join('');
}

function getDurumColor(durum) {
  const colors = {
    'Beklemede': 'bg-yellow-100 text-yellow-800',
    'Sahada': 'bg-blue-100 text-blue-800',
    'Lab Bekliyor': 'bg-purple-100 text-purple-800',
    'Analizde': 'bg-orange-100 text-orange-800',
    'Tamamlandı': 'bg-green-100 text-green-800'
  };
  return colors[durum] || 'bg-gray-100 text-gray-800';
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric',
    weekday: 'long'
  });
}

// Initialize on load
window.addEventListener('DOMContentLoaded', init);

// Make functions global
window.login = login;
window.logout = logout;
window.showTab = showTab;
window.showFieldTab = showFieldTab;
window.selectProjectForFieldWork = selectProjectForFieldWork;

// ==================== RÖLÖVE FUNCTIONS ====================

let currentRoloove = null;
let currentSubTab = 'kolon'; // 'kolon' or 'perde' for siyirma/rontgen

async function showRolooveTab(content) {
  if (!selectedProject) {
    content.innerHTML = `
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <i class="fas fa-exclamation-triangle text-yellow-600 text-3xl mb-3"></i>
        <p class="text-gray-700">Lütfen önce "Görevlerim" sekmesinden bir iş seçiniz.</p>
        <button onclick="showFieldTab('gorevler')" class="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
          Görevlere Dön
        </button>
      </div>
    `;
    return;
  }
  
  // Load rölöve if exists
  const rolooveData = await api.getRoloove(selectedProject.id);
  currentRoloove = rolooveData.roloove;
  
  if (!currentRoloove) {
    // Show rölöve creation form
    showRolooveCreateForm(content);
  } else {
    // Show existing rölöve
    showRolooveView(content, rolooveData);
  }
}

function showRolooveCreateForm(content) {
  content.innerHTML = `
    <div class="space-y-6">
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 class="font-bold text-lg">Seçili İş: ${selectedProject.is_no}</h3>
        <p class="text-sm text-gray-600">${selectedProject.adres}</p>
      </div>
      
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h3 class="text-xl font-bold mb-4">
          <i class="fas fa-drafting-compass mr-2"></i>Rölöve Bilgileri
        </h3>
        
        <form id="rolooveForm" class="space-y-4">
          <!-- Rölöve resmi yükleme -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Rölöve Fotoğrafı (Kamera veya Galeri)
            </label>
            <div class="flex gap-2">
              <button type="button" onclick="captureRolooveImage()" class="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                <i class="fas fa-camera mr-2"></i>Kamera ile Çek
              </button>
              <label class="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 text-center cursor-pointer">
                <i class="fas fa-images mr-2"></i>Galeriden Seç
                <input type="file" id="rolooveImageInput" accept="image/*" class="hidden" onchange="handleRolooveImage(event)" />
              </label>
            </div>
            <div id="rolooveImagePreview" class="mt-3"></div>
            <input type="hidden" id="rolooveImageData" name="roloove_image" />
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">İnceleme Katı *</label>
              <select name="inceleme_kati" id="incelemeKatiSelect" class="w-full px-3 py-2 border rounded" required>
                <option value="">Seçiniz</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Kat Sayısı *</label>
              <input type="number" name="kat_sayisi" id="katSayisiInput" min="1" max="30" class="w-full px-3 py-2 border rounded" required />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Bodrum Kat Sayısı</label>
              <input type="number" name="bodrum_kat_sayisi" id="bodrumKatInput" min="0" max="10" value="0" class="w-full px-3 py-2 border rounded" />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Kolon Sayısı *</label>
              <input type="number" name="kolon_sayisi" id="kolonSayisiInput" min="1" class="w-full px-3 py-2 border rounded" required />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Perde Sayısı</label>
              <input type="number" name="perde_sayisi" id="perdeSayisiInput" min="0" value="0" class="w-full px-3 py-2 border rounded" />
            </div>
          </div>
          
          <!-- Kat Yükseklikleri -->
          <div id="katYukseklikleriContainer" class="hidden">
            <h4 class="font-semibold mb-2">Kat Yükseklikleri (metre)</h4>
            <div id="katYukseklikleriInputs" class="grid grid-cols-2 md:grid-cols-4 gap-3"></div>
          </div>
          
          <!-- Kolon Boyutları -->
          <div id="kolonBoyutlariContainer" class="hidden">
            <h4 class="font-semibold mb-2">Kolon Boyutları (cm)</h4>
            <div id="kolonBoyutlariInputs" class="space-y-2"></div>
          </div>
          
          <div class="flex justify-end space-x-4 mt-6">
            <button type="button" onclick="showFieldTab('gorevler')" class="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">
              İptal
            </button>
            <button type="submit" class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              <i class="fas fa-save mr-2"></i>Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  // Generate inceleme katı options
  generateIncelemeKatiOptions();
  
  // Listen to kat sayısı changes
  document.getElementById('katSayisiInput').addEventListener('input', generateKatYukseklikleri);
  document.getElementById('bodrumKatInput').addEventListener('input', generateKatYukseklikleri);
  document.getElementById('kolonSayisiInput').addEventListener('input', generateKolonBoyutlari);
  document.getElementById('incelemeKatiSelect').addEventListener('change', generateKolonKodlari);
  
  // Form submit
  document.getElementById('rolooveForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveRoloove();
  });
}

function generateIncelemeKatiOptions() {
  const select = document.getElementById('incelemeKatiSelect');
  let options = '<option value="">Seçiniz</option>';
  
  // Bodrum katlar
  for (let i = 10; i >= 1; i--) {
    options += `<option value="${i}. Bodrum Kat">${i}. Bodrum Kat</option>`;
  }
  
  // Zemin kat
  options += '<option value="Zemin Kat">Zemin Kat</option>';
  
  // Normal katlar
  for (let i = 1; i <= 30; i++) {
    options += `<option value="${i}. Kat">${i}. Kat</option>`;
  }
  
  select.innerHTML = options;
}

function generateKatYukseklikleri() {
  const katSayisi = parseInt(document.getElementById('katSayisiInput').value) || 0;
  const bodrumKat = parseInt(document.getElementById('bodrumKatInput').value) || 0;
  
  if (katSayisi === 0) {
    document.getElementById('katYukseklikleriContainer').classList.add('hidden');
    return;
  }
  
  document.getElementById('katYukseklikleriContainer').classList.remove('hidden');
  const container = document.getElementById('katYukseklikleriInputs');
  let html = '';
  
  // Bodrum katlar
  for (let i = bodrumKat; i >= 1; i--) {
    html += `
      <div>
        <label class="text-xs text-gray-600">${i}. Bodrum</label>
        <input type="number" step="0.01" class="w-full px-2 py-1 border rounded text-sm" 
               data-kat-no="${-i}" data-kat-adi="${i}. Bodrum Kat" placeholder="m" />
      </div>
    `;
  }
  
  // Zemin kat
  html += `
    <div>
      <label class="text-xs text-gray-600">Zemin Kat</label>
      <input type="number" step="0.01" class="w-full px-2 py-1 border rounded text-sm" 
             data-kat-no="0" data-kat-adi="Zemin Kat" placeholder="m" />
    </div>
  `;
  
  // Normal katlar
  for (let i = 1; i <= katSayisi; i++) {
    html += `
      <div>
        <label class="text-xs text-gray-600">${i}. Kat</label>
        <input type="number" step="0.01" class="w-full px-2 py-1 border rounded text-sm" 
               data-kat-no="${i}" data-kat-adi="${i}. Kat" placeholder="m" />
      </div>
    `;
  }
  
  container.innerHTML = html;
}

function generateKolonBoyutlari() {
  const kolonSayisi = parseInt(document.getElementById('kolonSayisiInput').value) || 0;
  
  if (kolonSayisi === 0) {
    document.getElementById('kolonBoyutlariContainer').classList.add('hidden');
    return;
  }
  
  generateKolonKodlari();
}

function generateKolonKodlari() {
  const kolonSayisi = parseInt(document.getElementById('kolonSayisiInput').value) || 0;
  const incelemeKati = document.getElementById('incelemeKatiSelect').value;
  
  if (kolonSayisi === 0 || !incelemeKati) {
    document.getElementById('kolonBoyutlariContainer').classList.add('hidden');
    return;
  }
  
  document.getElementById('kolonBoyutlariContainer').classList.remove('hidden');
  
  // Determine prefix based on inceleme katı
  let prefix = 'S';
  if (incelemeKati === 'Zemin Kat') {
    prefix = 'SZ';
  } else if (incelemeKati.includes('Bodrum')) {
    const bodrumNo = incelemeKati.match(/\d+/)[0];
    prefix = `SB${bodrumNo}`;
  } else {
    const katNo = incelemeKati.match(/\d+/)[0];
    prefix = `S${katNo}`;
  }
  
  const container = document.getElementById('kolonBoyutlariInputs');
  let html = '';
  
  for (let i = 1; i <= kolonSayisi; i++) {
    const kolonKodu = `${prefix}${String(i).padStart(2, '0')}`;
    html += `
      <div class="flex items-center gap-2 p-2 bg-gray-50 rounded">
        <span class="font-mono font-bold text-sm w-16">${kolonKodu}</span>
        <input type="number" step="0.01" placeholder="Geniş (cm)" 
               class="w-24 px-2 py-1 border rounded text-sm kolon-genis" 
               data-kolon-kod="${kolonKodu}" />
        <span class="text-gray-400">x</span>
        <input type="number" step="0.01" placeholder="Dar (cm)" 
               class="w-24 px-2 py-1 border rounded text-sm kolon-dar" 
               data-kolon-kod="${kolonKodu}" />
        <button type="button" onclick="swapKolonDimensions('${kolonKodu}')" 
                class="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600">
          <i class="fas fa-exchange-alt"></i> Değiştir
        </button>
      </div>
    `;
  }
  
  container.innerHTML = html;
  
  // Copy first value to all
  container.addEventListener('input', (e) => {
    if (e.target.classList.contains('kolon-genis') || e.target.classList.contains('kolon-dar')) {
      const isGenis = e.target.classList.contains('kolon-genis');
      const value = e.target.value;
      const allInputs = container.querySelectorAll(isGenis ? '.kolon-genis' : '.kolon-dar');
      
      // Only copy if it's the first input and it's being filled for the first time
      if (allInputs[0] === e.target && value) {
        let shouldCopy = true;
        for (let i = 1; i < allInputs.length; i++) {
          if (allInputs[i].value) {
            shouldCopy = false;
            break;
          }
        }
        
        if (shouldCopy) {
          for (let i = 1; i < allInputs.length; i++) {
            allInputs[i].value = value;
          }
        }
      }
    }
  });
}

window.swapKolonDimensions = function(kolonKodu) {
  const genisInput = document.querySelector(`input.kolon-genis[data-kolon-kod="${kolonKodu}"]`);
  const darInput = document.querySelector(`input.kolon-dar[data-kolon-kod="${kolonKodu}"]`);
  
  const temp = genisInput.value;
  genisInput.value = darInput.value;
  darInput.value = temp;
};

async function saveRoloove() {
  const incelemeKati = document.getElementById('incelemeKatiSelect').value;
  const katSayisi = parseInt(document.getElementById('katSayisiInput').value);
  const bodrumKatSayisi = parseInt(document.getElementById('bodrumKatInput').value) || 0;
  const kolonSayisi = parseInt(document.getElementById('kolonSayisiInput').value);
  const perdeSayisi = parseInt(document.getElementById('perdeSayisiInput').value) || 0;
  const rolooveImage = document.getElementById('rolooveImageData').value;
  
  // Collect kat yükseklikleri
  const katYukseklikleri = [];
  document.querySelectorAll('#katYukseklikleriInputs input').forEach(input => {
    if (input.value) {
      katYukseklikleri.push({
        kat_no: parseInt(input.dataset.katNo),
        kat_adi: input.dataset.katAdi,
        yukseklik: parseFloat(input.value)
      });
    }
  });
  
  // Collect kolon tanımları
  const kolonTanimlari = [];
  const genisInputs = document.querySelectorAll('.kolon-genis');
  genisInputs.forEach(input => {
    const kolonKodu = input.dataset.kolonKod;
    const darInput = document.querySelector(`.kolon-dar[data-kolon-kod="${kolonKodu}"]`);
    
    if (input.value && darInput.value) {
      kolonTanimlari.push({
        kolon_kodu: kolonKodu,
        genis_yuzey: parseFloat(input.value),
        dar_yuzey: parseFloat(darInput.value),
        yon_ters: 0
      });
    }
  });
  
  const data = {
    roloove_image: rolooveImage,
    inceleme_kati: incelemeKati,
    kat_sayisi: katSayisi,
    bodrum_kat_sayisi: bodrumKatSayisi,
    kolon_sayisi: kolonSayisi,
    perde_sayisi: perdeSayisi,
    kat_yukseklikleri: katYukseklikleri,
    kolon_tanimlari: kolonTanimlari,
    perde_tanimlari: [] // TODO: Add perde support
  };
  
  try {
    await api.createRoloove(selectedProject.id, data);
    alert('Rölöve başarıyla kaydedildi!');
    showFieldTab('roloove'); // Reload
  } catch (error) {
    alert('Hata oluştu: ' + error.message);
  }
}

window.captureRolooveImage = async function() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-4 max-w-2xl">
        <video id="cameraPreview" autoplay class="w-full rounded mb-4"></video>
        <div class="flex gap-2">
          <button onclick="takePicture()" class="flex-1 bg-green-600 text-white py-2 rounded">
            <i class="fas fa-camera mr-2"></i>Fotoğraf Çek
          </button>
          <button onclick="closeCamera()" class="flex-1 bg-red-600 text-white py-2 rounded">
            <i class="fas fa-times mr-2"></i>İptal
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    const modalVideo = modal.querySelector('#cameraPreview');
    modalVideo.srcObject = stream;
    
    window.cameraStream = stream;
    window.cameraModal = modal;
  } catch (error) {
    alert('Kamera erişimi reddedildi veya kamera bulunamadı.');
  }
};

window.takePicture = function() {
  const video = document.getElementById('cameraPreview');
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  
  const imageData = canvas.toDataURL('image/jpeg');
  document.getElementById('rolooveImageData').value = imageData;
  
  const preview = document.getElementById('rolooveImagePreview');
  preview.innerHTML = `<img src="${imageData}" class="w-full max-w-md rounded border" />`;
  
  closeCamera();
};

window.closeCamera = function() {
  if (window.cameraStream) {
    window.cameraStream.getTracks().forEach(track => track.stop());
    window.cameraStream = null;
  }
  if (window.cameraModal) {
    window.cameraModal.remove();
    window.cameraModal = null;
  }
};

window.handleRolooveImage = function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const imageData = e.target.result;
      document.getElementById('rolooveImageData').value = imageData;
      
      const preview = document.getElementById('rolooveImagePreview');
      preview.innerHTML = `<img src="${imageData}" class="w-full max-w-md rounded border" />`;
    };
    reader.readAsDataURL(file);
  }
};

function showRolooveView(content, rolooveData) {
  const { roloove, kolon_tanimlari, perde_tanimlari, kat_yukseklikleri } = rolooveData;
  
  content.innerHTML = `
    <div class="space-y-6">
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 class="font-bold text-lg">Seçili İş: ${selectedProject.is_no}</h3>
        <p class="text-sm text-gray-600">${selectedProject.adres}</p>
      </div>
      
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h3 class="text-xl font-bold mb-4">
          <i class="fas fa-drafting-compass mr-2"></i>Rölöve Bilgileri
        </h3>
        
        ${roloove.roloove_image ? `
          <div class="mb-4">
            <img src="${roloove.roloove_image}" class="w-full max-w-2xl rounded border" />
          </div>
        ` : ''}
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div class="bg-gray-50 p-3 rounded">
            <p class="text-xs text-gray-600">İnceleme Katı</p>
            <p class="font-semibold">${roloove.inceleme_kati}</p>
          </div>
          <div class="bg-gray-50 p-3 rounded">
            <p class="text-xs text-gray-600">Kat Sayısı</p>
            <p class="font-semibold">${roloove.kat_sayisi}</p>
          </div>
          <div class="bg-gray-50 p-3 rounded">
            <p class="text-xs text-gray-600">Kolon Sayısı</p>
            <p class="font-semibold">${roloove.kolon_sayisi}</p>
          </div>
          <div class="bg-gray-50 p-3 rounded">
            <p class="text-xs text-gray-600">Perde Sayısı</p>
            <p class="font-semibold">${roloove.perde_sayisi || 0}</p>
          </div>
        </div>
        
        <div class="mt-6">
          <h4 class="font-semibold mb-3">Kolon Boyutları</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
            ${kolon_tanimlari.map(k => `
              <div class="bg-gray-50 p-2 rounded flex items-center justify-between">
                <span class="font-mono font-bold text-sm">${k.kolon_kodu}</span>
                <span class="text-sm">${k.genis_yuzey} x ${k.dar_yuzey} cm</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

// Generate random Schmidt values based on average
window.generateSchmidtValues = function(avg, range) {
  const values = [];
  const min = Math.max(10, avg - range);
  const max = Math.min(70, avg + range);
  
  for (let i = 0; i < 10; i++) {
    values.push(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  
  return values;
};

// Calculate Karot fb and fck
window.calculateKarotValues = function(cap_mm, kirilma_yuku_kn) {
  const cap_m = cap_mm / 1000;
  const alan_m2 = Math.PI * Math.pow(cap_m / 2, 2);
  const kirilma_yuku_n = kirilma_yuku_kn * 1000;
  
  const fb_mpa = kirilma_yuku_n / alan_m2 / 1000000; // MPa
  const fck_mpa = fb_mpa * 0.85; // Approximate conversion
  
  return {
    fb_mpa: fb_mpa.toFixed(2),
    fck_mpa: fck_mpa.toFixed(2)
  };
};

// ==================== PHOTO UTILITY FUNCTIONS ====================

// Compress and resize image
window.compressImage = async function(file, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Resize if needed
        if (width > maxWidth) {
          height = height * (maxWidth / width);
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to compressed base64
        const compressedData = canvas.toDataURL('image/jpeg', quality);
        
        // Calculate size
        const sizeInBytes = Math.round((compressedData.length * 3) / 4);
        
        resolve({
          data: compressedData,
          size: sizeInBytes,
          width: width,
          height: height
        });
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Capture photo from camera
window.capturePhoto = async function(elemanKodu, fotoTipi) {
  return new Promise(async (resolve, reject) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="w-full h-full flex flex-col">
          <div class="flex-1 flex items-center justify-center">
            <video id="photoCapture" autoplay playsinline class="max-w-full max-h-full"></video>
          </div>
          <div class="p-4 bg-gray-900 flex gap-2">
            <button onclick="takePhoto()" class="flex-1 bg-green-600 text-white py-3 rounded-lg text-lg font-semibold">
              <i class="fas fa-camera mr-2"></i>Çek
            </button>
            <button onclick="cancelPhotoCapture()" class="flex-1 bg-red-600 text-white py-3 rounded-lg text-lg font-semibold">
              <i class="fas fa-times mr-2"></i>İptal
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      
      const video = modal.querySelector('#photoCapture');
      video.srcObject = stream;
      
      window.photoStream = stream;
      window.photoModal = modal;
      window.photoResolve = resolve;
      window.photoReject = reject;
      window.photoElemanKodu = elemanKodu;
      window.photoFotoTipi = fotoTipi;
    } catch (error) {
      reject(new Error('Kamera erişimi reddedildi'));
    }
  });
};

window.takePhoto = async function() {
  const video = document.getElementById('photoCapture');
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  
  // Compress
  canvas.toBlob(async (blob) => {
    const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
    const compressed = await compressImage(file);
    
    cancelPhotoCapture();
    
    if (window.photoResolve) {
      window.photoResolve({
        data: compressed.data,
        size: compressed.size,
        elemanKodu: window.photoElemanKodu,
        fotoTipi: window.photoFotoTipi
      });
    }
  }, 'image/jpeg', 0.7);
};

window.cancelPhotoCapture = function() {
  if (window.photoStream) {
    window.photoStream.getTracks().forEach(track => track.stop());
    window.photoStream = null;
  }
  if (window.photoModal) {
    window.photoModal.remove();
    window.photoModal = null;
  }
  if (window.photoReject) {
    window.photoReject(new Error('İptal edildi'));
  }
};

// Select photo from gallery
window.selectPhotoFromGallery = async function(elemanKodu, fotoTipi) {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const compressed = await compressImage(file);
          resolve({
            data: compressed.data,
            size: compressed.size,
            elemanKodu: elemanKodu,
            fotoTipi: fotoTipi
          });
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error('Dosya seçilmedi'));
      }
    };
    input.click();
  });
};

// Generate photo name
window.generatePhotoName = function(elemanKodu, fotoTipi) {
  const fotoTipleri = {
    'gorunum': 'kolon_gorunumu',
    'donati_capi': 'donati_capi',
    'etriye_capi': 'etriye_capi',
    'korozyon': 'korozyon',
    'etriye_araligi': 'etriye_araligi',
    'rontgen': 'rontgen'
  };
  
  return `${elemanKodu}_${fotoTipleri[fotoTipi] || fotoTipi}.jpg`;
};

// Upload photo to server
window.uploadPhotoToServer = async function(projectId, elemanTipi, elemanId, photoData) {
  const fotoAdi = generatePhotoName(photoData.elemanKodu, photoData.fotoTipi);
  
  const data = {
    project_id: projectId,
    eleman_tipi: elemanTipi,
    eleman_id: elemanId,
    eleman_kodu: photoData.elemanKodu,
    foto_tipi: photoData.fotoTipi,
    foto_data: photoData.data,
    foto_adi: fotoAdi,
    dosya_boyutu: photoData.size
  };
  
  return await api.uploadPhoto(data);
};

// Download all photos for project (for reporter)
window.downloadAllPhotos = async function(projectId) {
  try {
    const { photos } = await api.getAllPhotos(projectId);
    
    if (photos.length === 0) {
      alert('Bu proje için fotoğraf bulunamadı.');
      return;
    }
    
    // Create zip file (using JSZip would be ideal, but we'll download individually for now)
    for (const photo of photos) {
      const link = document.createElement('a');
      link.href = photo.foto_data;
      link.download = photo.foto_adi;
      link.click();
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between downloads
    }
    
    alert(`${photos.length} fotoğraf indirildi.`);
  } catch (error) {
    alert('Fotoğraflar indirilirken hata oluştu: ' + error.message);
  }
};

// Download single photo
window.downloadPhoto = function(photoData, photoName) {
  const link = document.createElement('a');
  link.href = photoData;
  link.download = photoName;
  link.click();
};

// Initialize app on DOM ready
document.addEventListener('DOMContentLoaded', init);

// Expose functions globally
window.login = login;
window.logout = logout;
window.showTab = showTab;
window.showFieldTab = showFieldTab;
window.selectProjectForFieldWork = selectProjectForFieldWork;
