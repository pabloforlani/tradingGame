async function register() {
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const encryptedPassword = btoa(password); // Simple encriptación
    
    users.push({ username, email, password: encryptedPassword, balance: 100, operations: [], pnl: 0, lenguage: "es" });
    localStorage.setItem('users', JSON.stringify(users));
    alert('Registration successful!');
    window.location.href = 'login.html';
}

async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const encryptedPassword = btoa(password);
    const user = users.find(u => u.email === email && u.password === encryptedPassword);

    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        alert('Login successful!');
        window.location.href = 'index.html';
    } else {
        alert('Invalid credentials');
    }
}