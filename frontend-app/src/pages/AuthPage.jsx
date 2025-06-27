import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Login from "./Login";
import Signup from "./Signup";
import styles from "./AuthStyles.module.css";

export default function AuthPage() {
  const [isSignUpActive, setIsSignUpActive] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (token && role) {
      navigate(`/${role.toLowerCase()}-dashboard`);
    }
  }, []);

  return (
    <div>
      <div
        className={`${styles.container} ${
          isSignUpActive ? styles["right-panel-active"] : ""
        }`}
        id="container"
      >
        <div
          className={`${styles["form-container"]} ${styles["sign-up-container"]}`}
        >
          <Signup
            key={isSignUpActive ? "signup-active" : "signup-inactive"}
            onSignupSuccess={() => setIsSignUpActive(false)}
          />
        </div>
        <div
          className={`${styles["form-container"]} ${styles["sign-in-container"]}`}
        >
          <Login
            key={isSignUpActive ? "login-inactive" : "login-active"}
            onLoginSuccess={(role) =>
              navigate(`/${role.toLowerCase()}-dashboard`)
            }
          />
        </div>

        <div className={styles["overlay-container"]}>
          <div className={styles.overlay}>
            <div
              className={`${styles["overlay-panel"]} ${styles["overlay-left"]}`}
            >
              <h1>Welcome Back!</h1>
              <p>
                To keep connected with us please login with your personal info
              </p>
              {isSignUpActive && (
                <button
                  className={`${styles.button} ${styles.ghost}`}
                  onClick={() => setIsSignUpActive(false)}
                >
                  Sign In
                </button>
              )}
            </div>
            <div
              className={`${styles["overlay-panel"]} ${styles["overlay-right"]}`}
            >
              <h1>Hello, Friend!</h1>
              <p>Enter your details and start your journey with us</p>
              {!isSignUpActive && (
                <button
                  className={`${styles.button} ${styles.ghost}`}
                  onClick={() => setIsSignUpActive(true)}
                >
                  Sign Up
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
