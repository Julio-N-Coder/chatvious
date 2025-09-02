import { NavLink } from "react-router";
import { FormEvent, ChangeEvent, useState } from "react";
import ErrorPopup from "../../components/ErrorPopup";
import SubmitButton from "../../components/SubmitButton";
import { UserSvg, KeySvg } from "../../components/svg/Svg";
import React from "react";

export default function AuthLayout({ type }: { type: string }) {
  let [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  let [isSubmiting, setIsSubmiting] = useState(false);
  let [hidePopUp, setHidePopUp] = useState(true);
  let [popUpMessage, setPopUpMessage] = useState("");

  function handleChangeEvent(event: ChangeEvent<HTMLInputElement>) {
    const type = event.currentTarget.id;
    const value = event.currentTarget.value;

    setFormData({
      ...formData,
      [type]: value,
    });
  }

  function validateData(): boolean {
    const username = formData.username;
    const password = formData.password;
    if (!username || username.length < 3 || username.length > 20) {
      console.error("Username not Valid");
      toggleSubmitState();
      return false;
    }
    if (!password || password.length < 2 || password.length > 100) {
      console.error("Password not Valid");
      toggleSubmitState();
      return false;
    }

    return true;
  }

  function showPopUp(message: string) {
    setPopUpMessage(message);
    setHidePopUp(false);

    setTimeout(() => {
      setPopUpMessage("");
      setHidePopUp(true);
    }, 5000);
  }

  function toggleSubmitState() {
    setIsSubmiting((prevState) => !prevState);
    document.getElementById("authPageLink")?.classList.toggle("btn-disabled");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    toggleSubmitState();

    if (!validateData()) return;

    console.log("handle data here");
  }

  return (
    <div className="flex flex-grow flex-col gap-8 justify-center items-center relative">
      <ErrorPopup
        className="absolute top-0"
        message={popUpMessage}
        hidden={hidePopUp}
      />
      <div className="bg-base-200 p-4 rounded-2xl flex flex-col items-center gap-4">
        <form onSubmit={handleSubmit} className="flex flex-col items-center">
          <fieldset>
            <div>
              <label htmlFor="username">
                <legend className="fieldset-legend text-lg">Username</legend>
              </label>
              <label className="input validator w-96" id="username-label">
                <UserSvg />
                <input
                  type="input"
                  id="username"
                  required
                  minLength={3}
                  maxLength={20}
                  placeholder="Username"
                  onChange={handleChangeEvent}
                />
              </label>
              <div className="validator-hint">Must be 3 to 30 characters</div>
            </div>
            <div>
              <label htmlFor="password">
                <legend className="fieldset-legend text-lg">Password</legend>
              </label>
              {/* password input */}
              <label className="input validator w-96" id="password-label">
                <KeySvg />
                <input
                  type="password"
                  id="password"
                  placeholder="Password"
                  required
                  minLength={2}
                  maxLength={100}
                  onChange={handleChangeEvent}
                />
              </label>
              <div className="validator-hint">Must be 2 to 100 characters</div>
            </div>
          </fieldset>
          <SubmitButton isSubmiting={isSubmiting} />
        </form>
        <div className="flex flex-col">
          {type === "signup" ? (
            <p>Have an Account?</p>
          ) : (
            <p>Don't have an account?</p>
          )}
          <NavLink
            id="authPageLink"
            to={type == "signup" ? "/login" : "/signup"}
            className="btn btn-accent text-xl"
          >
            {type == "signup" ? "Login" : "SignUp"}
          </NavLink>
        </div>
      </div>
    </div>
  );
}
