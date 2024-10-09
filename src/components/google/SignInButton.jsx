import React from "react";
import { signInWithGoogle } from "../../firebase/auth";

const SignInButton = () => {
  return (
    <button onClick={signInWithGoogle} className="btn btn-primary">
      Iniciar sesión con Google
    </button>
  );
};

export default SignInButton;
