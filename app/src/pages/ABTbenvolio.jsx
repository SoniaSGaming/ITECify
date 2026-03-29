import React, { useState, useEffect } from "react";
import "./mystyle.css";

function Benvolio() {
  // State to track bamboo and times fed
  const [bambooCount, setBambooCount] = useState(0);
  const [fedCount, setFedCount] = useState(0);

  useEffect(() => {
    // Set up an interval to run every 10 minutes (600,000 milliseconds)
    const interval = setInterval(() => {
      setBambooCount((prevCount) => prevCount + 1);
    }, 600);

    // Clean up the interval if the user leaves the page
    return () => clearInterval(interval);
  }, []);

  const handleFeed = () => {
    if (bambooCount > 0) {
      setBambooCount(bambooCount - 1);
      setFedCount(fedCount + 1);
    } else {
      alert("No bamboo left! Wait for the timer or keep coding!");
    }
  };

  return (
    <div style={styles.body}>
      <h1>Who is Benvolio?</h1>

      <div style={styles.paragraph}>
        <p>
          <span style={{ fontWeight: "bold", color: "#d9534f" }}>Benvolio</span> is our mascot! <br />
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
          to time! (You get one piece of bamboo for every second spent on
          iTECify!)
        </p>

        <hr />

        <div style={styles.counterSection}>
          <img
            src="/benvotransparent.png"
            alt="Benvolio"
            width="200"
            height="250"
            style={styles.image}
          />
          
          <p>BAMBOO COUNTER: <strong>{bambooCount}</strong></p>
          
          <p>
            FEED BENVOLIO: <button onClick={handleFeed} style={styles.button}>Give Bamboo 🌿</button>
          </p>

          <p>HOW MANY TIMES YOU FED BENVOLIO: <strong>{fedCount}</strong></p>
        </div>
      </div>
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
    backgroundColor: "rgba(255, 255, 255, 0.8)", // Added for readability
    padding: "20px",
    borderRadius: "15px",
    lineHeight: "1.7",
    textAlign: "left",
  },
  image: {
    float: "right",
    margin: "0 0 10px 20px",
    marginBottom: '-20px'
  },
  button: {
    padding: "10px 20px",
    cursor: "pointer",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "5px",
    fontWeight: "bold"
  },
  counterSection: {
    clear: "both"
  }
};

export default Benvolio;