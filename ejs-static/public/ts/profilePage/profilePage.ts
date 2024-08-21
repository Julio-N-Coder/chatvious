const deleteAccountConfirmButton = document.getElementById(
  "DELETE_ACCOUNT_CONFIRM_BUTTON"
) as HTMLButtonElement;
const deleteAccountInput = document.getElementById(
  "DELETE_ACCOUNT_INPUT"
) as HTMLInputElement;
const errorContainer = document.getElementById(
  "error-container"
) as HTMLDivElement;
const errorText = document.getElementById("error-text") as HTMLSpanElement;
const deleteRoomButtonLoader = document.getElementById(
  "delete-room-button-loader"
) as HTMLElement;

function toggleConfirmDeleteButtonState() {
  deleteAccountConfirmButton.classList.toggle("btn-disabled");
  deleteRoomButtonLoader.classList.toggle("hidden");
  deleteAccountConfirmButton.classList.toggle("px-1");
}

async function submitDeleteAccount() {
  const deleteAccountInputValue = deleteAccountInput.value;

  if (deleteAccountInputValue.toLocaleLowerCase() === "delete") {
    toggleConfirmDeleteButtonState();
    deleteAccountInput.value = "";
    const deleteAccountUrl = `${process.env.DOMAIN_URL}/user/deleteAccount`;

    let response: Response;
    try {
      response = await fetch(deleteAccountUrl, {
        method: "POST",
      });
    } catch (error) {
      errorContainer.classList.remove("invisible");
      console.error("Error while trying to delete your account", error);
      errorText.textContent = "Error deleting account";
      toggleConfirmDeleteButtonState();
      return;
    }

    if (!response.ok) {
      errorContainer.classList.remove("invisible");

      let jsonResponse;
      try {
        jsonResponse = await response.json();
      } catch (error) {
        console.error("Error while trying to delete your account", error);
        errorText.textContent = "Error deleting account";
        toggleConfirmDeleteButtonState();
        return;
      }
      errorText.textContent = jsonResponse.error;
      toggleConfirmDeleteButtonState();
      return;
    }

    window.location.href = process.env.SUB_DOMAIN_URL as string;
  }
}

deleteAccountConfirmButton.addEventListener("click", submitDeleteAccount);
deleteAccountInput.addEventListener("keyup", (event) => {
  const deleteAccountInputValue = deleteAccountInput.value;

  if (event.key === "Enter" && deleteAccountInputValue.length > 0) {
    submitDeleteAccount();
  }
});

deleteAccountInput.addEventListener("input", () => {
  const deleteAccountInputValue = deleteAccountInput.value;

  if (deleteAccountInputValue.length > 0) {
    deleteAccountConfirmButton.classList.remove("btn-disabled");
  } else {
    deleteAccountConfirmButton.classList.add("btn-disabled");
  }
});

declare const Delete_Account_Model: {
  showModal: () => void;
};
