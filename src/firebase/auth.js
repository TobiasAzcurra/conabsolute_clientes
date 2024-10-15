import { projectAuth, provider } from "./config";

const signInWithGoogle = async () => {
  try {
    const result = await projectAuth.signInWithPopup(provider);
    // Esto te dará un objeto con los detalles del usuario
    const user = result.user;

    return user;
  } catch (error) {
    console.error("Error al iniciar sesión con Google: ", error);
  }
};

export { signInWithGoogle };
