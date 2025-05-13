import { db } from "@/lib/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";

export const saveUserToFirestore = async (user: any) => {
  const userRef = doc(db, "users", user.uid);
  await setDoc(userRef, {
    name: user.displayName || "",
    email: user.email,
    role: "client",
  });
};
