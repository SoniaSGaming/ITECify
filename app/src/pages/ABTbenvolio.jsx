import React from "react";
import "./mystyle.css";

function Benvolio() {
  return (
    <div style={styles.body}>
      <h1>Who is Benvolio?</h1>

      <p style={styles.paragraph}>
        <span>Benvolio</span> is our mascot! <br />
        He used to be a regular red panda, living in a bamboo forest along with
        his friend and family!
        <br />
        Once upon a time, Benvolio, while searching for food, stumbled upon a
        laptop, and like any normal red panda, he started learning to code!
        <br />
        He found his passion for programming and now he found a job in helping
        people with their code!
        <br />
        <br />
        Benvolio's favorite snack is bamboo, so make sure you feed him from time
        to time! (You get one piece of bamboo for every 30 minutes spent on
        iTECify!)
        <br />
        <br />

        BAMBOO COUNTER: <button>placeholder!!!!!!</button>
        <img
          src="/benvotransparent.png"
          alt="Benvolio"
          width="200"
          height="300"
          style={styles.image}
        />
        <br />

        FEED BENVOLIO: <button>PLACEHOLDER</button>
        <br />

        HOW MANY TIMES YOU FED BENVOLIO: <button>PLACEHOLDER</button>
      </p>
    </div>
  );
}

const styles = {
  body: {
    backgroundImage: "url('/bamboo_bg.png')",
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
  image: {
    float: "right",
    margin: "0 0 10px 20px",
  },
};

export default Benvolio;