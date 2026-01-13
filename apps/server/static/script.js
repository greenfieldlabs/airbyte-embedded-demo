let currentUser = null;
let isPasswordAuthenticated = false;

function setTheme(theme) {
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');
    
    body.setAttribute('data-theme', theme);
    themeToggle.textContent = theme === 'light' ? '☀️' : '🌙';
    localStorage.setItem('theme', theme);
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

function showToast(text, isError = false) {
    const toastDiv = document.getElementById('toast');
    toastDiv.textContent = text;
    toastDiv.className = isError ? 'error' : 'success';
    toastDiv.style.display = 'block';
    
    // Clear any existing timeout
    if (toastDiv.timeoutId) {
        clearTimeout(toastDiv.timeoutId);
    }
    
    // Set timeout to hide toast after 5 seconds
    toastDiv.timeoutId = setTimeout(() => {
        toastDiv.style.display = 'none';
    }, 5000);
}

async function handlePasswordAuth() {
    const password = document.getElementById('password').value;
    const spinner = document.getElementById('passwordSpinner');
    const submitButton = document.querySelector('#passwordForm .action-btn');
    
    if (!password) {
        showToast('Please enter the access password', true);
        return;
    }

    try {
        spinner.classList.add('visible');
        submitButton.disabled = true;

        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password }),
        });

        if (response.ok) {
            isPasswordAuthenticated = true;
            updatePasswordUI();
            showToast('Access granted!');
            
            // Check for existing user login after password authentication
            checkExistingLogin();
        } else {
            const data = await response.json();
            showToast(data.error || 'Invalid password', true);
        }
    } catch (error) {
        showToast('An error occurred', true);
    } finally {
        spinner.classList.remove('visible');
        submitButton.disabled = false;
    }
}

function updatePasswordUI() {
    const passwordForm = document.getElementById('passwordForm');
    const loginForm = document.getElementById('loginForm');
    const logoutToggle = document.getElementById('logout-toggle');
    
    if (isPasswordAuthenticated) {
        passwordForm.style.display = 'none';
        loginForm.style.display = 'block';
        logoutToggle.style.display = 'flex';
    } else {
        passwordForm.style.display = 'block';
        loginForm.style.display = 'none';
        logoutToggle.style.display = 'none';
    }
}

async function checkExistingLogin() {
    if (!isPasswordAuthenticated) return;
    
    try {
        const response = await fetch('/api/users/me');
        if (response.ok) {
            const userData = await response.json();
            currentUser = userData.email;
            updateUI();
        }
    } catch (error) {
        console.error('Error checking authentication status:', error);
    }
}

async function updateUI() {
    const userInfo = document.getElementById('userInfo');
    const loggedInEmail = document.getElementById('loggedInEmail');
    const emailInput = document.getElementById('email');
    const loginForm = document.getElementById('loginForm');
    const airbyteHint = document.getElementById('airbyteHint');
    const logo = document.querySelector('.logo');
    
    if (currentUser) {
        // User is logged in (page 3) - show user info and hide login form and logo
        userInfo.classList.add('visible');
        loggedInEmail.textContent = currentUser;
        emailInput.value = '';
        loginForm.style.display = 'none';
        airbyteHint.style.display = 'block';
        logo.classList.add('hide-when-logged-in');
    } else if (isPasswordAuthenticated) {
        // Password authenticated but no user (page 2) - show login form and logo
        userInfo.classList.remove('visible');
        loginForm.style.display = 'block';
        airbyteHint.style.display = 'none';
        logo.classList.remove('hide-when-logged-in');
    } else {
        // Not password authenticated (page 1) - hide everything except password form and show logo
        userInfo.classList.remove('visible');
        loginForm.style.display = 'none';
        airbyteHint.style.display = 'none';
        logo.classList.remove('hide-when-logged-in');
    }
}

async function handleUserAction() {
    if (!isPasswordAuthenticated) {
        showToast('Please authenticate first', true);
        return;
    }

    const workspaceName = document.getElementById('workspaceName').value;
    const email = document.getElementById('email').value;
    const spinner = document.getElementById('spinner');
    const submitButton = document.querySelector('#loginForm .action-btn');
    const toastDiv = document.getElementById('toast');

    if (!workspaceName) {
        showToast('Please enter a workspace name', true);
        return;
    }

    if (!email) {
        showToast('Please enter an email address', true);
        return;
    }

    try {
        // Show spinner and disable button, hide toast
        spinner.classList.add('visible');
        submitButton.disabled = true;
        toastDiv.textContent = '';
        toastDiv.className = '';

        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, workspaceName }),
        });

        const data = await response.json();

        if (response.ok) {
            currentUser = email;
            updateUI();
            showToast(response.status === 201 ? 'User created and logged in successfully!' : 'Login successful!');
        } else {
            showToast(data.error || 'Failed to process request', true);
        }
    } catch (error) {
        showToast('An error occurred', true);
    } finally {
        // Hide spinner and enable button
        spinner.classList.remove('visible');
        submitButton.disabled = false;
    }
}

async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        currentUser = null;
        updateUI(); // This will show the email form again since password is still authenticated
        showToast('User logged out successfully');
    } catch (error) {
        console.error('Error during logout:', error);
        showToast('Error during logout', true);
    }
}

async function logoutFromApp() {
    try {
        // Clear both user and password authentication
        await fetch('/api/logout', { method: 'POST' });
        
        // Clear password cookie by making it expire
        document.cookie = 'appPassword=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        // Reset state
        currentUser = null;
        isPasswordAuthenticated = false;
        
        // Update UI to show password form
        updatePasswordUI();
        updateUI();
        
        showToast('Logged out from application');
    } catch (error) {
        console.error('Error during app logout:', error);
        showToast('Error during logout', true);
    }
} 