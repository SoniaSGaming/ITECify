import React, { useState } from "react";
import "./mystyle.css";
import bgImg from "/bamboo_bg.png"; // adjust path if needed
import Select from "../components/Select";

function CreateProject() {
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Project created (placeholder)");
  };

  const [roomId, setRoomId] = useState('');
  const [language, setLanguage] = useState('');

  const languages=['php', 'javascript', 'cpp', 'html', 'css', 'python']

  return (
    <div style={{ ...styles.body, backgroundImage: `url(${bgImg})` }}>
      <h1>Create a project</h1>

      <p style={styles.paragraph}>
        Choose the programming language you wish to use for your project:
        <Select items={languages} heading="Choose" onSelect={setLanguage}></Select>
        <br />
        <input type="text" onChange={(value) => setRoomId(value)}/>
        <br />
        After you create your project you will see the project ID on the
        interface, share the ID with your collaborators to start coding
        together!
        <br />
        <br />
        If you have any additional questions, feel free to ask BENVOLIO!
      </p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input type="submit" value="Create" />
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
    textAlign: "center",
    minHeight: "100vh",
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
  form: {
    display: "flex",
    justifyContent: "center",
  },
  button: {
    marginLeft: "10px",
  },
};

export default CreateProject;