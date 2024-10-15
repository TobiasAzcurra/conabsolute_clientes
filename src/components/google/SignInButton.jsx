import { signInWithGoogle } from "../../firebase/auth";
import { useDispatch } from "react-redux";
import { setUser } from "../../redux/user/userSlice"; // Importa la acción setUser
import { doc, getDoc, setDoc, getFirestore } from "firebase/firestore";

const SignInButton = () => {
  const dispatch = useDispatch();

  const handleSignIn = async () => {
    const user = await signInWithGoogle(); // Llama a la función de autenticación

    if (user) {
      // Verifica si el usuario ya existe en Firestore
      const firestore = getFirestore();
      const userDocRef = doc(firestore, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Si no existe, lo agregamos
        await setDoc(userDocRef, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
        });
        console.log("Usuario agregado a Firestore");
      }

      // Despacha el usuario al estado de Redux
      dispatch(setUser(user));
    }
  };

  return (
    <button onClick={handleSignIn} className="btn btn-primary">
      Iniciar sesión con Google
    </button>
  );
};

export default SignInButton;
