function handleLoginFormSubmit(e) {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const error = document.getElementById("error");

  if (username === "admin" && password === "admin") {
    window.location.href = "home.html";
  } else {
    error.classList.remove("hidden");
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
  }
}

function setupLoginForm() {
  const form = document.getElementById("loginForm");
  form.addEventListener("submit", handleLoginFormSubmit);
}

document.addEventListener("DOMContentLoaded", setupLoginForm);
