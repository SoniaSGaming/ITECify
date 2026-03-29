import React from "react";
import "./mystyle.css";
import bgImg from "/bamboo_bg.png"; // adjust path
import logo from "/logo_itecify.png"; // adjust path

function WhatIsITECify() {
  return (
    <div style={{ ...styles.body, backgroundImage: `url(${bgImg})` }}>
      <h1 style={styles.heading}>
        What is{" "}
        <img
          src={logo}
          alt="iTECify logo"
          width="200"
          height="100"
          style={styles.logo}
        />
        ?
      </h1>

      <p style={styles.paragraph}>
        iTECify is a collaborative compiler built for teams working on the same
        code in real time. It allows multiple users to edit simultaneously, see
        live changes, and easily share feedback, making teamwork faster and more
        efficient.
        <br />
        <br />
        iTECify introduces a multi-user editor with AI-assisted coding.
        Human-written code remains standard, while AI-generated suggestions
        appear as interactive blocks that can be accepted or rejected with a
        single click.
        <br />
        <br />
        The platform also supports multiple languages like Cpp, PHP, JavaScript,
        Python, and HTML. Code is scanned for vulnerabilities before running,
        and execution results are streamed back instantly, giving users
        real-time feedback.
        <br />
        <br />
        Overall, iTECify combines collaboration, AI assistance, and secure
        execution into one powerful coding platform.
      </p>
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
    textAlign: "center",
    minHeight: "100vh",
  },
  heading: {
    marginBottom: "24px",
  },
  paragraph: {
    marginLeft: "auto",
    marginRight: "auto",
    maxWidth: "800px",
    width: "90%",
    marginBottom: "16px",
    lineHeight: "1.7",
    textAlign: "left",
  },
  logo: {
    verticalAlign: "middle",
    marginLeft: "10px",
  },
};

export default WhatIsITECify;