import React, { useState } from "react";
import axios from "axios";
import { Box, Button, Card, CardContent, Typography, Input, CircularProgress } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

const UploadResume = () => {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState("");
    const [extractedText, setExtractedText] = useState("");
    const [resumeAnalysis, setResumeAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleUpload = async () => {
        if (!file) {
            setMessage("Please select a file first!");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await axios.post("http://192.168.1.40:8000/upload/", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setExtractedText(response.data.resume_text);
            setResumeAnalysis(response.data.analysis);
            setMessage(response.data.message);
        } catch (error) {
            console.error("Upload failed:", error);
            setMessage("Upload failed. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100vh",
                bgcolor: "background.default",
                color: "text.primary",
                p: 3,
            }}
        >
            <Card sx={{ maxWidth: 500, p: 3, boxShadow: 5 }}>
                <CardContent sx={{ textAlign: "center" }}>
                    <Typography variant="h4" gutterBottom>
                        Upload Your Resume
                    </Typography>
                    <Input
                        type="file"
                        onChange={(e) => setFile(e.target.files[0])}
                        sx={{ mt: 2, mb: 2, width: "100%" }}
                    />
                    <Button
                        variant="contained"
                        startIcon={<CloudUploadIcon />}
                        onClick={handleUpload}
                        sx={{ mt: 2 }}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Upload Resume"}
                    </Button>
                    <Typography variant="body1" sx={{ mt: 2 }}>
                        {message}
                    </Typography>
                </CardContent>
            </Card>

            {resumeAnalysis && (
                <Card sx={{ maxWidth: 500, mt: 3, p: 3, boxShadow: 3 }}>
                    <Typography variant="h6">Extracted Resume Data:</Typography>
                    <Typography><strong>Skills:</strong> {resumeAnalysis.skills.join(", ")}</Typography>
                    <Typography><strong>Education:</strong> {resumeAnalysis.education.join(", ")}</Typography>
                    <Typography><strong>Experience:</strong> {resumeAnalysis.experience}</Typography>
                    <Typography><strong>Email:</strong> {resumeAnalysis.email}</Typography>
                    <Typography><strong>Phone:</strong> {resumeAnalysis.phone}</Typography>
                </Card>
            )}
        </Box>
    );
};

export default UploadResume;
