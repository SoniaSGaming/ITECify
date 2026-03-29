import React from "react";
import { Link } from "react-router-dom";
import benvolioHead from "/BIG_benvolio_HEAD.png";
import "./mystyle.css";

function Menu() {
  return (
    <div style={styles.body}>
      <div style={styles.nav}>
        <Link to="/"><button>Home</button></Link>
        <Link to="/whatis-itecify"><button>What is iTECify?</button></Link>
        <Link to="/about-benvolio"><button>About Benvolio</button></Link>
      </div>

      <img
        src={benvolioHead}
        alt="Benvolio"
        width="120"
        height="70"
        style={styles.image}
      />
    </div>
  );
}

const styles = {
  body: {
    backgroundColor: "#402013",
    minHeight: "80px",
    position: "relative",
  },
  nav: {
    padding: "10px",
    display: "flex",
    gap: "12px",
  },
  image: {
    position: "absolute",
    right: "25px",
    top: "3px",
  },
};

export default Menu;