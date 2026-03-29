import React, { useState } from "react";
import "./mystyle.css";
import bgImg from "/bamboo_bg.png"; // adjust path if needed

function SignIn() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Sign in data:", formData);
  };

  return (
    <div style={{ ...styles.body, backgroundImage: `url(${bgImg})` }}>
      <form onSubmit={handleSubmit}>
        <div style={styles.container}>
          <h1>Sign In</h1>
          <p>Please fill in this form to sign in to your account.</p>

          <div style={styles.formGroup}>
            <label htmlFor="email">
              <b>Username</b>
            </label>
            <input
              type="text"
              placeholder="Enter Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="psw">
              <b>Password</b>
            </label>
            <input
              type="password"
              placeholder="Enter Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.buttons}>
            <button type="button" style={styles.cancelBtn}>
              Cancel
            </button>
            <button type="submit" style={styles.signinBtn}>
              Sign In
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

const styles = {
  body: {
    backgroundRepeat: "no-repeat",
    backgroundAttachment: "fixed",
    backgroundSize: "cover",
    fontFamily: "sans-serif",
    padding: "20px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
  },
  container: {
    backgroundColor: "#ffeed1",
    border: "6.7px solid #cc8c47",
    borderRadius: "20px",
    padding: "30px",
    width: "90%",
    maxWidth: "500px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    marginBottom: "16px",
    width: "80%",
    marginLeft: "auto",
    marginRight: "auto",
  },
  input: {
    width: "100%",
    padding: "10px",
    fontSize: "16px",
  },
  buttons: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "8px",
  },
  cancelBtn: {
    backgroundColor: "#402013",
    color: "white",
    padding: "10px 16px",
    border: "none",
    cursor: "pointer",
  },
  signinBtn: {
    backgroundColor: "#e94d32",
    color: "white",
    padding: "10px 16px",
    border: "none",
    cursor: "pointer",
  },
};

export default SignIn;