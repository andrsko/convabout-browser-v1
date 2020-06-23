const dropdownMenuButton = document.getElementById("dropdownMenuButton");
const headerDropdownContent = document.querySelector(
  ".header-dropdown-content"
);
const searchBarButton = document.getElementById("search-bar-button");

dropdownMenuButton.addEventListener("click", function (event) {
  if (window.getComputedStyle(headerDropdownContent).display == "none") {
    headerDropdownContent.style.display = "block";
  } else {
    headerDropdownContent.style.display = "none";
  }
});

document.addEventListener("click", function (event) {
  const target = event.target;
  if (
    !(
      target.classList.contains("header-dropdown-item") ||
      target.classList.contains("fa-ellipsis-h") ||
      target.classList.contains("header-dropdown-toggle")
    )
  ) {
    headerDropdownContent.style.display = "none";
  }
});

searchBarButton.addEventListener("click", function (event) {
  const searchBarInputElement = document.getElementById("search-bar-input");
  const q = searchBarInputElement.value;
  window.location.href = "/search?q=" + q;
});

const searchBarInputElement = document.getElementById("search-bar-input");

searchBarInputElement.addEventListener("keyup", function (event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    document.getElementById("search-bar-button").click();
  }
});

const homeButton = document.getElementById("navlink-home-button");
const myTalksButton = document.getElementById("navlink-my-talks-button");
const createButton = document.getElementById("navlink-create-button");

function replaceWithIcons() {
  homeButton.innerHTML = `<i class="fa fa-home"></i>`;
  const notificationBadgeVisibility = document.querySelector(
    ".notification-badge"
  ).style.visibility;
  myTalksButton.innerHTML = `<i class="fa fa-comment"></i><span class="notification-badge"></span>`;
  document.querySelector(
    ".notification-badge"
  ).style.visibility = notificationBadgeVisibility;
  createButton.innerHTML = `<i class="fa fa-plus"></i>`;
}
function replaceWithText() {
  homeButton.innerHTML = `Home`;
  const notificationBadgeVisibility = document.querySelector(
    ".notification-badge"
  ).style.visibility;
  myTalksButton.innerHTML = `<span>My Conversations</span><span class="notification-badge"></span>`;
  document.querySelector(
    ".notification-badge"
  ).style.visibility = notificationBadgeVisibility;
  createButton.innerHTML = `Create`;
}

if (window.innerWidth < 769) {
  replaceWithIcons();
  headerDropdownContent.classList.remove("dropdown-menu-center");
  headerDropdownContent.classList.add("dropdown-menu-right");
}

window.addEventListener("resize", onWindowResizeNavbar);
function onWindowResizeNavbar() {
  if (window.innerWidth < 769) {
    replaceWithIcons();
    headerDropdownContent.classList.remove("dropdown-menu-center");
    headerDropdownContent.classList.add("dropdown-menu-right");
  } else {
    replaceWithText();
    headerDropdownContent.classList.remove("dropdown-menu-right");
    headerDropdownContent.classList.add("dropdown-menu-center");
  }
}
