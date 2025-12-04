 应该// ==================== API 基础配置 ====================
const API_BASE = 'http://localhost:3005/api';
console.log('🌐 API基础地址:', API_BASE);

const API_ENDPOINTS = {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    PROFILE: '/user/profile',
    ACTIVITIES: '/activities',
    ACTIVITIES_HOT: '/activities/hot',
    ACTIVITIES_LATEST: '/activities/latest',
    REGISTER_ACTIVITY: '/registrations',
    USER_REGISTRATIONS: '/registrations/user',
    DONATIONS: '/donations',
    PRODUCTS: '/products',
    POINTS_CURRENT: '/points/current',
    POINTS_HISTORY: '/points/history',
    TEST_DB: '/test-db',
    TEST: '/test',
    TEST_LOGIN: '/auth/test-login',
    TEST_REGISTER: '/auth/test-register'
};

// ==================== API 客户端 ====================
const api = {
    // 认证相关
    auth: {
        login: (credentials) => apiRequest('/auth/login', {
            method: 'POST',
            body: credentials
        }),
        register: (userData) => apiRequest('/auth/register', {
            method: 'POST',
            body: userData
        }),
        logout: () => apiRequest('/auth/logout', {
            method: 'POST'
        })
    },

    // 用户相关
    user: {
        getProfile: () => apiRequest('/user/profile'),
        updateProfile: (profile) => apiRequest('/user/profile', {
            method: 'PUT',
            body: profile
        })
    },

    // 活动相关
    activities: {
        getAll: () => apiRequest('/activities'),
        create: (activity) => apiRequest('/activities', {
            method: 'POST',
            body: activity
        }),
        update: (id, activity) => apiRequest(`/activities/${id}`, {
            method: 'PUT',
            body: activity
        }),
        delete: (id) => apiRequest(`/activities/${id}`, {
            method: 'DELETE'
        }),
        register: (activityId) => apiRequest('/registrations', {
            method: 'POST',
            body: { activityId }
        })
    },

    // 捐赠相关
    donations: {
        getAll: () => apiRequest('/donations'),
        create: (donation) => apiRequest('/donations', {
            method: 'POST',
            body: donation
        }),
        update: (id, donation) => apiRequest(`/donations/${id}`, {
            method: 'PUT',
            body: donation
        }),
        delete: (id) => apiRequest(`/donations/${id}`, {
            method: 'DELETE'
        }),
        donate: (id, amount) => apiRequest(`/donations/${id}/donate`, {
            method: 'POST',
            body: { amount }
        })
    },

    // 积分商品相关
    products: {
        getAll: () => apiRequest('/products'),
        create: (product) => apiRequest('/products', {
            method: 'POST',
            body: product
        }),
        update: (id, product) => apiRequest(`/products/${id}`, {
            method: 'PUT',
            body: product
        }),
        delete: (id) => apiRequest(`/products/${id}`, {
            method: 'DELETE'
        }),
        exchange: (id) => apiRequest(`/products/${id}/exchange`, {
            method: 'POST'
        })
    },

    // 积分相关
    points: {
        getCurrent: () => apiRequest('/points/current'),
        getHistory: () => apiRequest('/points/history')
    },

    // 我的记录相关
    records: {
        getActivities: () => apiRequest('/registrations/user'),
        getDonations: () => apiRequest('/user/donations'),
        getExchanges: () => apiRequest('/user/exchanges')
    }
};

// ==================== API 请求工具函数 ====================
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const token = localStorage.getItem('authToken');
    
    console.log(`📡 API请求: ${options.method || 'GET'} ${url}`);

    const defaultOptions = {
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };

    const config = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }

    try {
        const response = await fetch(url, config);
        
        console.log(`📡 响应状态: ${response.status} ${response.statusText}`);

        // 处理未授权响应
        if (response.status === 401) {
            localStorage.removeItem('authToken');
            currentUser = null;
            document.getElementById('loginModal').classList.add('active');
            throw new Error('登录已过期，请重新登录');
        }

        // 检查响应状态
        if (!response.ok) {
            const errorText = await response.text();
            console.error('响应错误内容:', errorText);
            
            try {
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.message || errorData.error || `请求失败: ${response.status}`);
            } catch {
                throw new Error(errorText || `请求失败: ${response.status}`);
            }
        }

        const responseData = await response.json();
        console.log('原始响应数据:', responseData);
        
        // 处理后端返回的不同响应格式
        if (responseData.success === false) {
            throw new Error(responseData.message || responseData.error || '请求失败');
        }
        
        // 返回响应中的data字段或整个响应对象
        const data = responseData.data || responseData;
        console.log('处理后的数据:', data);
        return data;
    } catch (error) {
        console.error('API请求错误:', error);
        throw error;
    }
}

// ==================== 工具函数 ====================
function buildUrl(endpoint, params = {}) {
    let url = endpoint;
    Object.keys(params).forEach(key => {
        url = url.replace(`:${key}`, params[key]);
    });
    return url;
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
}

function clearFormErrors() {
    document.querySelectorAll('.error-message').forEach(element => {
        element.style.display = 'none';
    });
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function formatDate(dateString) {
    if (!dateString) return '未知日期';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// ==================== 应用状态 ====================
let currentUser = {
    email: '',
    full_name: '',
    phone: ''
};
let currentPage = 'home';
let carouselIndex = 0;

// ==================== 后端连接测试 ====================
async function testBackendConnection() {
    console.log("🧪 开始测试后端连接...");
    
    try {
        // 1. 测试健康检查
        console.log("🩺 测试健康检查...");
        const healthResponse = await fetch(`${API_BASE}/health`, {
            mode: 'cors'
        });
        const healthData = await healthResponse.json();
        console.log("✅ 健康检查成功:", healthData.message || '健康检查通过');
        
        // 2. 测试简单 GET 请求 - 获取活动列表
        console.log("📝 测试GET请求...");
        const testResponse = await fetch(`${API_BASE}/activities`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            mode: 'cors'
        });
        
        if (testResponse.ok) {
            const testData = await testResponse.json();
            console.log("✅ GET请求测试成功:", testData.message || '活动列表获取成功');
        } else {
            console.warn("⚠️ GET请求测试失败:", testResponse.status);
        }
        
        // 3. 直接测试登录API
        console.log("🔑 测试登录API...");
        const loginTestResponse = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            mode: 'cors',
            body: JSON.stringify({ 
                username: 'user',
                password: 'user123'
            })
        });
        
        console.log("登录API响应状态:", loginTestResponse.status, loginTestResponse.statusText);
        
        if (loginTestResponse.ok) {
            const loginData = await loginTestResponse.json();
            console.log("✅ 登录API测试成功:", loginData.message);
        } else {
            console.warn("⚠️ 登录API测试失败:", loginTestResponse.status);
        }
        
        console.log("🎉 后端连接测试完成");
        
    } catch (error) {
        console.error("❌ 后端连接测试失败:", error.message);
        console.error("错误详情:", error);
        
        // 给出具体建议
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            console.error(`💡 建议：请确保后端服务正在运行在 ${API_BASE}`);
            console.error("💡 运行命令：npm run dev 或 node server.js");
        }
    }
}

// ==================== 页面初始化 ====================
document.addEventListener('DOMContentLoaded', async function() {
    console.log("🌐 前端页面加载完成");
    
    // 测试后端连接
    await testBackendConnection();
    
    // 检查是否已登录
    const token = localStorage.getItem('authToken');
    if (token) {
        try {
            console.log("🔍 检测到token，尝试自动登录...");
            const data = await apiRequest(API_ENDPOINTS.PROFILE);

            currentUser = {
                email: data.email || data.user?.email || '',
                full_name: data.full_name || data.user?.full_name || data.username || '用户',
                phone: data.phone || data.user?.phone || '',
                username: data.username || data.user?.username || '',
                role: data.role || data.user?.role || 'user',
                avatar: data.avatar || data.user?.avatar || 'https://via.placeholder.com/32'
            };

            console.log("✅ 自动登录成功:", currentUser.username);

            // 更新UI显示
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = currentUser.full_name || currentUser.username || '用户';
            }

            const userAvatarElement = document.getElementById('userAvatar');
            if (userAvatarElement) {
                userAvatarElement.src = currentUser.avatar;
            }

            const userInfoElement = document.getElementById('userInfo');
            if (userInfoElement) {
                userInfoElement.style.display = 'flex';
            }

            document.getElementById('loginBtn').style.display = 'none';
            document.getElementById('registerBtn').style.display = 'none';

            // 根据用户角色显示管理功能
            if (currentUser.role === 'admin') {
                const adminElements = [
                    'adminActivityControls',
                    'adminDonationControls',
                    'adminPointsControls'
                ];
                adminElements.forEach(id => {
                    const element = document.getElementById(id);
                    if (element) element.style.display = 'block';
                });
            }

            // 更新个人中心信息
            updateProfileInfo();
        } catch (error) {
            console.error('自动登录失败:', error);
            localStorage.removeItem('authToken');
            currentUser = null;
            const loginModal = document.getElementById('loginModal');
            if (loginModal) loginModal.classList.add('active');
        }
    } else {
        console.log("🔐 用户未登录，显示登录模态框");
        const loginModal = document.getElementById('loginModal');
        if (loginModal) loginModal.classList.add('active');
    }

    // 初始化轮播图
    initCarousel();

    // 绑定导航事件
    bindNavigationEvents();

    // 绑定登录相关事件
    bindLoginEvents();

    // 绑定个人中心标签页事件
    bindProfileTabs();

    // 绑定管理员表单事件
    bindAdminFormEvents();

    // 渲染首页活动
    renderHomeActivities();
});

// ==================== 轮播图功能 ====================
function initCarousel() {
    const carouselInner = document.querySelector('.carousel-inner');
    const dots = document.querySelectorAll('.carousel-dot');

    if (!carouselInner || dots.length === 0) {
        console.warn("⚠️ 轮播图元素未找到");
        return;
    }

    // 设置轮播图自动切换
    setInterval(() => {
        carouselIndex = (carouselIndex + 1) % 3;
        updateCarousel();
    }, 5000);

    // 绑定轮播图点选事件
    dots.forEach(dot => {
        dot.addEventListener('click', function() {
            carouselIndex = parseInt(this.getAttribute('data-index'));
            updateCarousel();
        });
    });

    function updateCarousel() {
        carouselInner.style.transform = `translateX(-${carouselIndex * 100}%)`;

        dots.forEach((dot, index) => {
            if (index === carouselIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
}

// ==================== 导航功能 ====================
function bindNavigationEvents() {
    // 导航链接
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            showPage(page);

            // 更新导航激活状态
            document.querySelectorAll('.nav-link').forEach(item => {
                item.classList.remove('active');
            });
            this.classList.add('active');
        });
    });

    // 快捷操作卡片
    document.querySelectorAll('.action-card').forEach(card => {
        card.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            showPage(page);

            // 更新导航激活状态
            document.querySelectorAll('.nav-link').forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-page') === page) {
                    item.classList.add('active');
                }
            });
        });
    });

    // 底部链接
    document.querySelectorAll('footer a').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('data-page')) {
                e.preventDefault();
                const page = this.getAttribute('data-page');
                showPage(page);

                // 更新导航激活状态
                document.querySelectorAll('.nav-link').forEach(item => {
                    item.classList.remove('active');
                    if (item.getAttribute('data-page') === page) {
                        item.classList.add('active');
                    }
                });
            }
        });
    });
}

// ==================== 页面显示功能 ====================
function showPage(page) {
    console.log("📄 切换到页面:", page);
    
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });

    // 显示目标页面
    const targetPage = document.getElementById(page);
    if (targetPage) {
        targetPage.classList.add('active');
        currentPage = page;
    } else {
        console.error("❌ 页面未找到:", page);
    }

    // 根据页面和用户角色渲染内容
    if (page === 'home') {
        renderHomeActivities();
    } else if (page === 'activities') {
        renderActivities();
    } else if (page === 'my-activities') {
        renderMyRegistrations();
    } else if (page === 'donations') {
        renderDonations();
    } else if (page === 'points') {
        renderProducts();
        updatePointsDisplay();
    } else if (page === 'profile') {
        updateProfileInfo();
    }
}

// ==================== 登录功能 ====================
function bindLoginEvents() {
    // 登录按钮
    document.getElementById('loginBtn')?.addEventListener('click', function() {
        document.getElementById('loginModal').classList.add('active');
    });

    // 注册按钮
    document.getElementById('registerBtn')?.addEventListener('click', function() {
        document.getElementById('loginModal').classList.add('active');
        // 切换到注册标签
        document.querySelectorAll('.modal .tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector('[data-tab="register"]').classList.add('active');

        document.querySelectorAll('.modal .tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById('registerTab').classList.add('active');
    });

    // 关闭模态框
    document.getElementById('closeModal')?.addEventListener('click', function() {
        document.getElementById('loginModal').classList.remove('active');
    });

    // 登录/注册标签切换
    document.querySelectorAll('.modal .tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');

            // 更新标签激活状态
            document.querySelectorAll('.modal .tab').forEach(t => {
                t.classList.remove('active');
            });
            this.classList.add('active');

            // 显示对应内容
            document.querySelectorAll('.modal .tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(tabId + 'Tab').classList.add('active');

            // 清空表单和错误信息
            clearFormErrors();
        });
    });

    // 登录表单提交
    document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        console.log("🔐 登录尝试:", { username });

        // 清空错误信息
        clearFormErrors();

        // 简单验证
        if (!username) {
            showError('usernameError', '请输入用户名');
            return;
        }

        if (!password) {
            showError('passwordError', '请输入密码');
            return;
        }

        try {
            console.log("📤 发送登录请求到:", `${API_BASE}/auth/login`);
            
            // 直接使用fetch以便调试
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                mode: 'cors',
                credentials: 'include',
                body: JSON.stringify({ 
                    username: username.trim(),
                    password: password.trim()
                })
            });

            console.log("📥 响应状态:", response.status, response.statusText);

            // 尝试解析响应数据
            let responseData;
            try {
                const responseText = await response.text();
                console.log("📥 响应文本:", responseText);
                
                if (responseText) {
                    responseData = JSON.parse(responseText);
                } else {
                    responseData = {};
                }
            } catch (parseError) {
                console.error("❌ 响应解析错误:", parseError);
                throw new Error('服务器响应格式错误');
            }

            if (!response.ok) {
                const errorMsg = responseData.message || responseData.error || '登录失败';
                console.error("❌ 登录失败响应:", errorMsg);
                throw new Error(errorMsg);
            }

            console.log("✅ 登录成功:", responseData);

            // 处理不同类型的响应格式
            let token = responseData.token || responseData.accessToken || responseData.access_token;
            let userData = responseData.user || responseData.data || responseData;

            if (!token && responseData.data && responseData.data.token) {
                token = responseData.data.token;
            }

            if (token) {
                localStorage.setItem('authToken', token);
                
                currentUser = {
                    email: userData.email || '',
                    full_name: userData.full_name || userData.fullName || userData.username || '用户',
                    phone: userData.phone || '',
                    username: userData.username || userData.userName || username,
                    role: userData.role || 'user',
                    avatar: userData.avatar || 'https://via.placeholder.com/32',
                    user_id: userData.id || userData.user_id || userData._id
                };

                // 更新UI
                updateUIAfterLogin();
                
                alert('登录成功！');
            } else {
                console.warn("⚠️ 服务器未返回token，但响应成功:", responseData);
                
                // 如果没有token，尝试获取用户信息
                if (responseData.username || responseData.email) {
                    currentUser = {
                        email: responseData.email || '',
                        full_name: responseData.full_name || responseData.username || '用户',
                        username: responseData.username || username,
                        role: responseData.role || 'user'
                    };
                    
                    updateUIAfterLogin();
                    alert('登录成功！');
                } else {
                    throw new Error('登录成功但未获取到用户信息');
                }
            }
        } catch (error) {
            console.error('❌ 登录错误详情:', error);
            
            // 显示更友好的错误信息
            let errorMessage = error.message || '登录失败';
            if (errorMessage.includes('NetworkError') || errorMessage.includes('Failed to fetch')) {
                errorMessage = '无法连接到服务器，请检查网络连接和后端服务是否运行';
            }
            
            showError('passwordError', errorMessage);
            
            // 如果正式API失败，尝试使用测试API
            if (errorMessage.includes('无法连接到服务器')) {
                console.log("🔄 尝试使用测试登录API...");
                tryTestLogin(username, password);
            }
        }
    });

    // 注册表单提交
    document.getElementById('registerForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = document.getElementById('regUsername').value;
        const email = document.getElementById('regEmail').value;
        const fullName = document.getElementById('regFullName').value;
        const phone = document.getElementById('regPhone').value;
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;

        console.log("📝 注册尝试:", { username, email });

        // 清空错误信息
        clearFormErrors();

        // 表单验证
        let isValid = true;

        if (!username) {
            showError('regUsernameError', '请输入用户名');
            isValid = false;
        }

        if (!email) {
            showError('regEmailError', '请输入邮箱');
            isValid = false;
        } else if (!isValidEmail(email)) {
            showError('regEmailError', '邮箱格式不正确');
            isValid = false;
        }

        if (!password) {
            showError('regPasswordError', '请输入密码');
            isValid = false;
        } else if (password.length < 6) {
            showError('regPasswordError', '密码至少6位');
            isValid = false;
        }

        if (!confirmPassword) {
            showError('regConfirmPasswordError', '请确认密码');
            isValid = false;
        } else if (password !== confirmPassword) {
            showError('regConfirmPasswordError', '两次密码不一致');
            isValid = false;
        }

        if (!isValid) return;

        try {
            console.log("📤 发送注册请求到:", `${API_BASE}/auth/register`);
            
            const response = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                mode: 'cors',
                body: JSON.stringify({
                    username,
                    email,
                    full_name: fullName,
                    phone,
                    password
                })
            });

            console.log("📥 响应状态:", response.status, response.statusText);

            // 尝试解析响应数据
            let responseData;
            try {
                const responseText = await response.text();
                console.log("📥 响应文本:", responseText);
                
                if (responseText) {
                    responseData = JSON.parse(responseText);
                } else {
                    responseData = {};
                }
            } catch (parseError) {
                console.error("❌ 响应解析错误:", parseError);
                throw new Error('服务器响应格式错误');
            }

            if (!response.ok) {
                const errorMsg = responseData.message || responseData.error || '注册失败';
                console.error("❌ 注册失败响应:", errorMsg);
                throw new Error(errorMsg);
            }

            console.log("✅ 注册成功:", responseData);

            // 处理不同类型的响应格式
            let token = responseData.token || responseData.accessToken || responseData.access_token;
            let userData = responseData.user || responseData.data || responseData;

            if (!token && responseData.data && responseData.data.token) {
                token = responseData.data.token;
            }

            if (token) {
                localStorage.setItem('authToken', token);
                
                currentUser = {
                    email: userData.email || email,
                    full_name: userData.full_name || fullName || username,
                    phone: userData.phone || phone,
                    username: userData.username || username,
                    role: userData.role || 'user',
                    avatar: userData.avatar || 'https://via.placeholder.com/32'
                };

                // 更新UI
                updateUIAfterLogin();
                
                alert('注册成功！已自动登录。');
            } else {
                throw new Error('服务器未返回token');
            }
        } catch (error) {
            console.error('❌ 注册错误详情:', error);
            
            // 显示更友好的错误信息
            let errorMessage = error.message || '注册失败';
            if (errorMessage.includes('NetworkError') || errorMessage.includes('Failed to fetch')) {
                errorMessage = '无法连接到服务器，请检查网络连接和后端服务是否运行';
            }
            
            showError('regUsernameError', errorMessage);
            
            // 如果正式API失败，尝试使用测试API
            if (errorMessage.includes('无法连接到服务器')) {
                console.log("🔄 尝试使用测试注册API...");
                tryTestRegister(username, email, fullName, phone, password);
            }
        }
    });

    // 退出登录
    document.getElementById('logoutBtn')?.addEventListener('click', async function() {
        try {
            // 调用退出API（如果有的话）
            await apiRequest(API_ENDPOINTS.LOGOUT, {
                method: 'POST'
            });
        } catch (error) {
            console.error('退出登录错误:', error);
        } finally {
            // 清除本地存储
            localStorage.removeItem('authToken');
            currentUser = null;

            // 更新UI
            document.getElementById('userInfo').style.display = 'none';
            document.getElementById('loginBtn').style.display = 'inline-block';
            document.getElementById('registerBtn').style.display = 'inline-block';

            // 隐藏管理功能
            document.getElementById('adminActivityControls').style.display = 'none';
            document.getElementById('adminDonationControls').style.display = 'none';
            document.getElementById('adminPointsControls').style.display = 'none';

            // 显示登录模态框
            document.getElementById('loginModal').classList.add('active');
        }
    });

    // 个人中心表单提交
    document.getElementById('profileForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (currentUser) {
            const email = document.getElementById('profileEmail').value;
            const fullName = document.getElementById('profileFullName').value;
            const phone = document.getElementById('profilePhone').value;

            try {
                // 调用更新个人资料API
                await apiRequest(API_ENDPOINTS.PROFILE, {
                    method: 'PUT',
                    body: {
                        email,
                        full_name: fullName,
                        phone
                    }
                });

                // 更新当前用户信息
                currentUser.email = email;
                currentUser.full_name = fullName;
                currentUser.phone = phone;

                // 更新显示
                document.getElementById('userName').textContent = currentUser.full_name;

                alert('个人信息已更新！');
            } catch (error) {
                alert(error.message || '更新失败');
            }
        }
    });
}

// ==================== 测试登录函数 ====================
async function tryTestLogin(username, password) {
    try {
        console.log("🔐 尝试测试登录...");
        
        const response = await fetch(`${API_BASE}/auth/test-login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors',
            body: JSON.stringify({ 
                username: username.trim(),
                password: password.trim()
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log("✅ 测试登录成功:", data);

            if (data.token) {
                localStorage.setItem('authToken', data.token);
                currentUser = {
                    email: data.user?.email || '',
                    full_name: data.user?.full_name || data.user?.username || '用户',
                    phone: data.user?.phone || '',
                    username: data.user?.username || username,
                    role: data.user?.role || 'user',
                    avatar: data.user?.avatar || 'https://via.placeholder.com/32'
                };

                updateUIAfterLogin();
                alert('测试登录成功！当前使用测试账户。');
            }
        } else {
            console.warn("❌ 测试登录也失败");
        }
    } catch (testError) {
        console.error("❌ 测试登录错误:", testError);
    }
}

// ==================== 测试注册函数 ====================
async function tryTestRegister(username, email, fullName, phone, password) {
    try {
        console.log("📝 尝试测试注册...");
        
        const response = await fetch(`${API_BASE}/auth/test-register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors',
            body: JSON.stringify({
                username,
                email,
                full_name: fullName,
                phone,
                password
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log("✅ 测试注册成功:", data);

            if (data.token) {
                localStorage.setItem('authToken', data.token);
                currentUser = {
                    email: data.user?.email || email,
                    full_name: data.user?.full_name || fullName || username,
                    phone: data.user?.phone || phone,
                    username: data.user?.username || username,
                    role: data.user?.role || 'user'
                };

                updateUIAfterLogin();
                alert('测试注册成功！当前使用测试账户。');
            }
        } else {
            console.warn("❌ 测试注册也失败");
        }
    } catch (testError) {
        console.error("❌ 测试注册错误:", testError);
    }
}

// ==================== UI更新函数 ====================
function updateUIAfterLogin() {
    console.log("🎨 更新UI显示");
    
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = currentUser.full_name || currentUser.username || '用户';
    }

    const userAvatarElement = document.getElementById('userAvatar');
    if (userAvatarElement) {
        userAvatarElement.src = currentUser.avatar || 'https://via.placeholder.com/32';
    }

    document.getElementById('userInfo').style.display = 'flex';
    document.getElementById('loginBtn').style.display = 'none';
    document.getElementById('registerBtn').style.display = 'none';
    document.getElementById('loginModal').classList.remove('active');

    // 根据用户角色显示管理功能
    if (currentUser.role === 'admin') {
        document.getElementById('adminActivityControls').style.display = 'block';
        document.getElementById('adminDonationControls').style.display = 'block';
        document.getElementById('adminPointsControls').style.display = 'block';
    } else {
        document.getElementById('adminActivityControls').style.display = 'none';
        document.getElementById('adminDonationControls').style.display = 'none';
        document.getElementById('adminPointsControls').style.display = 'none';
    }

    // 更新个人中心信息
    updateProfileInfo();

    // 重新渲染当前页面
    showPage(currentPage);
}

function updateProfileInfo() {
    if (currentUser) {
        document.getElementById('profileUsername').value = currentUser.username;
        document.getElementById('profileEmail').value = currentUser.email;
        document.getElementById('profileFullName').value = currentUser.full_name;
        document.getElementById('profilePhone').value = currentUser.phone;

        // 更新积分显示
        updatePointsDisplay();
    }
}

// ==================== 管理员功能 ====================
function bindAdminFormEvents() {
    // 活动表单
    document.getElementById('addActivityBtn')?.addEventListener('click', function() {
        document.getElementById('activityForm').style.display = 'block';
        document.getElementById('activityFormTitle').textContent = '发布新活动';
        document.getElementById('activityFormContent').reset();
        document.getElementById('activityId').value = '';
    });

    document.getElementById('activityFormContent')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const id = document.getElementById('activityId').value;
        const title = document.getElementById('activityTitle').value;
        const description = document.getElementById('activityDescription').value;
        const location = document.getElementById('activityLocation').value;
        const eventDate = document.getElementById('activityDate').value;
        const maxParticipants = document.getElementById('activityMaxParticipants').value;
        const pointsReward = document.getElementById('activityPointsReward').value;
        const imageFile = document.getElementById('activityImage').files[0];

        try {
            // 使用FormData处理文件上传
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('location', location);
            formData.append('event_date', eventDate.replace('T', ' ') + ':00');
            formData.append('max_participants', parseInt(maxParticipants));
            formData.append('points_reward', parseInt(pointsReward));
            
            if (imageFile) {
                formData.append('image', imageFile);
            }

            let url;
            let method;
            
            if (id) {
                // 编辑现有活动
                url = buildUrl('/activities/:id', { id });
                method = 'PUT';
            } else {
                // 添加新活动
                url = API_ENDPOINTS.ACTIVITIES;
                method = 'POST';
            }

            // 直接使用fetch处理文件上传，因为apiRequest函数是为JSON设计的
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE}${url}`, {
                method: method,
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` })
                    // 注意：文件上传时不要设置Content-Type，浏览器会自动设置
                },
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || '操作失败');
            }

            document.getElementById('activityForm').style.display = 'none';
            renderActivities();
            // 更新首页活动显示
            renderHomeActivities();
            alert(id ? '活动已更新！' : '活动已发布！');
        } catch (error) {
            alert(error.message || '操作失败');
            console.error('活动表单提交错误:', error);
        }
    });

    document.getElementById('cancelActivityBtn')?.addEventListener('click', function() {
        document.getElementById('activityForm').style.display = 'none';
    });

    // 捐赠表单
    document.getElementById('addDonationBtn')?.addEventListener('click', function() {
        document.getElementById('donationForm').style.display = 'block';
        document.getElementById('donationFormTitle').textContent = '添加捐赠项目';
        document.getElementById('donationFormContent').reset();
        document.getElementById('donationId').value = '';
    });

    document.getElementById('donationFormContent')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const id = document.getElementById('donationId').value;
        const title = document.getElementById('donationTitle').value;
        const description = document.getElementById('donationDescription').value;
        const targetAmount = document.getElementById('donationTargetAmount').value;

        try {
            if (id) {
                // 编辑现有捐赠项目
                const url = buildUrl('/donations/:id', { id });
                await apiRequest(url, {
                    method: 'PUT',
                    body: {
                        title,
                        description,
                        target_amount: parseInt(targetAmount)
                    }
                });
            } else {
                // 添加新捐赠项目
                await apiRequest(API_ENDPOINTS.DONATIONS, {
                    method: 'POST',
                    body: {
                        title,
                        description,
                        target_amount: parseInt(targetAmount)
                    }
                });
            }

            document.getElementById('donationForm').style.display = 'none';
            renderDonations();
            alert(id ? '捐赠项目已更新！' : '捐赠项目已添加！');
        } catch (error) {
            alert(error.message || '操作失败');
        }
    });

    document.getElementById('cancelDonationBtn')?.addEventListener('click', function() {
        document.getElementById('donationForm').style.display = 'none';
    });

    // 商品表单
    document.getElementById('addProductBtn')?.addEventListener('click', function() {
        document.getElementById('productForm').style.display = 'block';
        document.getElementById('productFormTitle').textContent = '添加商品';
        document.getElementById('productFormContent').reset();
        document.getElementById('productId').value = '';
    });

    document.getElementById('productFormContent')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const id = document.getElementById('productId').value;
        const name = document.getElementById('productName').value;
        const description = document.getElementById('productDescription').value;
        const points = document.getElementById('productPoints').value;
        const stock = document.getElementById('productStock').value;

        try {
            if (id) {
                // 编辑现有商品
                const url = buildUrl('/products/:id', { id });
                await apiRequest(url, {
                    method: 'PUT',
                    body: {
                        name,
                        description,
                        points: parseInt(points),
                        stock: parseInt(stock)
                    }
                });
            } else {
                // 添加新商品
                await apiRequest(API_ENDPOINTS.PRODUCTS, {
                    method: 'POST',
                    body: {
                        name,
                        description,
                        points: parseInt(points),
                        stock: parseInt(stock)
                    }
                });
            }

            document.getElementById('productForm').style.display = 'none';
            renderProducts();
            alert(id ? '商品已更新！' : '商品已添加！');
        } catch (error) {
            alert(error.message || '操作失败');
        }
    });

    document.getElementById('cancelProductBtn')?.addEventListener('click', function() {
        document.getElementById('productForm').style.display = 'none';
    });
}

// ==================== 个人中心标签页 ====================
function bindProfileTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');

            // 更新标签激活状态
            document.querySelectorAll('.tab').forEach(t => {
                t.classList.remove('active');
            });
            this.classList.add('active');

            // 显示对应内容
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(tabId + 'Tab').classList.add('active');

            // 加载对应数据
            if (tabId === 'activities') {
                renderUserActivities();
            } else if (tabId === 'donations') {
                renderUserDonations();
            } else if (tabId === 'points') {
                renderUserPoints();
            } else if (tabId === 'exchanges') {
                renderUserExchanges();
            }
        });
    });
}

// ==================== 数据渲染函数 ====================
async function renderHomeActivities() {
    const container = document.getElementById('homeActivities');
    if (!container) return;
    
    container.innerHTML = '<p>加载中...</p>';

    try {
        const data = await apiRequest('/activities');
        const activities = data.activities || data || [];

        // 只显示前几个活动
        const homeActivities = activities.slice(0, 3);

        container.innerHTML = '';

        if (homeActivities.length === 0) {
            container.innerHTML = '<p>暂无活动</p>';
            return;
        }

        homeActivities.forEach(activity => {
            const card = document.createElement('div');
            card.className = 'card';

            let statusText = '';
            let statusClass = '';

            if (activity.status === 'upcoming') {
                statusText = '可报名';
                statusClass = 'btn-primary';
            } else if (activity.status === 'full') {
                statusText = '已满员';
                statusClass = 'btn-secondary';
            } else {
                statusText = '已结束';
                statusClass = 'btn-secondary';
            }

            card.innerHTML = `
                <div class="card-header">${activity.title}</div>
                <div class="card-body">
                    <p>${activity.description}</p>
                    <p><strong>地点:</strong> ${activity.location}</p>
                    <p><strong>时间:</strong> ${formatDate(activity.event_date || activity.eventDate)}</p>
                    <p><strong>人数:</strong> ${activity.current_participants || activity.currentParticipants || 0}/${activity.max_participants || activity.maxParticipants}</p>
                    <button class="btn ${statusClass}" onclick="registerActivity(${activity.id})" style="margin-top: 10px;" ${activity.status !== 'upcoming' ? 'disabled' : ''}>
                        ${statusText}
                    </button>
                </div>
            `;

            container.appendChild(card);
        });
    } catch (error) {
        console.error('获取首页活动错误:', error);
        container.innerHTML = '<p>加载失败，请重试</p>';
    }
}

async function renderActivities() {
    const container = document.getElementById('activitiesList');
    if (!container) return;
    
    container.innerHTML = '<p>加载中...</p>';

    try {
        const data = await apiRequest(API_ENDPOINTS.ACTIVITIES);
        const activities = data.activities || data || [];

        container.innerHTML = '';

        if (activities.length === 0) {
            container.innerHTML = '<p>暂无活动</p>';
            return;
        }

        activities.forEach(activity => {
            const card = document.createElement('div');
            card.className = 'card';

            const eventDate = new Date(activity.event_date || activity.eventDate);
            const now = new Date();
            const isPast = eventDate < now;

            let actionButton = '';
            if (currentUser && currentUser.role === 'admin') {
                actionButton = `
                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        <button class="btn btn-primary" onclick="editActivity(${activity.id})">修改</button>
                        <button class="btn btn-secondary" onclick="deleteActivity(${activity.id})">删除</button>
                    </div>
                `;
            } else if (currentUser) {
                if (isPast) {
                    actionButton = '<button class="btn btn-secondary" disabled style="margin-top: 10px;">活动已结束</button>';
                } else {
                    actionButton = `<button class="btn btn-primary" onclick="registerActivity(${activity.id})" style="margin-top: 10px;">立即报名</button>`;
                }
            }

            card.innerHTML = `
                <div class="card-header">${activity.title}</div>
                <div class="card-body">
                    <p>${activity.description}</p>
                    <p><strong>地点:</strong> ${activity.location}</p>
                    <p><strong>时间:</strong> ${formatDate(activity.event_date || activity.eventDate)}</p>
                    <p><strong>最大人数:</strong> ${activity.max_participants || activity.maxParticipants}</p>
                    ${actionButton}
                </div>
            `;

            container.appendChild(card);
        });
    } catch (error) {
        console.error('获取活动列表错误:', error);
        container.innerHTML = '<p>加载失败，请重试</p>';
    }
}

async function renderMyRegistrations() {
    if (!currentUser) {
        document.getElementById('myRegistrations').innerHTML = '<p>请先登录</p>';
        return;
    }

    const container = document.getElementById('myRegistrations');
    if (!container) return;
    
    container.innerHTML = '<p>加载中...</p>';

    try {
        const registrations = await api.records.getActivities();
        const activitiesList = registrations || [];

        container.innerHTML = '';

        if (activitiesList.length === 0) {
            container.innerHTML = '<p>您还没有报名任何活动</p>';
            return;
        }

        activitiesList.forEach(reg => {
            const card = document.createElement('div');
            card.className = 'registration-card';

            card.innerHTML = `
                <div class="registration-title">${reg.title || '活动'}</div>
                <div class="registration-meta">
                    <div>📅 活动时间: ${formatDate(reg.event_date)}</div>
                    <div>⏰ 报名时间: ${formatDate(reg.registered_at || reg.registeredAt)}</div>
                    <div>✅ 状态: ${reg.status === 'confirmed' ? '已确认' : '待确认'}</div>
                </div>
                <button class="btn-cancel" onclick="cancelRegistration(${reg.id})">取消报名</button>
            `;

            container.appendChild(card);
        });
    } catch (error) {
        console.error('加载我的报名失败:', error);
        container.innerHTML = '<p>加载失败，请重试</p>';
    }
}

async function renderDonations() {
    const container = document.getElementById('donationsList');
    if (!container) return;
    
    container.innerHTML = '<p>加载中...</p>';

    try {
        const data = await apiRequest('/donations');
        const donations = data.donations || data || [];

        container.innerHTML = '';

        donations.forEach(donation => {
            const card = document.createElement('div');
            card.className = 'card';

            const progress = (donation.current_amount / donation.target_amount) * 100;
            let actionButton = '';

            if (currentUser && currentUser.role === 'admin') {
                actionButton = `
                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        <button class="btn btn-primary" onclick="editDonation(${donation.id})">修改</button>
                        <button class="btn btn-secondary" onclick="toggleDonationStatus(${donation.id})">
                            ${donation.status === 'open' ? '关闭' : '开启'}
                        </button>
                    </div>
                `;
            } else {
                if (donation.status === 'open') {
                    actionButton = `<button class="btn btn-primary" onclick="donate(${donation.id})" style="margin-top: 10px;">立即捐赠</button>`;
                } else {
                    actionButton = `<button class="btn btn-secondary" disabled style="margin-top: 10px;">捐赠已结束</button>`;
                }
            }

            card.innerHTML = `
                <div class="card-header">${donation.title}</div>
                <div class="card-body">
                    <p>${donation.description}</p>
                    <p><strong>目标金额:</strong> ¥${donation.target_amount}</p>
                    <p><strong>已筹集:</strong> ¥${donation.current_amount}</p>
                    <div style="background: #e0e0e0; border-radius: 4px; height: 20px; margin: 10px 0;">
                        <div style="background: var(--primary-color); height: 100%; border-radius: 4px; width: ${progress}%;"></div>
                    </div>
                    <p><strong>进度:</strong> ${progress.toFixed(1)}%</p>
                    ${actionButton}
                </div>
            `;

            container.appendChild(card);
        });
    } catch (error) {
        console.error('获取捐赠项目列表错误:', error);
        container.innerHTML = '<p>加载失败，请重试</p>';
    }
}

async function renderProducts() {
    const container = document.getElementById('productsList');
    if (!container) return;
    
    container.innerHTML = '<p>加载中...</p>';

    try {
        const data = await apiRequest('/products');
        const products = data.products || data || [];

        let userPoints = 0;
        if (currentUser) {
            userPoints = await calculateUserPoints();
        }

        container.innerHTML = '';

        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'card';

            let actionButton = '';

            // 使用price_points或points属性
            const productPoints = product.price_points || product.points || 0;

            if (currentUser && currentUser.role === 'admin') {
                actionButton = `
                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        <button class="btn btn-primary" onclick="editProduct(${product.id})">修改</button>
                        <button class="btn btn-secondary" onclick="deleteProduct(${product.id})">删除</button>
                    </div>
                `;
            } else {
                const canExchange = userPoints >= productPoints && product.stock > 0;

                actionButton = `
                    <button class="btn ${canExchange ? 'btn-primary' : 'btn-secondary'}" 
                            onclick="exchangeProduct(${product.id})" 
                            ${!canExchange ? 'disabled' : ''} 
                            style="margin-top: 10px;">
                        ${canExchange ? '立即兑换' : '积分不足'}
                    </button>
                `;
            }

            card.innerHTML = `
                <div class="card-header">${product.name}</div>
                <div class="card-body">
                    <p>${product.description}</p>
                    <p><strong>所需积分:</strong> ${productPoints}</p>
                    <p><strong>库存:</strong> ${product.stock}</p>
                    ${actionButton}
                </div>
            `;

            container.appendChild(card);
        });
    } catch (error) {
        console.error('获取商品列表错误:', error);
        container.innerHTML = '<p>加载失败，请重试</p>';
    }
}

async function updatePointsDisplay() {
    if (currentUser) {
        const points = await calculateUserPoints();
        document.getElementById('currentPoints').textContent = points;
    } else {
        document.getElementById('currentPoints').textContent = '0';
    }
}

async function calculateUserPoints() {
    if (!currentUser) return 0;

    try {
        const data = await apiRequest('/points/current');
        return data.points || 0;
    } catch (error) {
        console.error('获取用户积分错误:', error);
        return 0;
    }
}

async function renderUserActivities() {
    const container = document.getElementById('userActivitiesTable');
    if (!container) return;
    
    container.innerHTML = '<tr><td colspan="4">加载中...</td></tr>';

    if (currentUser) {
        try {
            const userActivities = await apiRequest('/registrations/user');
            const activitiesList = userActivities || [];

            container.innerHTML = '';

            if (activitiesList.length === 0) {
                container.innerHTML = '<tr><td colspan="4">暂无活动记录</td></tr>';
                return;
            }

            activitiesList.forEach(activity => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${activity.title}</td>
                    <td>${formatDate(activity.event_date)}</td>
                    <td>${activity.location}</td>
                    <td>${activity.status === 'confirmed' ? '已确认' : '待确认'}</td>
                `;
                container.appendChild(row);
            });
        } catch (error) {
            console.error('获取用户活动记录错误:', error);
            container.innerHTML = '<tr><td colspan="4">加载失败</td></tr>';
        }
    }
}

async function renderUserDonations() {
    const container = document.getElementById('userDonationsTable');
    if (!container) return;
    
    container.innerHTML = '<tr><td colspan="3">加载中...</td></tr>';

    if (currentUser) {
        try {
            const userDonations = await apiRequest('/user/donations');
            const donationsList = userDonations || [];

            container.innerHTML = '';

            if (donationsList.length === 0) {
                container.innerHTML = '<tr><td colspan="3">暂无捐赠记录</td></tr>';
                return;
            }

            donationsList.forEach(donation => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${donation.title}</td>
                    <td>¥${donation.amount}</td>
                    <td>${formatDate(donation.donated_at)}</td>
                `;
                container.appendChild(row);
            });
        } catch (error) {
            console.error('获取用户捐赠记录错误:', error);
            container.innerHTML = '<tr><td colspan="3">加载失败</td></tr>';
        }
    }
}

async function renderUserPoints() {
    const container = document.getElementById('userPointsTable');
    if (!container) return;
    
    container.innerHTML = '<tr><td colspan="3">加载中...</td></tr>';

    if (currentUser) {
        try {
            const userPoints = await apiRequest('/points/history');
            const pointsList = userPoints || [];

            container.innerHTML = '';

            if (pointsList.length === 0) {
                container.innerHTML = '<tr><td colspan="3">暂无积分记录</td></tr>';
                return;
            }

            pointsList.forEach(point => {
                // 根据type字段显示来源
                const sourceMap = {
                    'activity': '参与活动',
                    'donation': '爱心捐赠',
                    'exchange': '积分兑换',
                    'system': '系统奖励'
                };
                const source = sourceMap[point.type] || point.type || '其他';
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${source}</td>
                    <td>${point.points > 0 ? '+' : ''}${point.points}</td>
                    <td>${formatDate(point.created_at)}</td>
                `;
                container.appendChild(row);
            });
        } catch (error) {
            console.error('获取用户积分记录错误:', error);
            container.innerHTML = '<tr><td colspan="3">加载失败</td></tr>';
        }
    }
}

async function renderUserExchanges() {
    const container = document.getElementById('userExchangesTable');
    if (!container) return;
    
    container.innerHTML = '<tr><td colspan="3">加载中...</td></tr>';

    if (currentUser) {
        try {
            const userExchanges = await apiRequest('/user/exchanges');
            const exchangesList = userExchanges || [];

            container.innerHTML = '';

            if (exchangesList.length === 0) {
                container.innerHTML = '<tr><td colspan="3">暂无兑换记录</td></tr>';
                return;
            }

            exchangesList.forEach(exchange => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${exchange.product_name}</td>
                    <td>${exchange.points}</td>
                    <td>${formatDate(exchange.exchanged_at)}</td>
                `;
                container.appendChild(row);
            });
        } catch (error) {
            console.error('获取用户兑换记录错误:', error);
            container.innerHTML = '<tr><td colspan="3">加载失败</td></tr>';
        }
    }
}

// ==================== 业务功能函数 ====================
async function registerActivity(activityId) {
    if (!currentUser) {
        alert('请先登录！');
        document.getElementById('loginModal').classList.add('active');
        return;
    }

    try {
        await api.activities.register(activityId);
        alert('报名成功！');
        renderActivities();
        updatePointsDisplay();
        // 如果当前在我的报名页面，重新渲染
        if (currentPage === 'my-activities') {
            renderMyRegistrations();
        }
    } catch (error) {
        alert(error.message || '报名失败');
    }
}

async function donate(donationId) {
    if (!currentUser) {
        alert('请先登录！');
        document.getElementById('loginModal').classList.add('active');
        return;
    }

    const amount = prompt('请输入捐赠金额（元）:');
    if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
        const numAmount = parseFloat(amount);

        try {
            await api.donations.donate(donationId, numAmount);
            alert(`捐赠成功！感谢您的爱心捐赠${numAmount}元。`);
            renderDonations();
            updatePointsDisplay();
            // 如果当前在个人中心的捐赠记录页面，重新渲染
            if (currentPage === 'profile' && document.getElementById('donationsTab').classList.contains('active')) {
                renderUserDonations();
            }
        } catch (error) {
            alert(error.message || '捐赠失败');
        }
    }
}

async function exchangeProduct(productId) {
    if (!currentUser) {
        alert('请先登录！');
        document.getElementById('loginModal').classList.add('active');
        return;
    }

    const userPoints = await calculateUserPoints();
    const product = await getProductDetail(productId);

    // 使用price_points或points属性
    const productPoints = product.price_points || product.points || 0;

    if (product && product.stock > 0 && userPoints >= productPoints) {
        if (confirm(`确定要兑换 ${product.name} 吗？将消耗 ${productPoints} 积分。`)) {
            try {
                await api.products.exchange(productId);
                alert(`兑换成功！已消耗 ${productPoints} 积分。`);
                renderProducts();
                updatePointsDisplay();
                if (document.getElementById('exchangesTab').classList.contains('active')) {
                    renderUserExchanges();
                }
            } catch (error) {
                alert(error.message || '兑换失败');
            }
        }
    } else {
        alert('积分不足或商品已无库存！');
    }
}

async function getProductDetail(productId) {
    try {
        const url = buildUrl('/products/:id', { id: productId });
        const data = await apiRequest(url);
        // 正确处理API响应格式
        return data.data || data;
    } catch (error) {
        console.error('获取商品详情错误:', error);
        return null;
    }
}

async function cancelRegistration(registrationId) {
    if (!confirm('确定要取消报名吗？')) {
        return;
    }

    try {
        const url = `/registrations/${registrationId}`;
        await apiRequest(url, {
            method: 'DELETE'
        });
        alert('取消报名成功！');
        renderMyRegistrations();
    } catch (error) {
        console.error('取消报名失败:', error);
        alert('取消报名失败，请稍后重试');
    }
}

// ==================== 管理员功能 ====================
async function editActivity(id) {
    try {
        const url = `/activities/${id}`;
        const data = await apiRequest(url);
        const activity = data.data || data;

        document.getElementById('activityForm').style.display = 'block';
        document.getElementById('activityFormTitle').textContent = '编辑活动';
        document.getElementById('activityId').value = activity.id;
        document.getElementById('activityTitle').value = activity.title;
        document.getElementById('activityDescription').value = activity.description;
        document.getElementById('activityLocation').value = activity.location;
        document.getElementById('activityDate').value = activity.eventDate.replace(' ', 'T').slice(0, 16);
        document.getElementById('activityMaxParticipants').value = activity.maxParticipants;
    } catch (error) {
        alert('获取活动详情失败: ' + error.message);
        console.error('编辑活动失败:', error);
    }
}

async function deleteActivity(id) {
    if (confirm('确定要删除这个活动吗？')) {
        try {
            const url = `/activities/${id}`;
            await apiRequest(url, {
                method: 'DELETE'
            });
            renderActivities();
            alert('活动已删除！');
        } catch (error) {
            alert('删除活动失败: ' + error.message);
            console.error('删除活动失败:', error);
        }
    }
}

async function editDonation(id) {
    try {
        const url = `/donations/${id}`;
        const data = await apiRequest(url);
        const donation = data.data || data;

        document.getElementById('donationForm').style.display = 'block';
        document.getElementById('donationFormTitle').textContent = '编辑捐赠项目';
        document.getElementById('donationId').value = donation.id;
        document.getElementById('donationTitle').value = donation.title;
        document.getElementById('donationDescription').value = donation.description;
        document.getElementById('donationTargetAmount').value = donation.target_amount;
    } catch (error) {
        alert('获取捐赠项目详情失败: ' + error.message);
        console.error('编辑捐赠项目失败:', error);
    }
}

async function toggleDonationStatus(id) {
    try {
        const url = buildUrl('/donations/:id', { id });
        const donation = await apiRequest(url);

        const newStatus = donation.status === 'open' ? 'closed' : 'open';

        await apiRequest(url, {
            method: 'PUT',
            body: { status: newStatus }
        });

        alert(`已${newStatus === 'open' ? '开启' : '关闭'}捐赠项目`);
        renderDonations();
    } catch (error) {
        alert(error.message || '操作失败');
    }
}

async function editProduct(id) {
    try {
        const url = `/products/${id}`;
        const data = await apiRequest(url);
        const product = data.data || data;

        document.getElementById('productForm').style.display = 'block';
        document.getElementById('productFormTitle').textContent = '编辑商品';
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productDescription').value = product.description;
        document.getElementById('productPoints').value = product.price_points;
        document.getElementById('productStock').value = product.stock;
    } catch (error) {
        alert('获取商品详情失败: ' + error.message);
        console.error('编辑商品失败:', error);
    }
}

async function deleteProduct(id) {
    if (confirm('确定要删除这个商品吗？')) {
        try {
            const url = `/products/${id}`;
            await apiRequest(url, {
                method: 'DELETE'
            });
            renderProducts();
            alert('商品已删除！');
        } catch (error) {
            alert('删除商品失败: ' + error.message);
            console.error('删除商品失败:', error);
        }
    }
}

// ==================== 全局导出 ====================
// 将需要在HTML中调用的函数挂载到window对象
window.registerActivity = registerActivity;
window.donate = donate;
window.exchangeProduct = exchangeProduct;
window.cancelRegistration = cancelRegistration;
window.editActivity = editActivity;
window.deleteActivity = deleteActivity;
window.editDonation = editDonation;
window.toggleDonationStatus = toggleDonationStatus;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;