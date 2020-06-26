import { API_URL } from "./api.js";

const container = document.getElementById("create-post-div");
const textareaMessage = document.getElementById("contact-textarea-message");
const textareaName = document.getElementById("contact-textarea-name");
const textareaEmail = document.getElementById("contact-textarea-email");
const successMessage = `<p id='contact-success'>Your message has been successfully submitted</p>`;

textareaMessage.focus();

function onSubmit(token) {
  if (textareaMessage.value) {
    const submitButton = document.getElementById("submit-post-button");
    submitButton.innerHTML = "";
    const loadingAnimation = `    <i
    class="fa fa-circle-o-notch fa-spin"
  ></i
  >`;
    submitButton.insertAdjacentHTML("beforeend", loadingAnimation);

    const data = {
      message: textareaMessage.value,
      name: textareaName.value,
      email: textareaEmail.value,
      "g-recaptcha-response": token,
    };

    fetch(API_URL + "contact/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      credentials: "include",
    })
      .then((response) => {
        if (response.ok) {
          container.innerHTML = "";
          container.insertAdjacentHTML("afterbegin", successMessage);
        } else alert("An error occured");
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  } else document.getElementById("fill-in-title-error").style.display = "block";
}

window.onSubmit = onSubmit;
