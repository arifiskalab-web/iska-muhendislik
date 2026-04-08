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
      const response = await axios({
        url: `${this.baseURL}${endpoint}`,
        method: options.method || 'GET',
        headers,
        data: options.data
      });
      return response.data;
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
  
  getReporters: () => api.call('/users/reporters')
    method: 'PUT'
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
  } else if (currentUser.role === 'reporter') {
    showReporterDashboard();
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
  const kolonData = await api.getFieldData('kolon-siyirma', selectedProject.id);
  const perdeData = await api.getFieldData('perde-siyirma', selectedProject.id);
  
  content.innerHTML = `
    <div class="space-y-6">
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 class="font-bold text-lg">Seçili İş: ${selectedProject.is_no}</h3>
        <p class="text-sm text-gray-600">${selectedProject.adres}</p>
      </div>
      
      <!-- Kolon Sıyırma -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h3 class="text-xl font-bold mb-4">
          <i class="fas fa-columns mr-2"></i>Kolon Sıyırma
        </h3>
        
        <form id="kolonSiyirmaForm" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input type="text" name="kolon_no" placeholder="Kolon No" class="px-3 py-2 border rounded" required />
          <input type="text" name="kolon_boyutlari" placeholder="Boyutlar (örn: 30x30)" class="px-3 py-2 border rounded" />
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
  const kolonData = await api.getFieldData('kolon-rontgen', selectedProject.id);
  const perdeData = await api.getFieldData('perde-rontgen', selectedProject.id);
  
  content.innerHTML = `
    <div class="space-y-6">
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 class="font-bold text-lg">Seçili İş: ${selectedProject.is_no}</h3>
        <p class="text-sm text-gray-600">${selectedProject.adres}</p>
      </div>
      
      <!-- Kolon Röntgen -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h3 class="text-xl font-bold mb-4">
          <i class="fas fa-x-ray mr-2"></i>Kolon Röntgen
        </h3>
        
        <form id="kolonRontgenForm" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input type="text" name="kolon_no" placeholder="Kolon No" class="px-3 py-2 border rounded" required />
          <input type="text" name="kat" placeholder="Kat" class="px-3 py-2 border rounded" />
          <input type="number" name="donatı_sayisi" placeholder="Donatı Sayısı" class="px-3 py-2 border rounded" />
          <input type="text" name="donatı_çapı" placeholder="Donatı Çapı" class="px-3 py-2 border rounded" />
          <input type="text" name="sargı_araligi" placeholder="Sargı Aralığı" class="px-3 py-2 border rounded" />
          <input type="text" name="notlar" placeholder="Notlar" class="px-3 py-2 border rounded" />
          <button type="submit" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            <i class="fas fa-plus mr-2"></i>Ekle
          </button>
        </form>
        
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-100">
              <tr>
                <th class="px-3 py-2 text-left">Kolon No</th>
                <th class="px-3 py-2 text-left">Kat</th>
                <th class="px-3 py-2 text-left">Donatı Sayısı</th>
                <th class="px-3 py-2 text-left">Donatı Çapı</th>
                <th class="px-3 py-2 text-left">Sargı Aralığı</th>
                <th class="px-3 py-2 text-left">Notlar</th>
              </tr>
            </thead>
            <tbody>
              ${kolonData.data?.map(d => `
                <tr class="border-t">
                  <td class="px-3 py-2">${d.kolon_no || '-'}</td>
                  <td class="px-3 py-2">${d.kat || '-'}</td>
                  <td class="px-3 py-2">${d.donatı_sayisi || '-'}</td>
                  <td class="px-3 py-2">${d.donatı_çapı || '-'}</td>
                  <td class="px-3 py-2">${d.sargı_araligi || '-'}</td>
                  <td class="px-3 py-2">${d.notlar || '-'}</td>
                </tr>
              `).join('') || '<tr><td colspan="6" class="text-center py-4 text-gray-500">Henüz veri yok</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Perde Röntgen -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h3 class="text-xl font-bold mb-4">
          <i class="fas fa-x-ray mr-2"></i>Perde Röntgen
        </h3>
        
        <form id="perdeRontgenForm" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input type="text" name="perde_no" placeholder="Perde No" class="px-3 py-2 border rounded" required />
          <input type="text" name="kat" placeholder="Kat" class="px-3 py-2 border rounded" />
          <input type="number" name="donatı_sayisi" placeholder="Donatı Sayısı" class="px-3 py-2 border rounded" />
          <input type="text" name="donatı_çapı" placeholder="Donatı Çapı" class="px-3 py-2 border rounded" />
          <input type="text" name="sargı_araligi" placeholder="Sargı Aralığı" class="px-3 py-2 border rounded" />
          <input type="text" name="notlar" placeholder="Notlar" class="px-3 py-2 border rounded" />
          <button type="submit" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            <i class="fas fa-plus mr-2"></i>Ekle
          </button>
        </form>
        
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-100">
              <tr>
                <th class="px-3 py-2 text-left">Perde No</th>
                <th class="px-3 py-2 text-left">Kat</th>
                <th class="px-3 py-2 text-left">Donatı Sayısı</th>
                <th class="px-3 py-2 text-left">Donatı Çapı</th>
                <th class="px-3 py-2 text-left">Sargı Aralığı</th>
                <th class="px-3 py-2 text-left">Notlar</th>
              </tr>
            </thead>
            <tbody>
              ${perdeData.data?.map(d => `
                <tr class="border-t">
                  <td class="px-3 py-2">${d.perde_no || '-'}</td>
                  <td class="px-3 py-2">${d.kat || '-'}</td>
                  <td class="px-3 py-2">${d.donatı_sayisi || '-'}</td>
                  <td class="px-3 py-2">${d.donatı_çapı || '-'}</td>
                  <td class="px-3 py-2">${d.sargı_araligi || '-'}</td>
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
        
        <form id="karotForm" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input type="text" name="numune_no" placeholder="Numune No" class="px-3 py-2 border rounded" required />
          <input type="text" name="lokasyon" placeholder="Lokasyon" class="px-3 py-2 border rounded" />
          <input type="text" name="kat" placeholder="Kat" class="px-3 py-2 border rounded" />
          <input type="number" step="0.01" name="cap" placeholder="Çap (cm)" class="px-3 py-2 border rounded" />
          <input type="number" step="0.01" name="uzunluk" placeholder="Uzunluk (cm)" class="px-3 py-2 border rounded" />
          <input type="number" step="0.01" name="basınc_dayanimi" placeholder="Basınç Dayanımı (MPa)" class="px-3 py-2 border rounded" />
          <input type="date" name="test_tarihi" placeholder="Test Tarihi" class="px-3 py-2 border rounded" />
          <input type="text" name="notlar" placeholder="Notlar" class="px-3 py-2 border rounded md:col-span-2" />
          <button type="submit" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            <i class="fas fa-plus mr-2"></i>Ekle
          </button>
        </form>
        
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-100">
              <tr>
                <th class="px-3 py-2 text-left">Numune No</th>
                <th class="px-3 py-2 text-left">Lokasyon</th>
                <th class="px-3 py-2 text-left">Kat</th>
                <th class="px-3 py-2 text-left">Çap (cm)</th>
                <th class="px-3 py-2 text-left">Uzunluk (cm)</th>
                <th class="px-3 py-2 text-left">Basınç Dayanımı (MPa)</th>
                <th class="px-3 py-2 text-left">Test Tarihi</th>
                <th class="px-3 py-2 text-left">Notlar</th>
              </tr>
            </thead>
            <tbody>
              ${karotData.data?.map(d => `
                <tr class="border-t">
                  <td class="px-3 py-2">${d.numune_no || '-'}</td>
                  <td class="px-3 py-2">${d.lokasyon || '-'}</td>
                  <td class="px-3 py-2">${d.kat || '-'}</td>
                  <td class="px-3 py-2">${d.cap || '-'}</td>
                  <td class="px-3 py-2">${d.uzunluk || '-'}</td>
                  <td class="px-3 py-2">${d.basınc_dayanimi || '-'}</td>
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
  
  document.getElementById('karotForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {};
    formData.forEach((value, key) => data[key] = value);
    
    await api.createFieldData('karot', selectedProject.id, data);
    showFieldTab('karot');
  });
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
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="text" name="test_no" placeholder="Test No" class="px-3 py-2 border rounded" required />
            <input type="text" name="lokasyon" placeholder="Lokasyon" class="px-3 py-2 border rounded" />
            <input type="text" name="kat" placeholder="Kat" class="px-3 py-2 border rounded" />
          </div>
          
          <div class="bg-gray-50 p-4 rounded">
            <h4 class="font-semibold mb-3">10 Okuma Değeri:</h4>
            <div class="grid grid-cols-5 gap-3">
              <input type="number" name="okuma_1" placeholder="1" class="px-3 py-2 border rounded" />
              <input type="number" name="okuma_2" placeholder="2" class="px-3 py-2 border rounded" />
              <input type="number" name="okuma_3" placeholder="3" class="px-3 py-2 border rounded" />
              <input type="number" name="okuma_4" placeholder="4" class="px-3 py-2 border rounded" />
              <input type="number" name="okuma_5" placeholder="5" class="px-3 py-2 border rounded" />
              <input type="number" name="okuma_6" placeholder="6" class="px-3 py-2 border rounded" />
              <input type="number" name="okuma_7" placeholder="7" class="px-3 py-2 border rounded" />
              <input type="number" name="okuma_8" placeholder="8" class="px-3 py-2 border rounded" />
              <input type="number" name="okuma_9" placeholder="9" class="px-3 py-2 border rounded" />
              <input type="number" name="okuma_10" placeholder="10" class="px-3 py-2 border rounded" />
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="number" step="0.01" name="ortalama" placeholder="Ortalama" class="px-3 py-2 border rounded" />
            <input type="number" step="0.01" name="tahmini_dayanim" placeholder="Tahmini Dayanım (MPa)" class="px-3 py-2 border rounded" />
            <input type="date" name="test_tarihi" placeholder="Test Tarihi" class="px-3 py-2 border rounded" />
          </div>
          
          <input type="text" name="notlar" placeholder="Notlar" class="w-full px-3 py-2 border rounded" />
          
          <button type="submit" class="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
            <i class="fas fa-plus mr-2"></i>Ekle
          </button>
        </form>
        
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-100">
              <tr>
                <th class="px-3 py-2 text-left">Test No</th>
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
                  <td class="px-3 py-2">${d.lokasyon || '-'}</td>
                  <td class="px-3 py-2">${d.kat || '-'}</td>
                  <td class="px-3 py-2">${d.ortalama || '-'}</td>
                  <td class="px-3 py-2">${d.tahmini_dayanim || '-'}</td>
                  <td class="px-3 py-2">${d.test_tarihi || '-'}</td>
                  <td class="px-3 py-2">${d.notlar || '-'}</td>
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
