const DB_USERS = 'switchweek_g_users';
const DB_VAULT = 'switchweek_g_vault';

let isCreateMode = false;
let currentUser = null;
let currentProfile = { name: "User", pic: "https://via.placeholder.com/32" };
let categories = ["All", "Banking", "Social Media", "Work"];
let activeCategory = "All";

// --- AUTH LOGIC ---
const loginBtn = document.getElementById('login-btn');
const toggleSignupBtn = document.getElementById('toggle-signup-btn');
const authHeading = document.querySelector('.auth-heading');
const authSub = document.querySelector('.auth-sub');
const authError = document.getElementById('auth-error');

toggleSignupBtn.addEventListener('click', () => {
    isCreateMode = !isCreateMode;
    if (isCreateMode) {
        authHeading.innerText = "Create Account";
        authSub.innerText = "Please enter details to register.";
        loginBtn.innerText = "Sign up";
        document.querySelector('.signup-row span').innerText = "Already have an account?";
        toggleSignupBtn.innerText = "Sign in";
    } else {
        authHeading.innerText = "Welcome back";
        authSub.innerText = "Please enter your detail to sign in.";
        loginBtn.innerText = "Sign in";
        document.querySelector('.signup-row span').innerText = "Don't have an account yet?";
        toggleSignupBtn.innerText = "Sign up";
    }
    authError.style.display = 'none';
});

loginBtn.addEventListener('click', () => {
    const username = document.getElementById('auth-username').value.trim();
    const password = document.getElementById('auth-password').value;
    
    if (!username || !password) {
        authError.innerText = "Please fill both fields.";
        authError.style.display = 'block';
        return;
    }

    let usersDB = JSON.parse(localStorage.getItem(DB_USERS)) || {};

    if (isCreateMode) {
        if (usersDB[username]) {
            authError.innerText = "Username already taken!";
            authError.style.display = 'block';
        } else {
            currentUser = username;
            usersDB[username] = { password: password, name: username, pic: "" };
            localStorage.setItem(DB_USERS, JSON.stringify(usersDB));
            bootDashboard();
        }
    } else {
        if (usersDB[username] && usersDB[username].password === password) {
            currentUser = username;
            currentProfile.name = usersDB[username].name;
            currentProfile.pic = usersDB[username].pic || "https://via.placeholder.com/32";
            bootDashboard();
        } else {
            authError.innerText = "Invalid credentials!";
            authError.style.display = 'block';
        }
    }
});

function bootDashboard() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('dashboard-screen').style.display = 'block'; // Fixed display property
    document.getElementById('dashboard-profile-pic').src = currentProfile.pic;
    renderCategories();
    renderVault();
}

// --- HAMBURGER MENU & PRIVACY MODAL ---
const menuBtn = document.getElementById('menu-btn');
const sideMenu = document.getElementById('side-menu');
const privacyModal = document.getElementById('privacy-modal');

menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    sideMenu.style.display = sideMenu.style.display === 'none' ? 'block' : 'none';
});

document.addEventListener('click', (e) => {
    if (!menuBtn.contains(e.target) && !sideMenu.contains(e.target)) {
        sideMenu.style.display = 'none';
    }
});

document.getElementById('privacy-btn-menu').addEventListener('click', () => {
    sideMenu.style.display = 'none';
    privacyModal.style.display = 'flex';
});

document.querySelectorAll('.close-privacy').forEach(btn => {
    btn.addEventListener('click', () => privacyModal.style.display = 'none');
});

// --- PROFILE MODAL WIRING ---
const profileModal = document.getElementById('profile-modal');
document.getElementById('profile-trigger').addEventListener('click', () => {
    document.getElementById('edit-profile-name').value = currentProfile.name;
    document.getElementById('edit-profile-pic-preview').src = currentProfile.pic || "https://via.placeholder.com/80";
    profileModal.style.display = 'flex';
});

document.querySelectorAll('.close-profile').forEach(btn => {
    btn.addEventListener('click', () => profileModal.style.display = 'none');
});

document.getElementById('logout-btn').addEventListener('click', () => location.reload());

let editPicBase64 = "";
document.getElementById('edit-profile-pic').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
        editPicBase64 = reader.result;
        document.getElementById('edit-profile-pic-preview').src = editPicBase64;
    };
    if (file) reader.readAsDataURL(file);
});

document.getElementById('save-profile-btn').addEventListener('click', () => {
    const newName = document.getElementById('edit-profile-name').value;
    currentProfile.name = newName || currentUser;
    if(editPicBase64) currentProfile.pic = editPicBase64;
    
    let usersDB = JSON.parse(localStorage.getItem(DB_USERS));
    usersDB[currentUser].name = currentProfile.name;
    usersDB[currentUser].pic = currentProfile.pic;
    localStorage.setItem(DB_USERS, JSON.stringify(usersDB));

    document.getElementById('dashboard-profile-pic').src = currentProfile.pic || "https://via.placeholder.com/32";
    profileModal.style.display = 'none';
});

// --- VAULT & ADD MODAL ---
const addModal = document.getElementById('add-modal');
document.getElementById('fab-add').addEventListener('click', () => {
    addModal.style.display = 'flex';
});
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => addModal.style.display = 'none');
});

let appPicBase64 = "";
document.getElementById('app-logo').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => { appPicBase64 = reader.result; };
    if (file) reader.readAsDataURL(file);
});

document.getElementById('save-btn').addEventListener('click', () => {
    const name = document.getElementById('app-name').value;
    const user = document.getElementById('app-username').value;
    const pass = document.getElementById('app-password').value;
    const cat = document.getElementById('app-category').value;

    if (!name || !user || !pass) return;

    const newItem = {
        id: Date.now(),
        owner: currentUser,
        logo: appPicBase64,
        category: cat,
        name: name,
        user: user,
        pass: pass
    };

    let vault = JSON.parse(localStorage.getItem(DB_VAULT)) || [];
    vault.unshift(newItem);
    localStorage.setItem(DB_VAULT, JSON.stringify(vault));
    
    document.getElementById('app-name').value = '';
    document.getElementById('app-username').value = '';
    document.getElementById('app-password').value = '';
    appPicBase64 = "";
    
    addModal.style.display = 'none';
    renderVault();
});

// --- CATEGORIES ---
function renderCategories() {
    const list = document.getElementById('category-list');
    list.innerHTML = "";
    categories.forEach(cat => {
        const span = document.createElement('span');
        span.className = `category-chip ${activeCategory === cat ? 'active' : ''}`;
        span.innerText = cat;
        span.onclick = () => { activeCategory = cat; renderCategories(); renderVault(); };
        list.appendChild(span);
    });
    
    const select = document.getElementById('app-category');
    select.innerHTML = "";
    categories.filter(c => c !== "All").forEach(cat => {
        select.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
}

document.getElementById('add-category-btn').addEventListener('click', () => {
    const newCat = prompt("Enter new category name:");
    if(newCat && newCat.trim() !== "") {
        categories.push(newCat.trim());
        renderCategories();
    }
});

function renderVault() {
    let vault = JSON.parse(localStorage.getItem(DB_VAULT)) || [];
    let myVault = vault.filter(item => item.owner === currentUser);
    
    if(activeCategory !== "All") {
        myVault = myVault.filter(item => item.category === activeCategory);
    }

    const vaultList = document.getElementById('vault-list');
    vaultList.innerHTML = "";

    if (myVault.length === 0) {
        vaultList.innerHTML = "<div style='padding: 30px; text-align: center; color: #5f6368; font-size: 14px;'>No passwords saved in this category.</div>";
        return;
    }

    myVault.forEach(item => {
        const div = document.createElement('div');
        div.className = "list-item";
        const imgHtml = item.logo ? `<img src="${item.logo}" class="item-icon">` : `<div class="item-icon">${item.name.charAt(0).toUpperCase()}</div>`;
        div.innerHTML = `
            <div class="item-left" onclick="alert('Platform: ${item.name}\\nCategory: ${item.category}\\n\\nPassword: ${item.pass}')">
                ${imgHtml}
                <div class="item-text">
                    <h4 style="margin-bottom:2px; color:#1a1a1a; font-weight: 500;">${item.name}</h4>
                    <p style="font-size:12px; color:#777;">${item.user}</p>
                </div>
            </div>
            <span class="material-icons-outlined" style="color: #d93025; cursor:pointer;" onclick="deleteItem(${item.id})">delete_outline</span>
        `;
        vaultList.appendChild(div);
    });
}

function deleteItem(id) {
    if(confirm("Delete this password forever?")) {
        let vault = JSON.parse(localStorage.getItem(DB_VAULT)) || [];
        vault = vault.filter(item => item.id !== id);
        localStorage.setItem(DB_VAULT, JSON.stringify(vault));
        renderVault();
    }
}