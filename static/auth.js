const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const loginTab = document.querySelector("#login-tab");
const registerTab = document.querySelector("#register-tab");

function showForm(form) {
    loginForm.classList.toggle("hidden", form != "login");
    registerForm.classList.toggle("hidden", form != "register")
}

window.onload = () => showForm("login");

loginForm.addEventListener("submit", event => {
    event.preventDefault();
    const { username, password } = loginForm;  
    const user = JSON.stringify({
        login: username.value,
        password: password.value
    })
    fetch("/api/login", {
        method: "POST",
        body: user
    }).then(async response => {
        let data = await response.json();
        if (response.status == 200) {
            const token = data.token;
            let expires = new Date();
            let days = 7;
            expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000))
            document.cookie = `token=${token}; expires=${expires.toString()}`;
            window.location.assign("/");
        } else {
            alertify.error(data.error);
        }
    })
})

registerForm.addEventListener("submit", event => {
    event.preventDefault();
    const { username, password, cpassword } = registerForm;
    if (password.value != cpassword.value) {
        return alertify.error("Password not match")
    }
    const user = JSON.stringify({
        login: username.value,
        password: password.value
    })
    fetch("/api/register", {
        method: "POST",
        body: user
    }).then(async response => {
        let data = await response.json();
        if (response.status == 201) {
            alertify.success("Register success");
            showForm("login");
        } else {
            alertify.error(data.error);
        }
    })
})