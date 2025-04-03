// import React, { useState, useEffect } from "react";
// import { Container, Button, Card, Form, Spinner } from "react-bootstrap";
// import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
// import axios from "axios";
// import "bootstrap/dist/css/bootstrap.min.css";
// import "./App.css";

// function App() {
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [extractedText, setExtractedText] = useState("");
//   const [jobDescription, setJobDescription] = useState("");
//   const [resumeScore, setResumeScore] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [skillScores, setSkillScores] = useState([]);
//   const [darkMode, setDarkMode] = useState(localStorage.getItem("theme") === "dark");

//   useEffect(() => {
//     if (darkMode) {
//       document.body.classList.add("dark-mode");
//       document.body.classList.remove("light-mode");
//       localStorage.setItem("theme", "dark");
//     } else {
//       document.body.classList.add("light-mode");
//       document.body.classList.remove("dark-mode");
//       localStorage.setItem("theme", "light");
//     }
//   }, [darkMode]);

//   const handleFileChange = (event) => {
//     setSelectedFile(event.target.files[0]);
//     setExtractedText("");
//     setResumeScore(null);
//     setSkillScores([]);
//   };

//   const handleUpload = async () => {
//     if (!selectedFile || !jobDescription) {
//       alert("Please select a file and enter a job description!");
//       return;
//     }

//     setLoading(true);
//     const formData = new FormData();
//     formData.append("file", selectedFile);
//     formData.append("job_description", jobDescription);

//     try {
//       const response = await axios.post("http://localhost:8000/upload/", formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       if (response.data) {
//         setExtractedText(response.data.text || "No text extracted.");
//         setResumeScore(response.data.score || 0);
//         setSkillScores(
//           response.data.analysis?.skill_scores
//             ? Object.entries(response.data.analysis.skill_scores).map(([skill, score]) => ({ skill, score }))
//             : []
//         );
//       } else {
//         throw new Error("Invalid response data");
//       }
//     } catch (error) {
//       console.error("Upload failed:", error);
//       alert("Error uploading file. Check console for details.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const highlightKeywords = (text) => {
//     if (!text) return "";
//     const keywords = ["Name", "Email", "Phone", "Contact", "Experience", "Skills"];
//     const regex = new RegExp(`\\b(${keywords.join("|")})\\b`, "gi");
//     return text.replace(regex, (match) => `<span class="highlight">${match}</span>`);
//   };

//   return (
//     <Container className="text-center mt-5">
//       <Card className="p-4 shadow-lg">
//         <h1 className="mb-3">Resume Screener</h1>
//         <p className="lead">Upload your resume & paste a job description to get AI-powered analysis.</p>

//         <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
//           {darkMode ? "Light Mode 🌞" : "Dark Mode 🌙"}
//         </button>

//         <Form>
//           <Form.Group controlId="formFile" className="mb-3">
//             <Form.Label>Upload Your Resume (PDF or DOCX)</Form.Label>
//             <Form.Control type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
//           </Form.Group>

//           <Form.Group controlId="jobDescription" className="mb-3">
//             <Form.Label>Paste Job Description</Form.Label>
//             <Form.Control
//               as="textarea"
//               rows={3}
//               placeholder="Paste job description here..."
//               value={jobDescription}
//               onChange={(e) => setJobDescription(e.target.value)}
//             />
//           </Form.Group>

//           <Button variant="primary" onClick={handleUpload} disabled={loading}>
//             {loading ? <Spinner animation="border" size="sm" /> : "Upload & Analyze"}
//           </Button>
//         </Form>

//         {resumeScore !== null && (
//           <Card className="mt-4 p-3">
//             <h4>Resume Score: <strong>{resumeScore}%</strong></h4>
//           </Card>
//         )}

//         {extractedText && (
//           <Card className="mt-4 p-3 extracted-text-card">
//             <h4 className="text-center">Extracted Text</h4>
//             <div className="text-container">
//               <pre className="extracted-text" dangerouslySetInnerHTML={{ __html: highlightKeywords(extractedText) }}></pre>
//             </div>
//           </Card>
//         )}

//         {skillScores.length > 0 && (
//           <div>
//             <h4>Skills Match</h4>
//             <ResponsiveContainer width="100%" height={300}>
//               <BarChart data={skillScores}>
//                 <XAxis dataKey="skill" />
//                 <YAxis />
//                 <Tooltip />
//                 <Bar dataKey="score" fill="#8884d8" />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         )}
//       </Card>
//     </Container>
//   );
// }

// export default App;


import React, { useState, useEffect } from "react";
import { Container, Button, Card, Form, Spinner } from "react-bootstrap";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeScore, setResumeScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [skillScores, setSkillScores] = useState([]);
  const [darkMode, setDarkMode] = useState(localStorage.getItem("theme") === "dark");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterScore, setFilterScore] = useState(0);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
      document.body.classList.remove("light-mode");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.add("light-mode");
      document.body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setExtractedText("");
    setResumeScore(null);
  };

  const handleUpload = async () => {
    if (!selectedFile || !jobDescription) {
      alert("Please select a file and enter a job description!");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("job_description", jobDescription);

    try {
      const response = await axios.post("http://localhost:8000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSkillScores(
        response.data.analysis.skill_scores
          ? Object.entries(response.data.analysis.skill_scores).map(([skill, score]) => ({ skill, score }))
          : []
      );
      setResumeScore(response.data.score);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Error uploading file. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const filteredSkills = skillScores.filter(({ skill, score }) => 
    skill.toLowerCase().includes(searchQuery.toLowerCase()) && score >= filterScore
  );

  const highlightKeywords = (text) => {
    if (!text) return "";
    const keywords = ["Name", "Email", "Phone", "Contact", "Experience", "Skills"];
    const regex = new RegExp(`\\b(${keywords.join("|")})\\b`, "gi");
    return text.replace(regex, (match) => `<span class="highlight">${match}</span>`);
  };

  const getColor = (score) => {
    const intensity = Math.round((score / 100) * 255);
    return `rgb(${255 - intensity}, ${intensity}, 150)`;
  };

  return (
    <Container className="text-center mt-5">
      <Card className="p-4 shadow-lg">
        <h1 className="mb-3">Resume Screener</h1>
        <p className="lead">Upload your resume & paste a job description to get AI-powered analysis.</p>

        <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "Light Mode 🌞" : "Dark Mode 🌙"}
        </button>

        <Form>
          <Form.Group controlId="formFile" className="mb-3">
            <Form.Label>Upload Your Resume (PDF or DOCX)</Form.Label>
            <Form.Control type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
          </Form.Group>

          <Form.Group controlId="jobDescription" className="mb-3">
            <Form.Label>Paste Job Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Paste job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </Form.Group>

          <Button variant="primary" onClick={handleUpload} disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" /> : "Upload & Analyze"}
          </Button>
        </Form>

        {resumeScore !== null && (
          <Card className="mt-4 p-3">
            <h4>Resume Score: <strong>{resumeScore}%</strong></h4>
          </Card>
        )}

        {extractedText && (
          <Card className="mt-4 p-3 extracted-text-card">
            <h4 className="text-center">Extracted Text</h4>
            <div className="text-container">
              <pre className="extracted-text" dangerouslySetInnerHTML={{ __html: highlightKeywords(extractedText) }}></pre>
            </div>
          </Card>
        )}

        {/* Search & Filter */}
        <div className="mt-4">
          <Form.Control
            type="text"
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-2"
          />
          <Form.Label>Minimum Score</Form.Label>
          <Form.Control
            type="range"
            min="0"
            max="100"
            value={filterScore}
            onChange={(e) => setFilterScore(Number(e.target.value))}
          />
        </div>

      {filteredSkills.length > 0 && (
        <div className="mt-4">
          <h4 className={darkMode ? "text-white" : ""}>Skills Match</h4>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={filteredSkills} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <XAxis 
                dataKey="skill" 
                height={50} /* Extra space for multi-line text */
                interval={0} /* Show all labels */
                tickMargin={10}
                tick={({ x, y, payload }) => {
                  const words = payload.value.split(" ");
                  return (
                    <g transform={`translate(${x},${y})`}>
                      {words.map((word, index) => (
                        <text
                          key={index}
                          x={0}
                          y={index * 12}
                          dy={12}
                          textAnchor="middle"
                          fontSize={12}
                          fill={darkMode ? "white" : "black"}
                        >
                          {word}
                        </text>
                      ))}
                    </g>
                  );
                }}
              />
              <YAxis domain={[0, 100]} tick={{ fill: darkMode ? "white" : "black" }} />
              <Tooltip />
              <Bar dataKey="score" fill="#bb4dff" /> {/* 🟣 Purple Bars */}
              <LabelList dataKey="score" position="top" fill={darkMode ? "white" : "black"} fontSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      </Card>
    </Container>
  );
}

export default App;


