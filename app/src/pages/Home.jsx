import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import bgImg from "/benvoliobg.png";
import logo from "/logo_itecify.png";

function Home() {
  const [projectId, setProjectId] = useState("");
  const navigate = useNavigate();

  const handleJoin = (e) => {
    e.preventDefault();
    if (!projectId) return alert("Please enter a project ID!");
    navigate(`/join-project?id=${projectId}`);
  };

  return (
    <div
      style={{
        backgroundImage: `url(${bgImg})`,
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        backgroundSize: "cover",
        fontFamily: "'Changa One', sans-serif",
        padding: "20px",
        textAlign: "center",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ marginBottom: "60px" }}>
        Welcome to{" "}
        <img
          src={logo}
          alt="iTECify Logo"
          width="200"
          height="100"
          style={{ verticalAlign: "middle", marginLeft: "10px" }}
        />
        !
      </h1>

      <section style={{ marginBottom: "32px" }}>
        <h2>Join a project</h2>
        <form
          onSubmit={handleJoin}
          style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}
        >
          <input
            type="text"
            placeholder="Enter Project ID..."
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "4px", width: "100%", maxWidth: "300px" }}
          />
          <input type="submit" value="Join" style={{ padding: "8px 16px", cursor: "pointer" }} />
        </form>
      </section>

      <section>
        <h2>Create a project</h2>
        <button
          onClick={() => navigate("/create-project")}
          style={{ padding: "8px 16px", cursor: "pointer" }}
        >
          Click here to create a new project!
        </button>
      </section>
    </div>
  );
}

export default Home;