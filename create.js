import { API_URL } from "./api.js";
import { includesProfanity } from "./includesprofanity.js";
import { isLinkOnly } from "./islinkonly.js";

const textareaTitle = document.getElementById("textarea-title");

textareaTitle.focus();

function onSubmit(token) {
  if (textareaTitle.value) {
    if (
      isLinkOnly(textareaTitle.value) ||
      includesProfanity(textareaTitle.value)
    ) {
      document.getElementById("create-tos-violation-error").style.display =
        "block";
      setTimeout(function () {
        document.getElementById("create-tos-violation-error").style.display =
          "none";
      }, 10000);
    } else {
      const submitButton = document.getElementById("submit-post-button");
      submitButton.innerHTML = "";
      const loadingAnimation = `    <i
    class="fa fa-circle-o-notch fa-spin"
  ></i
  >`;
      submitButton.insertAdjacentHTML("beforeend", loadingAnimation);

      const data = {
        title: textareaTitle.value,
        "g-recaptcha-response": token,
      };

      fetch(API_URL + "post/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      })
        .then((response) => {
          if (response.ok) return (window.location.href = "/");
          else alert("An error occured");
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    }
  } else document.getElementById("fill-in-title-error").style.display = "block";
}

window.onSubmit = onSubmit;
