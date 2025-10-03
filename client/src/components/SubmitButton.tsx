import React from "react";

export default function SubmitButton({
  isSubmiting,
  id,
}: {
  isSubmiting: boolean;
  id?: string;
}) {
  return (
    <button
      type="submit"
      id={id ? id : "submit-button"}
      className="btn btn-accent text-lg w-32"
      disabled={isSubmiting}
    >
      {isSubmiting ? (
        <>
          <span className="loading loading-spinner"></span>
          <span>Submitting</span>
        </>
      ) : (
        "Submit"
      )}
    </button>
  );
}
